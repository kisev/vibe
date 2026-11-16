# Spec Delta

## ADDED Requirements

### Requirement: The browser suite runs against a built app

The desktop browser-mode suite SHALL build the frontend with the Tauri mock enabled and serve the built bundle through `vite preview`, rather than running the Vite dev server. The dev server's per-module requests and on-demand transforms SHALL NOT be part of the suite's startup path.

The mock is enabled by the `e2e` Vite build mode (`vite build --mode e2e`), which `desktop/src/main.tsx` reads as `import.meta.env.MODE === 'e2e'`. A default `vite build` never carries it.

#### Scenario: Suite startup

- **WHEN** the suite starts
- **THEN** it runs `pnpm build:e2e` and serves the resulting `desktop/dist` on the suite's port, instead of starting `vite dev`

#### Scenario: Production builds stay mock-free

- **WHEN** the app is built without `--mode e2e`
- **THEN** the Tauri mock is not part of the bundle and the app talks to the real backend

#### Scenario: A failing spec means the app

- **WHEN** a spec fails at boot
- **THEN** the bundle it loaded is the same one the build produced, so the failure is not an artefact of on-demand module compilation

### Requirement: Retries are a fallback, not the gate

The suite SHALL pass without retries on the development workstation. A retry MAY stay configured only while a documented host-level cause exists, and the change that adds preview SHALL record whether runs still need it.

#### Scenario: Repeated clean runs

- **WHEN** the suite runs twice in a row on the workstation
- **THEN** both runs pass with no retried spec

#### Scenario: The workaround is removed

- **WHEN** preview removes the boot failure
- **THEN** `retries` is `0` and the worker cap added for the dev server is gone; with preview, three consecutive runs on the WSL host passed with `retries: 0` and the default worker count
