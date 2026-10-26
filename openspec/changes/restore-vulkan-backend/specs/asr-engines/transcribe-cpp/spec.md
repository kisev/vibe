# Spec Delta

## Purpose

Restores the GPU support the unified-engine port dropped: platform GPU backends compiled into the server so devices enumerate and models load on the GPU again, with no new runtime requirements for users.

## ADDED Requirements

### Requirement: GPU backends per platform

The engine SHALL ship with the Vulkan GPU backend on Windows and Linux and the Metal backend on macOS, so a machine with a working GPU driver lists its devices and loads models on them; strict-CPU requests SHALL keep running without any GPU backend, and a machine without a usable Vulkan loader SHALL behave exactly like a CPU-only build.

#### Scenario: Enumeration on a Vulkan machine

- **WHEN** the server's device listing runs on a Windows or Linux machine with a Vulkan-capable GPU and current driver
- **THEN** the GPU appears in the device list and selecting it loads the model on that GPU

#### Scenario: Machine without a usable loader

- **WHEN** the server runs where no Vulkan loader or driver is available
- **THEN** the device list is empty and transcription proceeds on CPU, with no crash or new runtime dependency

#### Scenario: Explicit CPU choice is untouched

- **WHEN** a load requests strict CPU
- **THEN** the model loads and transcribes on CPU regardless of the GPU backends compiled in

#### Scenario: GPU failure keeps the CPU fallback

- **WHEN** a GPU load fails on a machine whose GPU otherwise enumerates
- **THEN** the desktop reloads the model on CPU and reports the fallback, as it does today
