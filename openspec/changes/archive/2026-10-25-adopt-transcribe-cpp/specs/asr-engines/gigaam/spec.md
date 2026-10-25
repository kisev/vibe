# Spec Delta

## REMOVED Requirements

### Requirement: GigaAM model detection

**Reason**: The hand-written GigaAM Rust engine is replaced by the unified transcribe.cpp engine, which performs family detection from GGUF metadata for all families at once.
**Migration**: GigaAM GGUF models keep loading through the unified engine; detection requirements live in `asr-engines/transcribe-cpp`.

### Requirement: Supported variants

**Reason**: Variant support moves to the unified engine, which runs all four published v3 variants from catalog files.
**Migration**: The same four variant files continue to transcribe under `asr-engines/transcribe-cpp`.

### Requirement: Russian-only language contract

**Reason**: The language contract is now expressed as per-family capability metadata (supported languages, `unsupported_language` behavior included) rather than engine-specific code.
**Migration**: GigaAM keeps accepting `ru` and rejecting other languages with `unsupported_language`, enforced through the unified engine's capability contract.

### Requirement: Short-form input bound

**Reason**: Input bounds are owned by the long-form chunk planner and per-family windows, not by an engine-specific splitting rule.
**Migration**: GigaAM keeps its about-25-second window via the planner; see `long-form-chunk-planning` and `asr-engines/transcribe-cpp`.

### Requirement: VAD is mandatory for GigaAM

**Reason**: The VAD requirement is a capability flag reported per family and enforced uniformly by request validation.
**Migration**: GigaAM keeps `requires_vad` in metadata; requests without a VAD model fail exactly as before.

### Requirement: Timestamped output

**Reason**: Timestamp production is a capability flag and per-family output behavior of the unified engine.
**Migration**: GigaAM segments keep start/end times derived from token timing.

### Requirement: Unsupported options are rejected

**Reason**: Option rejection is driven by capability flags and shared validation, not engine-specific code.
**Migration**: Translation, prompts, and stable timestamps stay rejected for GigaAM; word-timestamp requests stay ignored in favor of segment timestamps.
