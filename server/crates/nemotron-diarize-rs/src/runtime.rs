//! GGML backend and graph plumbing: a GPU backend when one is available, else CPU.

use std::ffi::CStr;
use std::ptr;
use std::time::Instant;

use crate::{sys, Error, Result};

pub(crate) type Tensor = *mut sys::ggml_tensor;

pub(crate) enum Input<'a> {
    F32(&'a [f32]),
    I32(&'a [i32]),
}

impl Input<'_> {
    fn bytes(&self) -> (*const std::ffi::c_void, usize) {
        match self {
            Input::F32(values) => (values.as_ptr().cast(), std::mem::size_of_val(*values)),
            Input::I32(values) => (values.as_ptr().cast(), std::mem::size_of_val(*values)),
        }
    }
}

pub(crate) struct Runtime {
    backend: sys::ggml_backend_t,
    owned: bool,
    name: String,
}

// SAFETY: the backend (its CPU thread pool or device context) may only be
// accessed from one thread at a time. Every `Diarizer` method takes `&mut self`,
// so ownership can move between threads but the runtime is never shared.
unsafe impl Send for Runtime {}

impl Runtime {
    /// Uses `device` (the backend the weights live on) or a fresh CPU backend.
    pub fn new(device: Option<sys::ggml_backend_t>) -> Result<Self> {
        let (backend, owned) = match device {
            Some(backend) => (backend, false),
            None => {
                let threads = cpu_threads();
                // SAFETY: the backend registry owns the returned handle and
                // nothing else references it before `Runtime` takes ownership.
                let backend = unsafe { init_cpu_backend(threads as i32) };
                if backend.is_null() {
                    return Err(Error::Ggml("cpu backend init"));
                }
                tracing::info!(threads, "cpu backend");
                (backend, true)
            }
        };
        // SAFETY: the name is a NUL-terminated string owned by the backend,
        // which stays alive for the lifetime of `Runtime`.
        let name = unsafe { backend_name(backend) };
        Ok(Self { backend, owned, name })
    }

    pub fn name(&self) -> &str {
        &self.name
    }

    /// Allocates the graph on first use, uploads `inputs` and computes it.
    pub unsafe fn execute(&self, graph: &mut Graph, inputs: &[(Tensor, Input)]) -> Result<()> {
        if graph.allocator.is_null() {
            let started = Instant::now();
            for (tensor, _) in inputs {
                sys::ggml_set_input(*tensor);
            }
            graph.allocator = sys::ggml_gallocr_new(sys::ggml_backend_get_default_buffer_type(self.backend));
            if graph.allocator.is_null() || !sys::ggml_gallocr_alloc_graph(graph.allocator, graph.graph) {
                // A failed allocation must not leave the half-built allocator
                // behind: the next `execute` skips the block and uploads into
                // tensors that have no buffer.
                if !graph.allocator.is_null() {
                    sys::ggml_gallocr_free(graph.allocator);
                    graph.allocator = ptr::null_mut();
                }
                return Err(Error::Ggml("ggml_gallocr_alloc_graph"));
            }
            tracing::debug!(
                nodes = sys::ggml_graph_n_nodes(graph.graph),
                compute_buffer_mb = sys::ggml_gallocr_get_buffer_size(graph.allocator, 0) as f64 / 1e6,
                ms = started.elapsed().as_secs_f64() * 1e3,
                "graph allocated"
            );
        }
        for (tensor, input) in inputs {
            let (data, size) = input.bytes();
            // `tensor_set` copies `size` bytes unconditionally; a mismatch would
            // write past the tensor's buffer across the FFI boundary.
            if size != sys::ggml_nbytes(*tensor) {
                return Err(Error::Ggml("input tensor size mismatch"));
            }
            sys::ggml_backend_tensor_set(*tensor, data, 0, size);
        }
        if sys::ggml_backend_graph_compute(self.backend, graph.graph) == sys::ggml_status_GGML_STATUS_SUCCESS {
            Ok(())
        } else {
            Err(Error::Ggml("ggml graph compute"))
        }
    }
}

impl Drop for Runtime {
    fn drop(&mut self) {
        if self.owned {
            // SAFETY: `owned` marks a backend created by this `Runtime`; it is
            // freed exactly once and no reference outlives the drop.
            unsafe { sys::ggml_backend_free(self.backend) };
        }
    }
}

/// Reads an F32 output tensor back to the host.
pub(crate) unsafe fn read_f32(tensor: Tensor) -> Result<Vec<f32>> {
    if (*tensor).type_ != sys::ggml_type_GGML_TYPE_F32 {
        return Err(Error::Ggml("output tensor is not F32"));
    }
    let count = sys::ggml_nelements(tensor) as usize;
    let mut data = vec![0.0f32; count];
    sys::ggml_backend_tensor_get(tensor, data.as_mut_ptr().cast(), 0, count * std::mem::size_of::<f32>());
    Ok(data)
}

/// Metadata arena for one graph context. A 31-layer step needs well under this;
/// ggml aborts the process rather than returning an error when it runs out.
const GRAPH_META_BYTES: usize = 32 * 1024 * 1024;
/// Node ceiling for `ggml_new_graph_custom`; the model graph is ~1.1k nodes.
const GRAPH_MAX_NODES: usize = 8192;

pub(crate) struct Graph {
    pub ctx: *mut sys::ggml_context,
    pub graph: *mut sys::ggml_cgraph,
    allocator: sys::ggml_gallocr_t,
}

impl Graph {
    pub fn new() -> Result<Self> {
        // SAFETY: `ggml_init` only reads the parameter block and allocates a
        // fresh metadata context; no pointer aliases another context.
        let ctx = unsafe {
            sys::ggml_init(sys::ggml_init_params {
                mem_size: GRAPH_META_BYTES,
                mem_buffer: ptr::null_mut(),
                no_alloc: true,
            })
        };
        if ctx.is_null() {
            return Err(Error::Ggml("ggml_init"));
        }
        // SAFETY: `ctx` is the live context created above; the graph refers to it.
        let graph = unsafe { sys::ggml_new_graph_custom(ctx, GRAPH_MAX_NODES, false) };
        if graph.is_null() {
            // SAFETY: freeing the context created in this function after its
            // graph could not be created.
            unsafe { sys::ggml_free(ctx) };
            return Err(Error::Ggml("ggml_new_graph_custom"));
        }
        Ok(Self {
            ctx,
            graph,
            allocator: ptr::null_mut(),
        })
    }

    pub unsafe fn output(&mut self, tensor: Tensor) {
        sys::ggml_set_output(tensor);
        sys::ggml_build_forward_expand(self.graph, tensor);
    }
}

impl Drop for Graph {
    fn drop(&mut self) {
        // SAFETY: both handles were created by this `Graph` and are freed once,
        // after the allocator that owns the graph's buffers.
        unsafe {
            if !self.allocator.is_null() {
                sys::ggml_gallocr_free(self.allocator);
            }
            sys::ggml_free(self.ctx);
        }
    }
}

pub(crate) unsafe fn backend_name(backend: sys::ggml_backend_t) -> String {
    let name = sys::ggml_backend_name(backend);
    if name.is_null() {
        "unknown".into()
    } else {
        CStr::from_ptr(name).to_string_lossy().into_owned()
    }
}

fn cpu_threads() -> usize {
    std::env::var("NEMOTRON_DIARIZE_THREADS")
        .ok()
        .and_then(|value| value.parse().ok())
        .filter(|&threads: &usize| threads > 0)
        .unwrap_or_else(|| {
            std::thread::available_parallelism()
                .map(|count| (count.get() * 4 / 5).max(1))
                .unwrap_or(4)
        })
}

/// Loads dynamically built backends once per process (a no-op on static builds).
pub(crate) fn load_backends_once() {
    static LOAD: std::sync::Once = std::sync::Once::new();
    // SAFETY: loading backends mutates process-global registry state; the
    // `Once` guarantees a single, synchronized call.
    LOAD.call_once(|| unsafe { sys::ggml_backend_load_all() });
}

/// Sets the thread count through the backend registry; the direct symbol is
/// missing from GGML_BACKEND_DL builds, where the CPU backend is a module.
unsafe fn set_backend_n_threads(backend: sys::ggml_backend_t, n_threads: i32) {
    let dev = sys::ggml_backend_get_device(backend);
    if dev.is_null() {
        return;
    }
    let reg = sys::ggml_backend_dev_backend_reg(dev);
    if reg.is_null() {
        return;
    }
    let addr = sys::ggml_backend_reg_get_proc_address(reg, c"ggml_backend_set_n_threads".as_ptr());
    if !addr.is_null() {
        let set_n_threads: sys::ggml_backend_set_n_threads_t = std::mem::transmute(addr);
        if let Some(set_n_threads) = set_n_threads {
            set_n_threads(backend, n_threads);
        }
    }
}

unsafe fn init_cpu_backend(n_threads: i32) -> sys::ggml_backend_t {
    load_backends_once();
    let backend = sys::ggml_backend_init_by_type(sys::ggml_backend_dev_type_GGML_BACKEND_DEVICE_TYPE_CPU, ptr::null());
    if !backend.is_null() {
        set_backend_n_threads(backend, n_threads);
    }
    backend
}
