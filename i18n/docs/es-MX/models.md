<!-- source: a147ada70d29 -->

# 🌟 Modelos de Vibe 🌟

¡Bienvenido a la página de Modelos de Vibe! Aquí encontrarás una lista curada de modelos sugeridos para usar con Vibe. Para instalar un modelo, elígelo en el catálogo de la configuración de Vibe — o copia y pega un enlace de descarga directa de esta página en la configuración.

## Grabaciones largas

Una grabación más larga que la ventana de entrada de un modelo se divide en fragmentos antes de la inferencia. Con el reconocimiento de hablantes habilitado, la división sigue los turnos detectados, así que ningún fragmento mezcla a dos hablantes, salvo donde se encuentran sus turnos: esas líneas muestran a ambos hablantes con un "?" y se pueden asignar a uno de ellos. GigaAM (25 s), Parakeet (30 s) y Nemotron (30 s) se dividen así; Whisper mantiene su propio procesamiento de formato largo.

Los fragmentos terminados se guardan en tu computadora, así que volver a ejecutar un archivo largo con la misma configuración retoma desde donde se detuvo. La caché guarda el texto de la transcripción, el plan de fragmentos y un sello del modelo —nunca el audio— y nunca sale de tu dispositivo. La aplicación elimina al iniciarse las entradas que no se hayan modificado en 30 días. En la línea de comandos, actívala con `--cache-dir <folder>` y elimina esa carpeta para vaciarla; `--chunk-seconds <n>` establece la duración planificada y no puede superar la ventana del modelo.

## Modelos disponibles

### 🦜 Parakeet Unified English 0.6B

Por Handy · 618M parámetros · Idiomas: en  
Admite streaming.

[👉 Ver modelo](https://huggingface.co/handy-computer/parakeet-unified-en-0.6b-gguf/tree/7e948f21b7bdbac698d3318db9d350f1096f3b6c)  
[🔽 Q8_0 · 731 MB](https://huggingface.co/handy-computer/parakeet-unified-en-0.6b-gguf/resolve/7e948f21b7bdbac698d3318db9d350f1096f3b6c/parakeet-unified-en-0.6b-Q8_0.gguf?download=true)  
[🔽 Q6_K · 602 MB](https://huggingface.co/handy-computer/parakeet-unified-en-0.6b-gguf/resolve/7e948f21b7bdbac698d3318db9d350f1096f3b6c/parakeet-unified-en-0.6b-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 541 MB](https://huggingface.co/handy-computer/parakeet-unified-en-0.6b-gguf/resolve/7e948f21b7bdbac698d3318db9d350f1096f3b6c/parakeet-unified-en-0.6b-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 477 MB](https://huggingface.co/handy-computer/parakeet-unified-en-0.6b-gguf/resolve/7e948f21b7bdbac698d3318db9d350f1096f3b6c/parakeet-unified-en-0.6b-Q4_K_M.gguf?download=true)  
[🔽 F16 · 1239 MB](https://huggingface.co/handy-computer/parakeet-unified-en-0.6b-gguf/resolve/7e948f21b7bdbac698d3318db9d350f1096f3b6c/parakeet-unified-en-0.6b-F16.gguf?download=true)  
[🔽 F32 · 2473 MB](https://huggingface.co/handy-computer/parakeet-unified-en-0.6b-gguf/resolve/7e948f21b7bdbac698d3318db9d350f1096f3b6c/parakeet-unified-en-0.6b-F32.gguf?download=true)

### 🦜 Nemotron Streaming 3.5

Por Handy · 638M parámetros · Idiomas: en-US, en-GB, es-US, es-ES, fr-FR +27  
Admite streaming.

[👉 Ver modelo](https://huggingface.co/handy-computer/nemotron-3.5-asr-streaming-0.6b-gguf/tree/6d44e540bc31b0de1dbe174a3cea87f53a7f22fb)  
[🔽 Q8_0 · 751 MB](https://huggingface.co/handy-computer/nemotron-3.5-asr-streaming-0.6b-gguf/resolve/6d44e540bc31b0de1dbe174a3cea87f53a7f22fb/nemotron-3.5-asr-streaming-0.6b-Q8_0.gguf?download=true)  
[🔽 Q6_K · 621 MB](https://huggingface.co/handy-computer/nemotron-3.5-asr-streaming-0.6b-gguf/resolve/6d44e540bc31b0de1dbe174a3cea87f53a7f22fb/nemotron-3.5-asr-streaming-0.6b-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 560 MB](https://huggingface.co/handy-computer/nemotron-3.5-asr-streaming-0.6b-gguf/resolve/6d44e540bc31b0de1dbe174a3cea87f53a7f22fb/nemotron-3.5-asr-streaming-0.6b-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 496 MB](https://huggingface.co/handy-computer/nemotron-3.5-asr-streaming-0.6b-gguf/resolve/6d44e540bc31b0de1dbe174a3cea87f53a7f22fb/nemotron-3.5-asr-streaming-0.6b-Q4_K_M.gguf?download=true)  
[🔽 F16 · 1278 MB](https://huggingface.co/handy-computer/nemotron-3.5-asr-streaming-0.6b-gguf/resolve/6d44e540bc31b0de1dbe174a3cea87f53a7f22fb/nemotron-3.5-asr-streaming-0.6b-F16.gguf?download=true)  
[🔽 F32 · 2552 MB](https://huggingface.co/handy-computer/nemotron-3.5-asr-streaming-0.6b-gguf/resolve/6d44e540bc31b0de1dbe174a3cea87f53a7f22fb/nemotron-3.5-asr-streaming-0.6b-F32.gguf?download=true)

### 🐤 Canary 180M Flash

Por Handy · 189M parámetros · Idiomas: en, de, es, fr

[👉 Ver modelo](https://huggingface.co/handy-computer/canary-180m-flash-gguf/tree/46b86384d1db59108d6e060a0fc00924cb58499f)  
[🔽 Q8_0 · 218 MB](https://huggingface.co/handy-computer/canary-180m-flash-gguf/resolve/46b86384d1db59108d6e060a0fc00924cb58499f/canary-180m-flash-Q8_0.gguf?download=true)  
[🔽 Q6_K · 176 MB](https://huggingface.co/handy-computer/canary-180m-flash-gguf/resolve/46b86384d1db59108d6e060a0fc00924cb58499f/canary-180m-flash-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 159 MB](https://huggingface.co/handy-computer/canary-180m-flash-gguf/resolve/46b86384d1db59108d6e060a0fc00924cb58499f/canary-180m-flash-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 139 MB](https://huggingface.co/handy-computer/canary-180m-flash-gguf/resolve/46b86384d1db59108d6e060a0fc00924cb58499f/canary-180m-flash-Q4_K_M.gguf?download=true)  
[🔽 F16 · 382 MB](https://huggingface.co/handy-computer/canary-180m-flash-gguf/resolve/46b86384d1db59108d6e060a0fc00924cb58499f/canary-180m-flash-F16.gguf?download=true)  
[🔽 F32 · 756 MB](https://huggingface.co/handy-computer/canary-180m-flash-gguf/resolve/46b86384d1db59108d6e060a0fc00924cb58499f/canary-180m-flash-F32.gguf?download=true)

### 🧭 Cohere Transcribe

Por Handy · 2.0B parámetros · Idiomas: en, fr, de, es, it +9

[👉 Ver modelo](https://huggingface.co/handy-computer/cohere-transcribe-03-2026-gguf/tree/dfa4adebb64f3076b7b6b90b721275cc069cb421)  
[🔽 Q8_0 · 2411 MB](https://huggingface.co/handy-computer/cohere-transcribe-03-2026-gguf/resolve/dfa4adebb64f3076b7b6b90b721275cc069cb421/cohere-transcribe-03-2026-Q8_0.gguf?download=true)  
[🔽 Q6_K · 1973 MB](https://huggingface.co/handy-computer/cohere-transcribe-03-2026-gguf/resolve/dfa4adebb64f3076b7b6b90b721275cc069cb421/cohere-transcribe-03-2026-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 1770 MB](https://huggingface.co/handy-computer/cohere-transcribe-03-2026-gguf/resolve/dfa4adebb64f3076b7b6b90b721275cc069cb421/cohere-transcribe-03-2026-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 1558 MB](https://huggingface.co/handy-computer/cohere-transcribe-03-2026-gguf/resolve/dfa4adebb64f3076b7b6b90b721275cc069cb421/cohere-transcribe-03-2026-Q4_K_M.gguf?download=true)  
[🔽 F16 · 4107 MB](https://huggingface.co/handy-computer/cohere-transcribe-03-2026-gguf/resolve/dfa4adebb64f3076b7b6b90b721275cc069cb421/cohere-transcribe-03-2026-F16.gguf?download=true)  
[🔽 BF16 · 4105 MB](https://huggingface.co/handy-computer/cohere-transcribe-03-2026-gguf/resolve/dfa4adebb64f3076b7b6b90b721275cc069cb421/cohere-transcribe-03-2026-BF16.gguf?download=true)

### 🌟 Whisper Medium

Por Handy · 764M parámetros · Idiomas: af, am, ar, as, az +94

[👉 Ver modelo](https://huggingface.co/handy-computer/whisper-medium-gguf/tree/ec78f06fded51aa82cde751678b78f76f78c8b7f)  
[🔽 Q8_0 · 832 MB](https://huggingface.co/handy-computer/whisper-medium-gguf/resolve/ec78f06fded51aa82cde751678b78f76f78c8b7f/whisper-medium-Q8_0.gguf?download=true)  
[🔽 Q6_K · 648 MB](https://huggingface.co/handy-computer/whisper-medium-gguf/resolve/ec78f06fded51aa82cde751678b78f76f78c8b7f/whisper-medium-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 583 MB](https://huggingface.co/handy-computer/whisper-medium-gguf/resolve/ec78f06fded51aa82cde751678b78f76f78c8b7f/whisper-medium-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 504 MB](https://huggingface.co/handy-computer/whisper-medium-gguf/resolve/ec78f06fded51aa82cde751678b78f76f78c8b7f/whisper-medium-Q4_K_M.gguf?download=true)  
[🔽 F16 · 1542 MB](https://huggingface.co/handy-computer/whisper-medium-gguf/resolve/ec78f06fded51aa82cde751678b78f76f78c8b7f/whisper-medium-F16.gguf?download=true)  
[🔽 F32 · 3057 MB](https://huggingface.co/handy-computer/whisper-medium-gguf/resolve/ec78f06fded51aa82cde751678b78f76f78c8b7f/whisper-medium-F32.gguf?download=true)

### 🎙️ Voxtral Mini 4B Realtime

Por Handy · 4.4B parámetros · Idiomas: en, fr, es, de, ru +8  
Admite streaming.

[👉 Ver modelo](https://huggingface.co/handy-computer/Voxtral-Mini-4B-Realtime-2602-gguf/tree/b3e1c979e3775cbd0a49a65878a0ec7f06789ed7)  
[🔽 Q8_0 · 4732 MB](https://huggingface.co/handy-computer/Voxtral-Mini-4B-Realtime-2602-gguf/resolve/b3e1c979e3775cbd0a49a65878a0ec7f06789ed7/Voxtral-Mini-4B-Realtime-2602-Q8_0.gguf?download=true)  
[🔽 Q6_K · 3661 MB](https://huggingface.co/handy-computer/Voxtral-Mini-4B-Realtime-2602-gguf/resolve/b3e1c979e3775cbd0a49a65878a0ec7f06789ed7/Voxtral-Mini-4B-Realtime-2602-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 3281 MB](https://huggingface.co/handy-computer/Voxtral-Mini-4B-Realtime-2602-gguf/resolve/b3e1c979e3775cbd0a49a65878a0ec7f06789ed7/Voxtral-Mini-4B-Realtime-2602-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 2830 MB](https://huggingface.co/handy-computer/Voxtral-Mini-4B-Realtime-2602-gguf/resolve/b3e1c979e3775cbd0a49a65878a0ec7f06789ed7/Voxtral-Mini-4B-Realtime-2602-Q4_K_M.gguf?download=true)  
[🔽 F16 · 8879 MB](https://huggingface.co/handy-computer/Voxtral-Mini-4B-Realtime-2602-gguf/resolve/b3e1c979e3775cbd0a49a65878a0ec7f06789ed7/Voxtral-Mini-4B-Realtime-2602-F16.gguf?download=true)  
[🔽 BF16 · 8868 MB](https://huggingface.co/handy-computer/Voxtral-Mini-4B-Realtime-2602-gguf/resolve/b3e1c979e3775cbd0a49a65878a0ec7f06789ed7/Voxtral-Mini-4B-Realtime-2602-BF16.gguf?download=true)

### 🦜 Parakeet Ultra

Por Handy · 627M parámetros · Idiomas: en, de, fr, es, it +20

[👉 Ver modelo](https://huggingface.co/handy-computer/parakeet-ultra-gguf/tree/39eeb55181f0d354fd934f06e92fd8d5037fed8e)  
[🔽 Q8_0 · 740 MB](https://huggingface.co/handy-computer/parakeet-ultra-gguf/resolve/39eeb55181f0d354fd934f06e92fd8d5037fed8e/parakeet-ultra-Q8_0.gguf?download=true)  
[🔽 Q6_K · 611 MB](https://huggingface.co/handy-computer/parakeet-ultra-gguf/resolve/39eeb55181f0d354fd934f06e92fd8d5037fed8e/parakeet-ultra-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 550 MB](https://huggingface.co/handy-computer/parakeet-ultra-gguf/resolve/39eeb55181f0d354fd934f06e92fd8d5037fed8e/parakeet-ultra-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 486 MB](https://huggingface.co/handy-computer/parakeet-ultra-gguf/resolve/39eeb55181f0d354fd934f06e92fd8d5037fed8e/parakeet-ultra-Q4_K_M.gguf?download=true)  
[🔽 F16 · 1257 MB](https://huggingface.co/handy-computer/parakeet-ultra-gguf/resolve/39eeb55181f0d354fd934f06e92fd8d5037fed8e/parakeet-ultra-F16.gguf?download=true)  
[🔽 F32 · 2509 MB](https://huggingface.co/handy-computer/parakeet-ultra-gguf/resolve/39eeb55181f0d354fd934f06e92fd8d5037fed8e/parakeet-ultra-F32.gguf?download=true)

### 🦜 Parakeet TDT 0.6B v3

Por Handy · 627M parámetros · Idiomas: bg, hr, cs, da, nl +20

[👉 Ver modelo](https://huggingface.co/handy-computer/parakeet-tdt-0.6b-v3-gguf/tree/85ac09ea12fc4b1112fa76810059364bc6adc9de)  
[🔽 Q8_0 · 740 MB](https://huggingface.co/handy-computer/parakeet-tdt-0.6b-v3-gguf/resolve/85ac09ea12fc4b1112fa76810059364bc6adc9de/parakeet-tdt-0.6b-v3-Q8_0.gguf?download=true)  
[🔽 Q6_K · 610 MB](https://huggingface.co/handy-computer/parakeet-tdt-0.6b-v3-gguf/resolve/85ac09ea12fc4b1112fa76810059364bc6adc9de/parakeet-tdt-0.6b-v3-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 549 MB](https://huggingface.co/handy-computer/parakeet-tdt-0.6b-v3-gguf/resolve/85ac09ea12fc4b1112fa76810059364bc6adc9de/parakeet-tdt-0.6b-v3-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 485 MB](https://huggingface.co/handy-computer/parakeet-tdt-0.6b-v3-gguf/resolve/85ac09ea12fc4b1112fa76810059364bc6adc9de/parakeet-tdt-0.6b-v3-Q4_K_M.gguf?download=true)  
[🔽 F16 · 1256 MB](https://huggingface.co/handy-computer/parakeet-tdt-0.6b-v3-gguf/resolve/85ac09ea12fc4b1112fa76810059364bc6adc9de/parakeet-tdt-0.6b-v3-F16.gguf?download=true)  
[🔽 F32 · 2508 MB](https://huggingface.co/handy-computer/parakeet-tdt-0.6b-v3-gguf/resolve/85ac09ea12fc4b1112fa76810059364bc6adc9de/parakeet-tdt-0.6b-v3-F32.gguf?download=true)

### 🦜 Parakeet TDT 0.6B v2

Por Handy · 618M parámetros · Idiomas: en

[👉 Ver modelo](https://huggingface.co/handy-computer/parakeet-tdt-0.6b-v2-gguf/tree/07cee0616125a08ef619729bb47f40ef747e4bc4)  
[🔽 Q8_0 · 730 MB](https://huggingface.co/handy-computer/parakeet-tdt-0.6b-v2-gguf/resolve/07cee0616125a08ef619729bb47f40ef747e4bc4/parakeet-tdt-0.6b-v2-Q8_0.gguf?download=true)  
[🔽 Q6_K · 600 MB](https://huggingface.co/handy-computer/parakeet-tdt-0.6b-v2-gguf/resolve/07cee0616125a08ef619729bb47f40ef747e4bc4/parakeet-tdt-0.6b-v2-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 539 MB](https://huggingface.co/handy-computer/parakeet-tdt-0.6b-v2-gguf/resolve/07cee0616125a08ef619729bb47f40ef747e4bc4/parakeet-tdt-0.6b-v2-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 475 MB](https://huggingface.co/handy-computer/parakeet-tdt-0.6b-v2-gguf/resolve/07cee0616125a08ef619729bb47f40ef747e4bc4/parakeet-tdt-0.6b-v2-Q4_K_M.gguf?download=true)  
[🔽 F16 · 1237 MB](https://huggingface.co/handy-computer/parakeet-tdt-0.6b-v2-gguf/resolve/07cee0616125a08ef619729bb47f40ef747e4bc4/parakeet-tdt-0.6b-v2-F16.gguf?download=true)  
[🔽 F32 · 2472 MB](https://huggingface.co/handy-computer/parakeet-tdt-0.6b-v2-gguf/resolve/07cee0616125a08ef619729bb47f40ef747e4bc4/parakeet-tdt-0.6b-v2-F32.gguf?download=true)

### 🐉 Qwen3-ASR 0.6B

Por Handy · 782M parámetros · Idiomas: zh, en, yue, ar, de +25

[👉 Ver modelo](https://huggingface.co/handy-computer/Qwen3-ASR-0.6B-gguf/tree/e4e16599b900eb0cb36e524514756bb92eb092b7)  
[🔽 Q8_0 · 850 MB](https://huggingface.co/handy-computer/Qwen3-ASR-0.6B-gguf/resolve/e4e16599b900eb0cb36e524514756bb92eb092b7/Qwen3-ASR-0.6B-Q8_0.gguf?download=true)  
[🔽 Q6_K · 690 MB](https://huggingface.co/handy-computer/Qwen3-ASR-0.6B-gguf/resolve/e4e16599b900eb0cb36e524514756bb92eb092b7/Qwen3-ASR-0.6B-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 645 MB](https://huggingface.co/handy-computer/Qwen3-ASR-0.6B-gguf/resolve/e4e16599b900eb0cb36e524514756bb92eb092b7/Qwen3-ASR-0.6B-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 590 MB](https://huggingface.co/handy-computer/Qwen3-ASR-0.6B-gguf/resolve/e4e16599b900eb0cb36e524514756bb92eb092b7/Qwen3-ASR-0.6B-Q4_K_M.gguf?download=true)  
[🔽 F16 · 1580 MB](https://huggingface.co/handy-computer/Qwen3-ASR-0.6B-gguf/resolve/e4e16599b900eb0cb36e524514756bb92eb092b7/Qwen3-ASR-0.6B-F16.gguf?download=true)  
[🔽 BF16 · 1571 MB](https://huggingface.co/handy-computer/Qwen3-ASR-0.6B-gguf/resolve/e4e16599b900eb0cb36e524514756bb92eb092b7/Qwen3-ASR-0.6B-BF16.gguf?download=true)

### 🎏 Fun-ASR Nano Multilingual

Por Handy · 830M parámetros · Idiomas: zh, en, yue, ja, ko +26

[👉 Ver modelo](https://huggingface.co/handy-computer/Fun-ASR-MLT-Nano-2512-gguf/tree/0b8f9c7bc545a219658aeb1dd4eeaa55d1cf89f3)  
[🔽 Q8_0 · 891 MB](https://huggingface.co/handy-computer/Fun-ASR-MLT-Nano-2512-gguf/resolve/0b8f9c7bc545a219658aeb1dd4eeaa55d1cf89f3/Fun-ASR-MLT-Nano-2512-Q8_0.gguf?download=true)  
[🔽 Q6_K · 691 MB](https://huggingface.co/handy-computer/Fun-ASR-MLT-Nano-2512-gguf/resolve/0b8f9c7bc545a219658aeb1dd4eeaa55d1cf89f3/Fun-ASR-MLT-Nano-2512-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 631 MB](https://huggingface.co/handy-computer/Fun-ASR-MLT-Nano-2512-gguf/resolve/0b8f9c7bc545a219658aeb1dd4eeaa55d1cf89f3/Fun-ASR-MLT-Nano-2512-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 557 MB](https://huggingface.co/handy-computer/Fun-ASR-MLT-Nano-2512-gguf/resolve/0b8f9c7bc545a219658aeb1dd4eeaa55d1cf89f3/Fun-ASR-MLT-Nano-2512-Q4_K_M.gguf?download=true)  
[🔽 F16 · 1668 MB](https://huggingface.co/handy-computer/Fun-ASR-MLT-Nano-2512-gguf/resolve/0b8f9c7bc545a219658aeb1dd4eeaa55d1cf89f3/Fun-ASR-MLT-Nano-2512-F16.gguf?download=true)  
[🔽 BF16 · 1668 MB](https://huggingface.co/handy-computer/Fun-ASR-MLT-Nano-2512-gguf/resolve/0b8f9c7bc545a219658aeb1dd4eeaa55d1cf89f3/Fun-ASR-MLT-Nano-2512-BF16.gguf?download=true)

### 🐤 Canary 1B v2

Por Handy · 980M parámetros · Idiomas: bg, hr, cs, da, nl +20

[👉 Ver modelo](https://huggingface.co/handy-computer/canary-1b-v2-gguf/tree/58d13c2c0102229aad45f7e19a77ddc42b41dd9a)  
[🔽 Q8_0 · 1144 MB](https://huggingface.co/handy-computer/canary-1b-v2-gguf/resolve/58d13c2c0102229aad45f7e19a77ddc42b41dd9a/canary-1b-v2-Q8_0.gguf?download=true)  
[🔽 Q6_K · 932 MB](https://huggingface.co/handy-computer/canary-1b-v2-gguf/resolve/58d13c2c0102229aad45f7e19a77ddc42b41dd9a/canary-1b-v2-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 837 MB](https://huggingface.co/handy-computer/canary-1b-v2-gguf/resolve/58d13c2c0102229aad45f7e19a77ddc42b41dd9a/canary-1b-v2-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 735 MB](https://huggingface.co/handy-computer/canary-1b-v2-gguf/resolve/58d13c2c0102229aad45f7e19a77ddc42b41dd9a/canary-1b-v2-Q4_K_M.gguf?download=true)  
[🔽 F16 · 1966 MB](https://huggingface.co/handy-computer/canary-1b-v2-gguf/resolve/58d13c2c0102229aad45f7e19a77ddc42b41dd9a/canary-1b-v2-F16.gguf?download=true)  
[🔽 F32 · 3921 MB](https://huggingface.co/handy-computer/canary-1b-v2-gguf/resolve/58d13c2c0102229aad45f7e19a77ddc42b41dd9a/canary-1b-v2-F32.gguf?download=true)

### 🐤 Canary-Qwen 2.5B

Por Handy · 2.5B parámetros · Idiomas: en

[👉 Ver modelo](https://huggingface.co/handy-computer/canary-qwen-2.5b-gguf/tree/3370d4e2f28cc70eea79dfc9f2f43fb91eef3163)  
[🔽 Q8_0 · 2798 MB](https://huggingface.co/handy-computer/canary-qwen-2.5b-gguf/resolve/3370d4e2f28cc70eea79dfc9f2f43fb91eef3163/canary-qwen-2.5b-Q8_0.gguf?download=true)  
[🔽 Q6_K · 2209 MB](https://huggingface.co/handy-computer/canary-qwen-2.5b-gguf/resolve/3370d4e2f28cc70eea79dfc9f2f43fb91eef3163/canary-qwen-2.5b-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 1984 MB](https://huggingface.co/handy-computer/canary-qwen-2.5b-gguf/resolve/3370d4e2f28cc70eea79dfc9f2f43fb91eef3163/canary-qwen-2.5b-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 1738 MB](https://huggingface.co/handy-computer/canary-qwen-2.5b-gguf/resolve/3370d4e2f28cc70eea79dfc9f2f43fb91eef3163/canary-qwen-2.5b-Q4_K_M.gguf?download=true)  
[🔽 F16 · 5077 MB](https://huggingface.co/handy-computer/canary-qwen-2.5b-gguf/resolve/3370d4e2f28cc70eea79dfc9f2f43fb91eef3163/canary-qwen-2.5b-F16.gguf?download=true)  
[🔽 BF16 · 5076 MB](https://huggingface.co/handy-computer/canary-qwen-2.5b-gguf/resolve/3370d4e2f28cc70eea79dfc9f2f43fb91eef3163/canary-qwen-2.5b-BF16.gguf?download=true)

### 🧭 Cohere Transcribe Arabic

Por Handy · 2.0B parámetros · Idiomas: en, ar

[👉 Ver modelo](https://huggingface.co/handy-computer/cohere-transcribe-arabic-07-2026-gguf/tree/715cbe09ca9b60fc1e497db1e4478fa9fcf4ac21)  
[🔽 Q8_0 · 2411 MB](https://huggingface.co/handy-computer/cohere-transcribe-arabic-07-2026-gguf/resolve/715cbe09ca9b60fc1e497db1e4478fa9fcf4ac21/cohere-transcribe-arabic-07-2026-Q8_0.gguf?download=true)  
[🔽 Q6_K · 1973 MB](https://huggingface.co/handy-computer/cohere-transcribe-arabic-07-2026-gguf/resolve/715cbe09ca9b60fc1e497db1e4478fa9fcf4ac21/cohere-transcribe-arabic-07-2026-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 1770 MB](https://huggingface.co/handy-computer/cohere-transcribe-arabic-07-2026-gguf/resolve/715cbe09ca9b60fc1e497db1e4478fa9fcf4ac21/cohere-transcribe-arabic-07-2026-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 1558 MB](https://huggingface.co/handy-computer/cohere-transcribe-arabic-07-2026-gguf/resolve/715cbe09ca9b60fc1e497db1e4478fa9fcf4ac21/cohere-transcribe-arabic-07-2026-Q4_K_M.gguf?download=true)  
[🔽 F16 · 4107 MB](https://huggingface.co/handy-computer/cohere-transcribe-arabic-07-2026-gguf/resolve/715cbe09ca9b60fc1e497db1e4478fa9fcf4ac21/cohere-transcribe-arabic-07-2026-F16.gguf?download=true)  
[🔽 BF16 · 4105 MB](https://huggingface.co/handy-computer/cohere-transcribe-arabic-07-2026-gguf/resolve/715cbe09ca9b60fc1e497db1e4478fa9fcf4ac21/cohere-transcribe-arabic-07-2026-BF16.gguf?download=true)

### 🎏 Fun-ASR Nano

Por Handy · 830M parámetros · Idiomas: zh, en, ja

[👉 Ver modelo](https://huggingface.co/handy-computer/Fun-ASR-Nano-2512-gguf/tree/30360f003f99929c1e25c3f6222d02eccb04663c)  
[🔽 Q8_0 · 891 MB](https://huggingface.co/handy-computer/Fun-ASR-Nano-2512-gguf/resolve/30360f003f99929c1e25c3f6222d02eccb04663c/Fun-ASR-Nano-2512-Q8_0.gguf?download=true)  
[🔽 Q6_K · 691 MB](https://huggingface.co/handy-computer/Fun-ASR-Nano-2512-gguf/resolve/30360f003f99929c1e25c3f6222d02eccb04663c/Fun-ASR-Nano-2512-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 631 MB](https://huggingface.co/handy-computer/Fun-ASR-Nano-2512-gguf/resolve/30360f003f99929c1e25c3f6222d02eccb04663c/Fun-ASR-Nano-2512-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 557 MB](https://huggingface.co/handy-computer/Fun-ASR-Nano-2512-gguf/resolve/30360f003f99929c1e25c3f6222d02eccb04663c/Fun-ASR-Nano-2512-Q4_K_M.gguf?download=true)  
[🔽 F16 · 1668 MB](https://huggingface.co/handy-computer/Fun-ASR-Nano-2512-gguf/resolve/30360f003f99929c1e25c3f6222d02eccb04663c/Fun-ASR-Nano-2512-F16.gguf?download=true)  
[🔽 BF16 · 1668 MB](https://huggingface.co/handy-computer/Fun-ASR-Nano-2512-gguf/resolve/30360f003f99929c1e25c3f6222d02eccb04663c/Fun-ASR-Nano-2512-BF16.gguf?download=true)

### 🇷🇺 GigaAM v3 E2E-CTC

Por Handy · 221M parámetros · Idiomas: ru

[👉 Ver modelo](https://huggingface.co/handy-computer/gigaam-v3-e2e-ctc-gguf/tree/075dff81f843cf23d22b4ce943ffdc4dd8650cd7)  
[🔽 Q8_0 · 272 MB](https://huggingface.co/handy-computer/gigaam-v3-e2e-ctc-gguf/resolve/075dff81f843cf23d22b4ce943ffdc4dd8650cd7/gigaam-v3-e2e-ctc-Q8_0.gguf?download=true)  
[🔽 Q6_K · 226 MB](https://huggingface.co/handy-computer/gigaam-v3-e2e-ctc-gguf/resolve/075dff81f843cf23d22b4ce943ffdc4dd8650cd7/gigaam-v3-e2e-ctc-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 205 MB](https://huggingface.co/handy-computer/gigaam-v3-e2e-ctc-gguf/resolve/075dff81f843cf23d22b4ce943ffdc4dd8650cd7/gigaam-v3-e2e-ctc-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 182 MB](https://huggingface.co/handy-computer/gigaam-v3-e2e-ctc-gguf/resolve/075dff81f843cf23d22b4ce943ffdc4dd8650cd7/gigaam-v3-e2e-ctc-Q4_K_M.gguf?download=true)  
[🔽 F16 · 449 MB](https://huggingface.co/handy-computer/gigaam-v3-e2e-ctc-gguf/resolve/075dff81f843cf23d22b4ce943ffdc4dd8650cd7/gigaam-v3-e2e-ctc-F16.gguf?download=true)  
[🔽 F32 · 884 MB](https://huggingface.co/handy-computer/gigaam-v3-e2e-ctc-gguf/resolve/075dff81f843cf23d22b4ce943ffdc4dd8650cd7/gigaam-v3-e2e-ctc-F32.gguf?download=true)

### 🇷🇺 GigaAM v3 E2E-RNN-T

Por Handy · 223M parámetros · Idiomas: ru

[👉 Ver modelo](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf/tree/f719d70812344f4d0fb8c11c0887b190501a7465)  
[🔽 Q8_0 · 274 MB](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf/resolve/f719d70812344f4d0fb8c11c0887b190501a7465/gigaam-v3-e2e-rnnt-Q8_0.gguf?download=true)  
[🔽 Q6_K · 228 MB](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf/resolve/f719d70812344f4d0fb8c11c0887b190501a7465/gigaam-v3-e2e-rnnt-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 206 MB](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf/resolve/f719d70812344f4d0fb8c11c0887b190501a7465/gigaam-v3-e2e-rnnt-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 184 MB](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf/resolve/f719d70812344f4d0fb8c11c0887b190501a7465/gigaam-v3-e2e-rnnt-Q4_K_M.gguf?download=true)  
[🔽 F16 · 452 MB](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf/resolve/f719d70812344f4d0fb8c11c0887b190501a7465/gigaam-v3-e2e-rnnt-F16.gguf?download=true)  
[🔽 F32 · 890 MB](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf/resolve/f719d70812344f4d0fb8c11c0887b190501a7465/gigaam-v3-e2e-rnnt-F32.gguf?download=true)

<details>
<summary>Limitaciones de GigaAM y ejemplos de línea de comandos</summary>

**Limitaciones**

- Solo ruso. No hay detección automática del idioma: `--language ru` y `--language auto` ambos seleccionan ruso, y cualquier otro idioma falla con `unsupported_language`.
- No es streaming. La ventana del modelo es de 25 segundos y se requiere el [modelo Silero VAD](https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-silero-v6.2.0.bin) para dividir grabaciones más largas.
- Sin traducción y sin indicaciones de texto.
- Las marcas de tiempo estables no son compatibles y las solicitudes de marcas de tiempo por palabra se ignoran. Cada segmento incluye marcas de tiempo por token con una resolución de 40 ms.
- La diarización de hablantes funciona con normalidad.
- Hay cuatro variantes publicadas en `handy-computer`: [`gigaam-v3-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-rnnt-gguf), [`gigaam-v3-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-ctc-gguf), [`gigaam-v3-e2e-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf) y [`gigaam-v3-e2e-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-ctc-gguf). Las variantes `e2e` añaden mayúsculas y puntuación; las demás devuelven texto en minúsculas y sin puntuación.

**Línea de comandos**

Descarga el modelo VAD mencionado arriba y pásalo con `--vad-model`:

```console
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format markdown --output transcript.md
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format json
```

`--format` acepta `txt` (predeterminado), `markdown` (alias `md`), `json`, `srt` y `vtt`. `--output` escribe la transcripción en un archivo y se niega a sobrescribir uno existente. Añade `--diarize-model <diar.gguf>` para etiquetar a los hablantes en la salida Markdown y JSON.

</details>

### 🪨 Granite Speech 5.0 470M TurboCTC

Por Handy · 473M parámetros · Idiomas: en

[👉 Ver modelo](https://huggingface.co/handy-computer/granite-speech-5.0-470m-turboctc-gguf/tree/2b0b44d0d6c8b94a2e4f04a2cf3ec6a5c054463b)  
[🔽 Q8_0 · 506 MB](https://huggingface.co/handy-computer/granite-speech-5.0-470m-turboctc-gguf/resolve/2b0b44d0d6c8b94a2e4f04a2cf3ec6a5c054463b/granite-speech-5.0-470m-turboctc-Q8_0.gguf?download=true)  
[🔽 Q6_K · 392 MB](https://huggingface.co/handy-computer/granite-speech-5.0-470m-turboctc-gguf/resolve/2b0b44d0d6c8b94a2e4f04a2cf3ec6a5c054463b/granite-speech-5.0-470m-turboctc-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 336 MB](https://huggingface.co/handy-computer/granite-speech-5.0-470m-turboctc-gguf/resolve/2b0b44d0d6c8b94a2e4f04a2cf3ec6a5c054463b/granite-speech-5.0-470m-turboctc-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 279 MB](https://huggingface.co/handy-computer/granite-speech-5.0-470m-turboctc-gguf/resolve/2b0b44d0d6c8b94a2e4f04a2cf3ec6a5c054463b/granite-speech-5.0-470m-turboctc-Q4_K_M.gguf?download=true)  
[🔽 F16 · 948 MB](https://huggingface.co/handy-computer/granite-speech-5.0-470m-turboctc-gguf/resolve/2b0b44d0d6c8b94a2e4f04a2cf3ec6a5c054463b/granite-speech-5.0-470m-turboctc-F16.gguf?download=true)  
[🔽 BF16 · 948 MB](https://huggingface.co/handy-computer/granite-speech-5.0-470m-turboctc-gguf/resolve/2b0b44d0d6c8b94a2e4f04a2cf3ec6a5c054463b/granite-speech-5.0-470m-turboctc-BF16.gguf?download=true)

### 🪨 Granite Speech 4.1 2B

Por Handy · 2.3B parámetros · Idiomas: en, fr, de, es, pt +1

[👉 Ver modelo](https://huggingface.co/handy-computer/granite-speech-4.1-2b-gguf/tree/58e7710fd7039ded5a185668eef5f71ca5d9d919)  
[🔽 Q8_0 · 2560 MB](https://huggingface.co/handy-computer/granite-speech-4.1-2b-gguf/resolve/58e7710fd7039ded5a185668eef5f71ca5d9d919/granite-speech-4.1-2b-Q8_0.gguf?download=true)  
[🔽 Q6_K · 2025 MB](https://huggingface.co/handy-computer/granite-speech-4.1-2b-gguf/resolve/58e7710fd7039ded5a185668eef5f71ca5d9d919/granite-speech-4.1-2b-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 1830 MB](https://huggingface.co/handy-computer/granite-speech-4.1-2b-gguf/resolve/58e7710fd7039ded5a185668eef5f71ca5d9d919/granite-speech-4.1-2b-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 1603 MB](https://huggingface.co/handy-computer/granite-speech-4.1-2b-gguf/resolve/58e7710fd7039ded5a185668eef5f71ca5d9d919/granite-speech-4.1-2b-Q4_K_M.gguf?download=true)  
[🔽 F16 · 4633 MB](https://huggingface.co/handy-computer/granite-speech-4.1-2b-gguf/resolve/58e7710fd7039ded5a185668eef5f71ca5d9d919/granite-speech-4.1-2b-F16.gguf?download=true)  
[🔽 BF16 · 4632 MB](https://huggingface.co/handy-computer/granite-speech-4.1-2b-gguf/resolve/58e7710fd7039ded5a185668eef5f71ca5d9d919/granite-speech-4.1-2b-BF16.gguf?download=true)

### 🩺 MedASR

Por Handy · 105M parámetros · Idiomas: en

[👉 Ver modelo](https://huggingface.co/handy-computer/medasr-gguf/tree/6f481df085bb50ae922cea918fb578e664237126)  
[🔽 Q8_0 · 128 MB](https://huggingface.co/handy-computer/medasr-gguf/resolve/6f481df085bb50ae922cea918fb578e664237126/medasr-Q8_0.gguf?download=true)  
[🔽 Q6_K · 106 MB](https://huggingface.co/handy-computer/medasr-gguf/resolve/6f481df085bb50ae922cea918fb578e664237126/medasr-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 94 MB](https://huggingface.co/handy-computer/medasr-gguf/resolve/6f481df085bb50ae922cea918fb578e664237126/medasr-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 83 MB](https://huggingface.co/handy-computer/medasr-gguf/resolve/6f481df085bb50ae922cea918fb578e664237126/medasr-Q4_K_M.gguf?download=true)  
[🔽 F16 · 211 MB](https://huggingface.co/handy-computer/medasr-gguf/resolve/6f481df085bb50ae922cea918fb578e664237126/medasr-F16.gguf?download=true)  
[🔽 F32 · 421 MB](https://huggingface.co/handy-computer/medasr-gguf/resolve/6f481df085bb50ae922cea918fb578e664237126/medasr-F32.gguf?download=true)

### 🦜 Parakeet TDT-CTC 110M

Por Handy · 114M parámetros · Idiomas: en

[👉 Ver modelo](https://huggingface.co/handy-computer/parakeet-tdt_ctc-110m-gguf/tree/9d66d34f9e1594075c5dd72c90c0f4c321b29f21)  
[🔽 Q8_0 · 135 MB](https://huggingface.co/handy-computer/parakeet-tdt_ctc-110m-gguf/resolve/9d66d34f9e1594075c5dd72c90c0f4c321b29f21/parakeet-tdt_ctc-110m-Q8_0.gguf?download=true)  
[🔽 Q6_K · 112 MB](https://huggingface.co/handy-computer/parakeet-tdt_ctc-110m-gguf/resolve/9d66d34f9e1594075c5dd72c90c0f4c321b29f21/parakeet-tdt_ctc-110m-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 101 MB](https://huggingface.co/handy-computer/parakeet-tdt_ctc-110m-gguf/resolve/9d66d34f9e1594075c5dd72c90c0f4c321b29f21/parakeet-tdt_ctc-110m-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 90 MB](https://huggingface.co/handy-computer/parakeet-tdt_ctc-110m-gguf/resolve/9d66d34f9e1594075c5dd72c90c0f4c321b29f21/parakeet-tdt_ctc-110m-Q4_K_M.gguf?download=true)  
[🔽 F16 · 229 MB](https://huggingface.co/handy-computer/parakeet-tdt_ctc-110m-gguf/resolve/9d66d34f9e1594075c5dd72c90c0f4c321b29f21/parakeet-tdt_ctc-110m-F16.gguf?download=true)  
[🔽 F32 · 457 MB](https://huggingface.co/handy-computer/parakeet-tdt_ctc-110m-gguf/resolve/9d66d34f9e1594075c5dd72c90c0f4c321b29f21/parakeet-tdt_ctc-110m-F32.gguf?download=true)

### 🦜 Parakeet Multitalker English

Por Handy · 740M parámetros · Idiomas: en  
Admite streaming.

[👉 Ver modelo](https://huggingface.co/handy-computer/multitalker-parakeet-streaming-0.6b-v1-gguf/tree/d9ed2931bc10058f79809bd88139a27c2ef09a53)  
[🔽 Q8_0 · 873 MB](https://huggingface.co/handy-computer/multitalker-parakeet-streaming-0.6b-v1-gguf/resolve/d9ed2931bc10058f79809bd88139a27c2ef09a53/multitalker-parakeet-streaming-0.6b-v1-Q8_0.gguf?download=true)  
[🔽 Q6_K · 743 MB](https://huggingface.co/handy-computer/multitalker-parakeet-streaming-0.6b-v1-gguf/resolve/d9ed2931bc10058f79809bd88139a27c2ef09a53/multitalker-parakeet-streaming-0.6b-v1-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 681 MB](https://huggingface.co/handy-computer/multitalker-parakeet-streaming-0.6b-v1-gguf/resolve/d9ed2931bc10058f79809bd88139a27c2ef09a53/multitalker-parakeet-streaming-0.6b-v1-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 617 MB](https://huggingface.co/handy-computer/multitalker-parakeet-streaming-0.6b-v1-gguf/resolve/d9ed2931bc10058f79809bd88139a27c2ef09a53/multitalker-parakeet-streaming-0.6b-v1-Q4_K_M.gguf?download=true)  
[🔽 F16 · 1483 MB](https://huggingface.co/handy-computer/multitalker-parakeet-streaming-0.6b-v1-gguf/resolve/d9ed2931bc10058f79809bd88139a27c2ef09a53/multitalker-parakeet-streaming-0.6b-v1-F16.gguf?download=true)  
[🔽 F32 · 2960 MB](https://huggingface.co/handy-computer/multitalker-parakeet-streaming-0.6b-v1-gguf/resolve/d9ed2931bc10058f79809bd88139a27c2ef09a53/multitalker-parakeet-streaming-0.6b-v1-F32.gguf?download=true)

### 🐉 Qwen3-ASR 1.7B

Por Handy · 2.0B parámetros · Idiomas: zh, en, yue, ar, de +25

[👉 Ver modelo](https://huggingface.co/handy-computer/Qwen3-ASR-1.7B-gguf/tree/92282af1610a2db19d66f2bef1e260f5deca782d)  
[🔽 Q8_0 · 2185 MB](https://huggingface.co/handy-computer/Qwen3-ASR-1.7B-gguf/resolve/92282af1610a2db19d66f2bef1e260f5deca782d/Qwen3-ASR-1.7B-Q8_0.gguf?download=true)  
[🔽 Q6_K · 1693 MB](https://huggingface.co/handy-computer/Qwen3-ASR-1.7B-gguf/resolve/92282af1610a2db19d66f2bef1e260f5deca782d/Qwen3-ASR-1.7B-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 1517 MB](https://huggingface.co/handy-computer/Qwen3-ASR-1.7B-gguf/resolve/92282af1610a2db19d66f2bef1e260f5deca782d/Qwen3-ASR-1.7B-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 1320 MB](https://huggingface.co/handy-computer/Qwen3-ASR-1.7B-gguf/resolve/92282af1610a2db19d66f2bef1e260f5deca782d/Qwen3-ASR-1.7B-Q4_K_M.gguf?download=true)  
[🔽 F16 · 4091 MB](https://huggingface.co/handy-computer/Qwen3-ASR-1.7B-gguf/resolve/92282af1610a2db19d66f2bef1e260f5deca782d/Qwen3-ASR-1.7B-F16.gguf?download=true)  
[🔽 BF16 · 4083 MB](https://huggingface.co/handy-computer/Qwen3-ASR-1.7B-gguf/resolve/92282af1610a2db19d66f2bef1e260f5deca782d/Qwen3-ASR-1.7B-BF16.gguf?download=true)

### 👂 SenseVoice Small

Por Handy · 234M parámetros · Idiomas: zh, yue, en, ja, ko

[👉 Ver modelo](https://huggingface.co/handy-computer/SenseVoiceSmall-gguf/tree/4a08b8e900b38a977e32eb08d5d0697d6e72ba04)  
[🔽 Q8_0 · 253 MB](https://huggingface.co/handy-computer/SenseVoiceSmall-gguf/resolve/4a08b8e900b38a977e32eb08d5d0697d6e72ba04/SenseVoiceSmall-Q8_0.gguf?download=true)  
[🔽 Q6_K · 196 MB](https://huggingface.co/handy-computer/SenseVoiceSmall-gguf/resolve/4a08b8e900b38a977e32eb08d5d0697d6e72ba04/SenseVoiceSmall-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 172 MB](https://huggingface.co/handy-computer/SenseVoiceSmall-gguf/resolve/4a08b8e900b38a977e32eb08d5d0697d6e72ba04/SenseVoiceSmall-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 146 MB](https://huggingface.co/handy-computer/SenseVoiceSmall-gguf/resolve/4a08b8e900b38a977e32eb08d5d0697d6e72ba04/SenseVoiceSmall-Q4_K_M.gguf?download=true)  
[🔽 F16 · 470 MB](https://huggingface.co/handy-computer/SenseVoiceSmall-gguf/resolve/4a08b8e900b38a977e32eb08d5d0697d6e72ba04/SenseVoiceSmall-F16.gguf?download=true)  
[🔽 F32 · 937 MB](https://huggingface.co/handy-computer/SenseVoiceSmall-gguf/resolve/4a08b8e900b38a977e32eb08d5d0697d6e72ba04/SenseVoiceSmall-F32.gguf?download=true)

### 🎙️ Voxtral Mini 3B

Por Handy · 4.7B parámetros · Idiomas: en, fr, de, es, it +3

[👉 Ver modelo](https://huggingface.co/handy-computer/Voxtral-Mini-3B-2507-gguf/tree/5690205813042c07cbaa86d2a9dcc585fcd31304)  
[🔽 Q8_0 · 5000 MB](https://huggingface.co/handy-computer/Voxtral-Mini-3B-2507-gguf/resolve/5690205813042c07cbaa86d2a9dcc585fcd31304/Voxtral-Mini-3B-2507-Q8_0.gguf?download=true)  
[🔽 Q6_K · 3869 MB](https://huggingface.co/handy-computer/Voxtral-Mini-3B-2507-gguf/resolve/5690205813042c07cbaa86d2a9dcc585fcd31304/Voxtral-Mini-3B-2507-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 3464 MB](https://huggingface.co/handy-computer/Voxtral-Mini-3B-2507-gguf/resolve/5690205813042c07cbaa86d2a9dcc585fcd31304/Voxtral-Mini-3B-2507-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 2985 MB](https://huggingface.co/handy-computer/Voxtral-Mini-3B-2507-gguf/resolve/5690205813042c07cbaa86d2a9dcc585fcd31304/Voxtral-Mini-3B-2507-Q4_K_M.gguf?download=true)  
[🔽 F16 · 9377 MB](https://huggingface.co/handy-computer/Voxtral-Mini-3B-2507-gguf/resolve/5690205813042c07cbaa86d2a9dcc585fcd31304/Voxtral-Mini-3B-2507-F16.gguf?download=true)  
[🔽 BF16 · 9366 MB](https://huggingface.co/handy-computer/Voxtral-Mini-3B-2507-gguf/resolve/5690205813042c07cbaa86d2a9dcc585fcd31304/Voxtral-Mini-3B-2507-BF16.gguf?download=true)

### 🌟 Whisper Small

Por Handy · 242M parámetros · Idiomas: af, am, ar, as, az +94

[👉 Ver modelo](https://huggingface.co/handy-computer/whisper-small-gguf/tree/c0214bd34be9296695486f838e0142f900803159)  
[🔽 Q8_0 · 270 MB](https://huggingface.co/handy-computer/whisper-small-gguf/resolve/c0214bd34be9296695486f838e0142f900803159/whisper-small-Q8_0.gguf?download=true)  
[🔽 Q6_K · 212 MB](https://huggingface.co/handy-computer/whisper-small-gguf/resolve/c0214bd34be9296695486f838e0142f900803159/whisper-small-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 194 MB](https://huggingface.co/handy-computer/whisper-small-gguf/resolve/c0214bd34be9296695486f838e0142f900803159/whisper-small-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 172 MB](https://huggingface.co/handy-computer/whisper-small-gguf/resolve/c0214bd34be9296695486f838e0142f900803159/whisper-small-Q4_K_M.gguf?download=true)  
[🔽 F16 · 493 MB](https://huggingface.co/handy-computer/whisper-small-gguf/resolve/c0214bd34be9296695486f838e0142f900803159/whisper-small-F16.gguf?download=true)  
[🔽 F32 · 969 MB](https://huggingface.co/handy-computer/whisper-small-gguf/resolve/c0214bd34be9296695486f838e0142f900803159/whisper-small-F32.gguf?download=true)

### 🌟 Whisper Large v3 Turbo

Por Handy · 809M parámetros · Idiomas: af, am, ar, as, az +95

[👉 Ver modelo](https://huggingface.co/handy-computer/whisper-large-v3-turbo-gguf/tree/5eaf945c7978e564bae5b28a5b1639dd93c2bfb1)  
[🔽 Q8_0 · 886 MB](https://huggingface.co/handy-computer/whisper-large-v3-turbo-gguf/resolve/5eaf945c7978e564bae5b28a5b1639dd93c2bfb1/whisper-large-v3-turbo-Q8_0.gguf?download=true)  
[🔽 Q6_K · 693 MB](https://huggingface.co/handy-computer/whisper-large-v3-turbo-gguf/resolve/5eaf945c7978e564bae5b28a5b1639dd93c2bfb1/whisper-large-v3-turbo-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 620 MB](https://huggingface.co/handy-computer/whisper-large-v3-turbo-gguf/resolve/5eaf945c7978e564bae5b28a5b1639dd93c2bfb1/whisper-large-v3-turbo-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 536 MB](https://huggingface.co/handy-computer/whisper-large-v3-turbo-gguf/resolve/5eaf945c7978e564bae5b28a5b1639dd93c2bfb1/whisper-large-v3-turbo-Q4_K_M.gguf?download=true)  
[🔽 F16 · 1626 MB](https://huggingface.co/handy-computer/whisper-large-v3-turbo-gguf/resolve/5eaf945c7978e564bae5b28a5b1639dd93c2bfb1/whisper-large-v3-turbo-F16.gguf?download=true)

### 🌟 Breeze-ASR-25

Por Handy · 1.5B parámetros · Idiomas: zh, en

[👉 Ver modelo](https://huggingface.co/handy-computer/Breeze-ASR-25-gguf/tree/1e5e8d7295110e1e14e305e9cf7411d82711beaa)  
[🔽 Q8_0 · 1668 MB](https://huggingface.co/handy-computer/Breeze-ASR-25-gguf/resolve/1e5e8d7295110e1e14e305e9cf7411d82711beaa/Breeze-ASR-25-Q8_0.gguf?download=true)  
[🔽 Q6_K · 1296 MB](https://huggingface.co/handy-computer/Breeze-ASR-25-gguf/resolve/1e5e8d7295110e1e14e305e9cf7411d82711beaa/Breeze-ASR-25-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 1160 MB](https://huggingface.co/handy-computer/Breeze-ASR-25-gguf/resolve/1e5e8d7295110e1e14e305e9cf7411d82711beaa/Breeze-ASR-25-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 997 MB](https://huggingface.co/handy-computer/Breeze-ASR-25-gguf/resolve/1e5e8d7295110e1e14e305e9cf7411d82711beaa/Breeze-ASR-25-Q4_K_M.gguf?download=true)  
[🔽 F16 · 3106 MB](https://huggingface.co/handy-computer/Breeze-ASR-25-gguf/resolve/1e5e8d7295110e1e14e305e9cf7411d82711beaa/Breeze-ASR-25-F16.gguf?download=true)  
[🔽 BF16 · 3096 MB](https://huggingface.co/handy-computer/Breeze-ASR-25-gguf/resolve/1e5e8d7295110e1e14e305e9cf7411d82711beaa/Breeze-ASR-25-BF16.gguf?download=true)

### 🌟 Whisper Large v3

Por Handy · 1.5B parámetros · Idiomas: af, am, ar, as, az +95

[👉 Ver modelo](https://huggingface.co/handy-computer/whisper-large-v3-gguf/tree/e3e29bee6389c7da4a141406f07bb80ddac5337c)  
[🔽 Q8_0 · 1669 MB](https://huggingface.co/handy-computer/whisper-large-v3-gguf/resolve/e3e29bee6389c7da4a141406f07bb80ddac5337c/whisper-large-v3-Q8_0.gguf?download=true)  
[🔽 Q6_K · 1297 MB](https://huggingface.co/handy-computer/whisper-large-v3-gguf/resolve/e3e29bee6389c7da4a141406f07bb80ddac5337c/whisper-large-v3-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 1161 MB](https://huggingface.co/handy-computer/whisper-large-v3-gguf/resolve/e3e29bee6389c7da4a141406f07bb80ddac5337c/whisper-large-v3-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 997 MB](https://huggingface.co/handy-computer/whisper-large-v3-gguf/resolve/e3e29bee6389c7da4a141406f07bb80ddac5337c/whisper-large-v3-Q4_K_M.gguf?download=true)  
[🔽 F16 · 3107 MB](https://huggingface.co/handy-computer/whisper-large-v3-gguf/resolve/e3e29bee6389c7da4a141406f07bb80ddac5337c/whisper-large-v3-F16.gguf?download=true)

### Canary 1B

Por Handy · 1.0B parámetros · Idiomas: en, de, es, fr

[👉 Ver modelo](https://huggingface.co/handy-computer/canary-1b-gguf/tree/9661a6a5a46f2f2cb6ff7062fef7b0fbbdb31498)  
[🔽 Q8_0 · 1163 MB](https://huggingface.co/handy-computer/canary-1b-gguf/resolve/9661a6a5a46f2f2cb6ff7062fef7b0fbbdb31498/canary-1b-Q8_0.gguf?download=true)  
[🔽 Q6_K · 934 MB](https://huggingface.co/handy-computer/canary-1b-gguf/resolve/9661a6a5a46f2f2cb6ff7062fef7b0fbbdb31498/canary-1b-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 838 MB](https://huggingface.co/handy-computer/canary-1b-gguf/resolve/9661a6a5a46f2f2cb6ff7062fef7b0fbbdb31498/canary-1b-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 730 MB](https://huggingface.co/handy-computer/canary-1b-gguf/resolve/9661a6a5a46f2f2cb6ff7062fef7b0fbbdb31498/canary-1b-Q4_K_M.gguf?download=true)  
[🔽 F16 · 2048 MB](https://huggingface.co/handy-computer/canary-1b-gguf/resolve/9661a6a5a46f2f2cb6ff7062fef7b0fbbdb31498/canary-1b-F16.gguf?download=true)  
[🔽 F32 · 4086 MB](https://huggingface.co/handy-computer/canary-1b-gguf/resolve/9661a6a5a46f2f2cb6ff7062fef7b0fbbdb31498/canary-1b-F32.gguf?download=true)

### Canary 1B Flash

Por Handy · 890M parámetros · Idiomas: en, de, es, fr

[👉 Ver modelo](https://huggingface.co/handy-computer/canary-1b-flash-gguf/tree/bd27c7ef67ca6347ae2f729a130658466beecc85)  
[🔽 Q8_0 · 1048 MB](https://huggingface.co/handy-computer/canary-1b-flash-gguf/resolve/bd27c7ef67ca6347ae2f729a130658466beecc85/canary-1b-flash-Q8_0.gguf?download=true)  
[🔽 Q6_K · 858 MB](https://huggingface.co/handy-computer/canary-1b-flash-gguf/resolve/bd27c7ef67ca6347ae2f729a130658466beecc85/canary-1b-flash-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 770 MB](https://huggingface.co/handy-computer/canary-1b-flash-gguf/resolve/bd27c7ef67ca6347ae2f729a130658466beecc85/canary-1b-flash-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 677 MB](https://huggingface.co/handy-computer/canary-1b-flash-gguf/resolve/bd27c7ef67ca6347ae2f729a130658466beecc85/canary-1b-flash-Q4_K_M.gguf?download=true)  
[🔽 F16 · 1786 MB](https://huggingface.co/handy-computer/canary-1b-flash-gguf/resolve/bd27c7ef67ca6347ae2f729a130658466beecc85/canary-1b-flash-F16.gguf?download=true)  
[🔽 F32 · 3560 MB](https://huggingface.co/handy-computer/canary-1b-flash-gguf/resolve/bd27c7ef67ca6347ae2f729a130658466beecc85/canary-1b-flash-F32.gguf?download=true)

### GigaAM v3 CTC

Por Handy · 221M parámetros · Idiomas: ru

[👉 Ver modelo](https://huggingface.co/handy-computer/gigaam-v3-ctc-gguf/tree/c3c611444004820c21c3b68312a41c83c1e4813b)  
[🔽 Q8_0 · 272 MB](https://huggingface.co/handy-computer/gigaam-v3-ctc-gguf/resolve/c3c611444004820c21c3b68312a41c83c1e4813b/gigaam-v3-ctc-Q8_0.gguf?download=true)  
[🔽 Q6_K · 226 MB](https://huggingface.co/handy-computer/gigaam-v3-ctc-gguf/resolve/c3c611444004820c21c3b68312a41c83c1e4813b/gigaam-v3-ctc-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 205 MB](https://huggingface.co/handy-computer/gigaam-v3-ctc-gguf/resolve/c3c611444004820c21c3b68312a41c83c1e4813b/gigaam-v3-ctc-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 182 MB](https://huggingface.co/handy-computer/gigaam-v3-ctc-gguf/resolve/c3c611444004820c21c3b68312a41c83c1e4813b/gigaam-v3-ctc-Q4_K_M.gguf?download=true)  
[🔽 F16 · 449 MB](https://huggingface.co/handy-computer/gigaam-v3-ctc-gguf/resolve/c3c611444004820c21c3b68312a41c83c1e4813b/gigaam-v3-ctc-F16.gguf?download=true)  
[🔽 F32 · 883 MB](https://huggingface.co/handy-computer/gigaam-v3-ctc-gguf/resolve/c3c611444004820c21c3b68312a41c83c1e4813b/gigaam-v3-ctc-F32.gguf?download=true)

### GigaAM v3 RNN-T

Por Handy · 222M parámetros · Idiomas: ru

[👉 Ver modelo](https://huggingface.co/handy-computer/gigaam-v3-rnnt-gguf/tree/8f30356b4607ae2d79353ab7dc9e5eea6dc46b48)  
[🔽 Q8_0 · 273 MB](https://huggingface.co/handy-computer/gigaam-v3-rnnt-gguf/resolve/8f30356b4607ae2d79353ab7dc9e5eea6dc46b48/gigaam-v3-rnnt-Q8_0.gguf?download=true)  
[🔽 Q6_K · 227 MB](https://huggingface.co/handy-computer/gigaam-v3-rnnt-gguf/resolve/8f30356b4607ae2d79353ab7dc9e5eea6dc46b48/gigaam-v3-rnnt-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 206 MB](https://huggingface.co/handy-computer/gigaam-v3-rnnt-gguf/resolve/8f30356b4607ae2d79353ab7dc9e5eea6dc46b48/gigaam-v3-rnnt-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 183 MB](https://huggingface.co/handy-computer/gigaam-v3-rnnt-gguf/resolve/8f30356b4607ae2d79353ab7dc9e5eea6dc46b48/gigaam-v3-rnnt-Q4_K_M.gguf?download=true)  
[🔽 F16 · 451 MB](https://huggingface.co/handy-computer/gigaam-v3-rnnt-gguf/resolve/8f30356b4607ae2d79353ab7dc9e5eea6dc46b48/gigaam-v3-rnnt-F16.gguf?download=true)  
[🔽 F32 · 888 MB](https://huggingface.co/handy-computer/gigaam-v3-rnnt-gguf/resolve/8f30356b4607ae2d79353ab7dc9e5eea6dc46b48/gigaam-v3-rnnt-F32.gguf?download=true)

### Granite Speech 4.0 1B

Por Handy · 2.3B parámetros · Idiomas: en, fr, de, es, pt +1

[👉 Ver modelo](https://huggingface.co/handy-computer/granite-4.0-1b-speech-gguf/tree/5899f364fb5bc4bae48c54dec8489aff40b70253)  
[🔽 Q8_0 · 2560 MB](https://huggingface.co/handy-computer/granite-4.0-1b-speech-gguf/resolve/5899f364fb5bc4bae48c54dec8489aff40b70253/granite-4.0-1b-speech-Q8_0.gguf?download=true)  
[🔽 Q6_K · 2025 MB](https://huggingface.co/handy-computer/granite-4.0-1b-speech-gguf/resolve/5899f364fb5bc4bae48c54dec8489aff40b70253/granite-4.0-1b-speech-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 1830 MB](https://huggingface.co/handy-computer/granite-4.0-1b-speech-gguf/resolve/5899f364fb5bc4bae48c54dec8489aff40b70253/granite-4.0-1b-speech-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 1603 MB](https://huggingface.co/handy-computer/granite-4.0-1b-speech-gguf/resolve/5899f364fb5bc4bae48c54dec8489aff40b70253/granite-4.0-1b-speech-Q4_K_M.gguf?download=true)  
[🔽 F16 · 4633 MB](https://huggingface.co/handy-computer/granite-4.0-1b-speech-gguf/resolve/5899f364fb5bc4bae48c54dec8489aff40b70253/granite-4.0-1b-speech-F16.gguf?download=true)  
[🔽 BF16 · 4632 MB](https://huggingface.co/handy-computer/granite-4.0-1b-speech-gguf/resolve/5899f364fb5bc4bae48c54dec8489aff40b70253/granite-4.0-1b-speech-BF16.gguf?download=true)

### Granite Speech 4.1 2B NAR

Por Handy · 2.3B parámetros · Idiomas: en, fr, de, es, pt

[👉 Ver modelo](https://huggingface.co/handy-computer/granite-speech-4.1-2b-nar-gguf/tree/ca53e8273416eb7e888f19bcebbcb9b6ab3edc17)  
[🔽 Q8_0 · 2498 MB](https://huggingface.co/handy-computer/granite-speech-4.1-2b-nar-gguf/resolve/ca53e8273416eb7e888f19bcebbcb9b6ab3edc17/granite-speech-4.1-2b-nar-Q8_0.gguf?download=true)  
[🔽 Q6_K · 1977 MB](https://huggingface.co/handy-computer/granite-speech-4.1-2b-nar-gguf/resolve/ca53e8273416eb7e888f19bcebbcb9b6ab3edc17/granite-speech-4.1-2b-nar-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 1782 MB](https://huggingface.co/handy-computer/granite-speech-4.1-2b-nar-gguf/resolve/ca53e8273416eb7e888f19bcebbcb9b6ab3edc17/granite-speech-4.1-2b-nar-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 1560 MB](https://huggingface.co/handy-computer/granite-speech-4.1-2b-nar-gguf/resolve/ca53e8273416eb7e888f19bcebbcb9b6ab3edc17/granite-speech-4.1-2b-nar-Q4_K_M.gguf?download=true)  
[🔽 F16 · 4516 MB](https://huggingface.co/handy-computer/granite-speech-4.1-2b-nar-gguf/resolve/ca53e8273416eb7e888f19bcebbcb9b6ab3edc17/granite-speech-4.1-2b-nar-F16.gguf?download=true)  
[🔽 BF16 · 4515 MB](https://huggingface.co/handy-computer/granite-speech-4.1-2b-nar-gguf/resolve/ca53e8273416eb7e888f19bcebbcb9b6ab3edc17/granite-speech-4.1-2b-nar-BF16.gguf?download=true)

### Granite Speech 4.1 2B Plus

Por Handy · 2.1B parámetros · Idiomas: en, fr, de, es, pt

[👉 Ver modelo](https://huggingface.co/handy-computer/granite-speech-4.1-2b-plus-gguf/tree/f73a59df77fef89ac0a34bc539d09d756793b065)  
[🔽 Q8_0 · 2346 MB](https://huggingface.co/handy-computer/granite-speech-4.1-2b-plus-gguf/resolve/f73a59df77fef89ac0a34bc539d09d756793b065/granite-speech-4.1-2b-plus-Q8_0.gguf?download=true)  
[🔽 Q6_K · 1860 MB](https://huggingface.co/handy-computer/granite-speech-4.1-2b-plus-gguf/resolve/f73a59df77fef89ac0a34bc539d09d756793b065/granite-speech-4.1-2b-plus-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 1691 MB](https://huggingface.co/handy-computer/granite-speech-4.1-2b-plus-gguf/resolve/f73a59df77fef89ac0a34bc539d09d756793b065/granite-speech-4.1-2b-plus-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 1490 MB](https://huggingface.co/handy-computer/granite-speech-4.1-2b-plus-gguf/resolve/f73a59df77fef89ac0a34bc539d09d756793b065/granite-speech-4.1-2b-plus-Q4_K_M.gguf?download=true)  
[🔽 F16 · 4230 MB](https://huggingface.co/handy-computer/granite-speech-4.1-2b-plus-gguf/resolve/f73a59df77fef89ac0a34bc539d09d756793b065/granite-speech-4.1-2b-plus-F16.gguf?download=true)  
[🔽 BF16 · 4229 MB](https://huggingface.co/handy-computer/granite-speech-4.1-2b-plus-gguf/resolve/f73a59df77fef89ac0a34bc539d09d756793b065/granite-speech-4.1-2b-plus-BF16.gguf?download=true)

### Granite Speech 5.0 470M TurboCTC (Non-Commercial)

Por Handy · 473M parámetros · Idiomas: en

[👉 Ver modelo](https://huggingface.co/handy-computer/granite-speech-5.0-470m-turboctc-nc-gguf/tree/fb8091e2c1e50ef67d3e795ee9f84d703343d7c5)  
[🔽 Q8_0 · 506 MB](https://huggingface.co/handy-computer/granite-speech-5.0-470m-turboctc-nc-gguf/resolve/fb8091e2c1e50ef67d3e795ee9f84d703343d7c5/granite-speech-5.0-470m-turboctc-nc-Q8_0.gguf?download=true)  
[🔽 Q6_K · 392 MB](https://huggingface.co/handy-computer/granite-speech-5.0-470m-turboctc-nc-gguf/resolve/fb8091e2c1e50ef67d3e795ee9f84d703343d7c5/granite-speech-5.0-470m-turboctc-nc-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 336 MB](https://huggingface.co/handy-computer/granite-speech-5.0-470m-turboctc-nc-gguf/resolve/fb8091e2c1e50ef67d3e795ee9f84d703343d7c5/granite-speech-5.0-470m-turboctc-nc-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 279 MB](https://huggingface.co/handy-computer/granite-speech-5.0-470m-turboctc-nc-gguf/resolve/fb8091e2c1e50ef67d3e795ee9f84d703343d7c5/granite-speech-5.0-470m-turboctc-nc-Q4_K_M.gguf?download=true)  
[🔽 F16 · 949 MB](https://huggingface.co/handy-computer/granite-speech-5.0-470m-turboctc-nc-gguf/resolve/fb8091e2c1e50ef67d3e795ee9f84d703343d7c5/granite-speech-5.0-470m-turboctc-nc-F16.gguf?download=true)  
[🔽 BF16 · 948 MB](https://huggingface.co/handy-computer/granite-speech-5.0-470m-turboctc-nc-gguf/resolve/fb8091e2c1e50ef67d3e795ee9f84d703343d7c5/granite-speech-5.0-470m-turboctc-nc-BF16.gguf?download=true)

### Moonshine Base

Por Handy · 62M parámetros · Idiomas: en

[👉 Ver modelo](https://huggingface.co/handy-computer/moonshine-base-gguf/tree/3ef112378a8cf46ac8b278d9bfa2d15c846704b8)  
[🔽 Q8_0 · 77 MB](https://huggingface.co/handy-computer/moonshine-base-gguf/resolve/3ef112378a8cf46ac8b278d9bfa2d15c846704b8/moonshine-base-Q8_0.gguf?download=true)  
[🔽 F16 · 132 MB](https://huggingface.co/handy-computer/moonshine-base-gguf/resolve/3ef112378a8cf46ac8b278d9bfa2d15c846704b8/moonshine-base-F16.gguf?download=true)  
[🔽 F32 · 248 MB](https://huggingface.co/handy-computer/moonshine-base-gguf/resolve/3ef112378a8cf46ac8b278d9bfa2d15c846704b8/moonshine-base-F32.gguf?download=true)

### Moonshine Base Arabic

Por Handy · 62M parámetros · Idiomas: ar

[👉 Ver modelo](https://huggingface.co/handy-computer/moonshine-base-ar-gguf/tree/1ae85af52b16eac8bcebda0287e6195ed1956e86)  
[🔽 Q8_0 · 77 MB](https://huggingface.co/handy-computer/moonshine-base-ar-gguf/resolve/1ae85af52b16eac8bcebda0287e6195ed1956e86/moonshine-base-ar-Q8_0.gguf?download=true)  
[🔽 F16 · 132 MB](https://huggingface.co/handy-computer/moonshine-base-ar-gguf/resolve/1ae85af52b16eac8bcebda0287e6195ed1956e86/moonshine-base-ar-F16.gguf?download=true)  
[🔽 F32 · 248 MB](https://huggingface.co/handy-computer/moonshine-base-ar-gguf/resolve/1ae85af52b16eac8bcebda0287e6195ed1956e86/moonshine-base-ar-F32.gguf?download=true)

### Moonshine Base Japanese

Por Handy · 62M parámetros · Idiomas: ja

[👉 Ver modelo](https://huggingface.co/handy-computer/moonshine-base-ja-gguf/tree/aac5cfff17ae28b6f17ae790a3e309ae0ca5911c)  
[🔽 Q8_0 · 77 MB](https://huggingface.co/handy-computer/moonshine-base-ja-gguf/resolve/aac5cfff17ae28b6f17ae790a3e309ae0ca5911c/moonshine-base-ja-Q8_0.gguf?download=true)  
[🔽 F16 · 132 MB](https://huggingface.co/handy-computer/moonshine-base-ja-gguf/resolve/aac5cfff17ae28b6f17ae790a3e309ae0ca5911c/moonshine-base-ja-F16.gguf?download=true)  
[🔽 F32 · 248 MB](https://huggingface.co/handy-computer/moonshine-base-ja-gguf/resolve/aac5cfff17ae28b6f17ae790a3e309ae0ca5911c/moonshine-base-ja-F32.gguf?download=true)

### Moonshine Base Korean

Por Handy · 62M parámetros · Idiomas: ko

[👉 Ver modelo](https://huggingface.co/handy-computer/moonshine-base-ko-gguf/tree/03813c71abe85b40cd0671d3cfa420e831d7e333)  
[🔽 Q8_0 · 77 MB](https://huggingface.co/handy-computer/moonshine-base-ko-gguf/resolve/03813c71abe85b40cd0671d3cfa420e831d7e333/moonshine-base-ko-Q8_0.gguf?download=true)  
[🔽 F16 · 132 MB](https://huggingface.co/handy-computer/moonshine-base-ko-gguf/resolve/03813c71abe85b40cd0671d3cfa420e831d7e333/moonshine-base-ko-F16.gguf?download=true)  
[🔽 F32 · 248 MB](https://huggingface.co/handy-computer/moonshine-base-ko-gguf/resolve/03813c71abe85b40cd0671d3cfa420e831d7e333/moonshine-base-ko-F32.gguf?download=true)

### Moonshine Base Ukrainian

Por Handy · 62M parámetros · Idiomas: uk

[👉 Ver modelo](https://huggingface.co/handy-computer/moonshine-base-uk-gguf/tree/d6ec586909c5209c0c17243dc4f5e55164f85dfb)  
[🔽 Q8_0 · 77 MB](https://huggingface.co/handy-computer/moonshine-base-uk-gguf/resolve/d6ec586909c5209c0c17243dc4f5e55164f85dfb/moonshine-base-uk-Q8_0.gguf?download=true)  
[🔽 F16 · 132 MB](https://huggingface.co/handy-computer/moonshine-base-uk-gguf/resolve/d6ec586909c5209c0c17243dc4f5e55164f85dfb/moonshine-base-uk-F16.gguf?download=true)  
[🔽 F32 · 248 MB](https://huggingface.co/handy-computer/moonshine-base-uk-gguf/resolve/d6ec586909c5209c0c17243dc4f5e55164f85dfb/moonshine-base-uk-F32.gguf?download=true)

### Moonshine Base Vietnamese

Por Handy · 62M parámetros · Idiomas: vi

[👉 Ver modelo](https://huggingface.co/handy-computer/moonshine-base-vi-gguf/tree/76ccec93f5854ae16d2dab72d5b762fe10c0df81)  
[🔽 Q8_0 · 77 MB](https://huggingface.co/handy-computer/moonshine-base-vi-gguf/resolve/76ccec93f5854ae16d2dab72d5b762fe10c0df81/moonshine-base-vi-Q8_0.gguf?download=true)  
[🔽 F16 · 132 MB](https://huggingface.co/handy-computer/moonshine-base-vi-gguf/resolve/76ccec93f5854ae16d2dab72d5b762fe10c0df81/moonshine-base-vi-F16.gguf?download=true)  
[🔽 F32 · 248 MB](https://huggingface.co/handy-computer/moonshine-base-vi-gguf/resolve/76ccec93f5854ae16d2dab72d5b762fe10c0df81/moonshine-base-vi-F32.gguf?download=true)

### Moonshine Base Chinese

Por Handy · 62M parámetros · Idiomas: zh

[👉 Ver modelo](https://huggingface.co/handy-computer/moonshine-base-zh-gguf/tree/64385c681d79767be73ce8591b4609854ac750c9)  
[🔽 Q8_0 · 77 MB](https://huggingface.co/handy-computer/moonshine-base-zh-gguf/resolve/64385c681d79767be73ce8591b4609854ac750c9/moonshine-base-zh-Q8_0.gguf?download=true)  
[🔽 F16 · 132 MB](https://huggingface.co/handy-computer/moonshine-base-zh-gguf/resolve/64385c681d79767be73ce8591b4609854ac750c9/moonshine-base-zh-F16.gguf?download=true)  
[🔽 F32 · 248 MB](https://huggingface.co/handy-computer/moonshine-base-zh-gguf/resolve/64385c681d79767be73ce8591b4609854ac750c9/moonshine-base-zh-F32.gguf?download=true)

### Moonshine Streaming Medium

Por Handy · 266M parámetros · Idiomas: en  
Admite streaming.

[👉 Ver modelo](https://huggingface.co/handy-computer/moonshine-streaming-medium-gguf/tree/c722a9455a40a1844c3d25267dc84eff61d8dd84)  
[🔽 Q8_0 · 296 MB](https://huggingface.co/handy-computer/moonshine-streaming-medium-gguf/resolve/c722a9455a40a1844c3d25267dc84eff61d8dd84/moonshine-streaming-medium-Q8_0.gguf?download=true)  
[🔽 F16 · 534 MB](https://huggingface.co/handy-computer/moonshine-streaming-medium-gguf/resolve/c722a9455a40a1844c3d25267dc84eff61d8dd84/moonshine-streaming-medium-F16.gguf?download=true)  
[🔽 F32 · 1065 MB](https://huggingface.co/handy-computer/moonshine-streaming-medium-gguf/resolve/c722a9455a40a1844c3d25267dc84eff61d8dd84/moonshine-streaming-medium-F32.gguf?download=true)

### Moonshine Streaming Small

Por Handy · 140M parámetros · Idiomas: en  
Admite streaming.

[👉 Ver modelo](https://huggingface.co/handy-computer/moonshine-streaming-small-gguf/tree/41444173ed8210852a883e046fadcfba3e7bfbae)  
[🔽 Q8_0 · 199 MB](https://huggingface.co/handy-computer/moonshine-streaming-small-gguf/resolve/41444173ed8210852a883e046fadcfba3e7bfbae/moonshine-streaming-small-Q8_0.gguf?download=true)  
[🔽 F16 · 282 MB](https://huggingface.co/handy-computer/moonshine-streaming-small-gguf/resolve/41444173ed8210852a883e046fadcfba3e7bfbae/moonshine-streaming-small-F16.gguf?download=true)  
[🔽 F32 · 562 MB](https://huggingface.co/handy-computer/moonshine-streaming-small-gguf/resolve/41444173ed8210852a883e046fadcfba3e7bfbae/moonshine-streaming-small-F32.gguf?download=true)

### Moonshine Streaming Tiny

Por Handy · 44M parámetros · Idiomas: en  
Admite streaming.

[👉 Ver modelo](https://huggingface.co/handy-computer/moonshine-streaming-tiny-gguf/tree/85ddff612fa3a2cf40b2f745abcfa90ef82f293b)  
[🔽 Q8_0 · 50 MB](https://huggingface.co/handy-computer/moonshine-streaming-tiny-gguf/resolve/85ddff612fa3a2cf40b2f745abcfa90ef82f293b/moonshine-streaming-tiny-Q8_0.gguf?download=true)  
[🔽 F16 · 90 MB](https://huggingface.co/handy-computer/moonshine-streaming-tiny-gguf/resolve/85ddff612fa3a2cf40b2f745abcfa90ef82f293b/moonshine-streaming-tiny-F16.gguf?download=true)  
[🔽 F32 · 178 MB](https://huggingface.co/handy-computer/moonshine-streaming-tiny-gguf/resolve/85ddff612fa3a2cf40b2f745abcfa90ef82f293b/moonshine-streaming-tiny-F32.gguf?download=true)

### Moonshine Tiny

Por Handy · 27M parámetros · Idiomas: en

[👉 Ver modelo](https://huggingface.co/handy-computer/moonshine-tiny-gguf/tree/f5c11906eba3f44cf305eed30feb9cbfb0b4b9d0)  
[🔽 Q8_0 · 35 MB](https://huggingface.co/handy-computer/moonshine-tiny-gguf/resolve/f5c11906eba3f44cf305eed30feb9cbfb0b4b9d0/moonshine-tiny-Q8_0.gguf?download=true)  
[🔽 F16 · 59 MB](https://huggingface.co/handy-computer/moonshine-tiny-gguf/resolve/f5c11906eba3f44cf305eed30feb9cbfb0b4b9d0/moonshine-tiny-F16.gguf?download=true)  
[🔽 F32 · 110 MB](https://huggingface.co/handy-computer/moonshine-tiny-gguf/resolve/f5c11906eba3f44cf305eed30feb9cbfb0b4b9d0/moonshine-tiny-F32.gguf?download=true)

### Moonshine Tiny Arabic

Por Handy · 27M parámetros · Idiomas: ar

[👉 Ver modelo](https://huggingface.co/handy-computer/moonshine-tiny-ar-gguf/tree/2360cb6893cb523da51875eaffc8050d2ca7b56d)  
[🔽 Q8_0 · 35 MB](https://huggingface.co/handy-computer/moonshine-tiny-ar-gguf/resolve/2360cb6893cb523da51875eaffc8050d2ca7b56d/moonshine-tiny-ar-Q8_0.gguf?download=true)  
[🔽 F16 · 59 MB](https://huggingface.co/handy-computer/moonshine-tiny-ar-gguf/resolve/2360cb6893cb523da51875eaffc8050d2ca7b56d/moonshine-tiny-ar-F16.gguf?download=true)  
[🔽 F32 · 110 MB](https://huggingface.co/handy-computer/moonshine-tiny-ar-gguf/resolve/2360cb6893cb523da51875eaffc8050d2ca7b56d/moonshine-tiny-ar-F32.gguf?download=true)

### Moonshine Tiny Japanese

Por Handy · 27M parámetros · Idiomas: ja

[👉 Ver modelo](https://huggingface.co/handy-computer/moonshine-tiny-ja-gguf/tree/627aae63193d6c47cbdf316346119dcdc65d9b0d)  
[🔽 Q8_0 · 35 MB](https://huggingface.co/handy-computer/moonshine-tiny-ja-gguf/resolve/627aae63193d6c47cbdf316346119dcdc65d9b0d/moonshine-tiny-ja-Q8_0.gguf?download=true)  
[🔽 F16 · 59 MB](https://huggingface.co/handy-computer/moonshine-tiny-ja-gguf/resolve/627aae63193d6c47cbdf316346119dcdc65d9b0d/moonshine-tiny-ja-F16.gguf?download=true)  
[🔽 F32 · 110 MB](https://huggingface.co/handy-computer/moonshine-tiny-ja-gguf/resolve/627aae63193d6c47cbdf316346119dcdc65d9b0d/moonshine-tiny-ja-F32.gguf?download=true)

### Moonshine Tiny Korean

Por Handy · 27M parámetros · Idiomas: ko

[👉 Ver modelo](https://huggingface.co/handy-computer/moonshine-tiny-ko-gguf/tree/b858a303948b69c8b2442f700e936a07ba5f64da)  
[🔽 Q8_0 · 35 MB](https://huggingface.co/handy-computer/moonshine-tiny-ko-gguf/resolve/b858a303948b69c8b2442f700e936a07ba5f64da/moonshine-tiny-ko-Q8_0.gguf?download=true)  
[🔽 F16 · 59 MB](https://huggingface.co/handy-computer/moonshine-tiny-ko-gguf/resolve/b858a303948b69c8b2442f700e936a07ba5f64da/moonshine-tiny-ko-F16.gguf?download=true)  
[🔽 F32 · 110 MB](https://huggingface.co/handy-computer/moonshine-tiny-ko-gguf/resolve/b858a303948b69c8b2442f700e936a07ba5f64da/moonshine-tiny-ko-F32.gguf?download=true)

### Moonshine Tiny Ukrainian

Por Handy · 27M parámetros · Idiomas: uk

[👉 Ver modelo](https://huggingface.co/handy-computer/moonshine-tiny-uk-gguf/tree/b4c991eb4223caa4de770843185476b0c86056b4)  
[🔽 Q8_0 · 35 MB](https://huggingface.co/handy-computer/moonshine-tiny-uk-gguf/resolve/b4c991eb4223caa4de770843185476b0c86056b4/moonshine-tiny-uk-Q8_0.gguf?download=true)  
[🔽 F16 · 59 MB](https://huggingface.co/handy-computer/moonshine-tiny-uk-gguf/resolve/b4c991eb4223caa4de770843185476b0c86056b4/moonshine-tiny-uk-F16.gguf?download=true)  
[🔽 F32 · 110 MB](https://huggingface.co/handy-computer/moonshine-tiny-uk-gguf/resolve/b4c991eb4223caa4de770843185476b0c86056b4/moonshine-tiny-uk-F32.gguf?download=true)

### Moonshine Tiny Vietnamese

Por Handy · 27M parámetros · Idiomas: vi

[👉 Ver modelo](https://huggingface.co/handy-computer/moonshine-tiny-vi-gguf/tree/d97be0111a74a9058689beacc05b38969d2b68aa)  
[🔽 Q8_0 · 35 MB](https://huggingface.co/handy-computer/moonshine-tiny-vi-gguf/resolve/d97be0111a74a9058689beacc05b38969d2b68aa/moonshine-tiny-vi-Q8_0.gguf?download=true)  
[🔽 F16 · 59 MB](https://huggingface.co/handy-computer/moonshine-tiny-vi-gguf/resolve/d97be0111a74a9058689beacc05b38969d2b68aa/moonshine-tiny-vi-F16.gguf?download=true)  
[🔽 F32 · 110 MB](https://huggingface.co/handy-computer/moonshine-tiny-vi-gguf/resolve/d97be0111a74a9058689beacc05b38969d2b68aa/moonshine-tiny-vi-F32.gguf?download=true)

### Moonshine Tiny Chinese

Por Handy · 27M parámetros · Idiomas: zh

[👉 Ver modelo](https://huggingface.co/handy-computer/moonshine-tiny-zh-gguf/tree/2aca379ba0dc978d878b84b76231d5ba5550e738)  
[🔽 Q8_0 · 35 MB](https://huggingface.co/handy-computer/moonshine-tiny-zh-gguf/resolve/2aca379ba0dc978d878b84b76231d5ba5550e738/moonshine-tiny-zh-Q8_0.gguf?download=true)  
[🔽 F16 · 59 MB](https://huggingface.co/handy-computer/moonshine-tiny-zh-gguf/resolve/2aca379ba0dc978d878b84b76231d5ba5550e738/moonshine-tiny-zh-F16.gguf?download=true)  
[🔽 F32 · 110 MB](https://huggingface.co/handy-computer/moonshine-tiny-zh-gguf/resolve/2aca379ba0dc978d878b84b76231d5ba5550e738/moonshine-tiny-zh-F32.gguf?download=true)

### MOSS Transcribe Diarize

Por Handy · 909M parámetros · Idiomas: en, zh

[👉 Ver modelo](https://huggingface.co/handy-computer/moss-transcribe-diarize-gguf/tree/6fdfa33aed776bbb0ac11a1a9835634fe6d75dd7)  
[🔽 Q8_0 · 987 MB](https://huggingface.co/handy-computer/moss-transcribe-diarize-gguf/resolve/6fdfa33aed776bbb0ac11a1a9835634fe6d75dd7/MOSS-Transcribe-Diarize-Q8_0.gguf?download=true)  
[🔽 Q6_K · 768 MB](https://huggingface.co/handy-computer/moss-transcribe-diarize-gguf/resolve/6fdfa33aed776bbb0ac11a1a9835634fe6d75dd7/MOSS-Transcribe-Diarize-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 700 MB](https://huggingface.co/handy-computer/moss-transcribe-diarize-gguf/resolve/6fdfa33aed776bbb0ac11a1a9835634fe6d75dd7/MOSS-Transcribe-Diarize-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 617 MB](https://huggingface.co/handy-computer/moss-transcribe-diarize-gguf/resolve/6fdfa33aed776bbb0ac11a1a9835634fe6d75dd7/MOSS-Transcribe-Diarize-Q4_K_M.gguf?download=true)  
[🔽 F16 · 1834 MB](https://huggingface.co/handy-computer/moss-transcribe-diarize-gguf/resolve/6fdfa33aed776bbb0ac11a1a9835634fe6d75dd7/MOSS-Transcribe-Diarize-F16.gguf?download=true)  
[🔽 BF16 · 1827 MB](https://huggingface.co/handy-computer/moss-transcribe-diarize-gguf/resolve/6fdfa33aed776bbb0ac11a1a9835634fe6d75dd7/MOSS-Transcribe-Diarize-BF16.gguf?download=true)

### Nemotron Speech Streaming English 0.6B

Por Handy · 618M parámetros · Idiomas: en  
Admite streaming.

[👉 Ver modelo](https://huggingface.co/handy-computer/nemotron-speech-streaming-en-0.6b-gguf/tree/7d9b719206789e4068d87c6398262ab4dfd4e45d)  
[🔽 Q8_0 · 730 MB](https://huggingface.co/handy-computer/nemotron-speech-streaming-en-0.6b-gguf/resolve/7d9b719206789e4068d87c6398262ab4dfd4e45d/nemotron-speech-streaming-en-0.6b-Q8_0.gguf?download=true)  
[🔽 Q6_K · 600 MB](https://huggingface.co/handy-computer/nemotron-speech-streaming-en-0.6b-gguf/resolve/7d9b719206789e4068d87c6398262ab4dfd4e45d/nemotron-speech-streaming-en-0.6b-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 539 MB](https://huggingface.co/handy-computer/nemotron-speech-streaming-en-0.6b-gguf/resolve/7d9b719206789e4068d87c6398262ab4dfd4e45d/nemotron-speech-streaming-en-0.6b-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 475 MB](https://huggingface.co/handy-computer/nemotron-speech-streaming-en-0.6b-gguf/resolve/7d9b719206789e4068d87c6398262ab4dfd4e45d/nemotron-speech-streaming-en-0.6b-Q4_K_M.gguf?download=true)  
[🔽 F16 · 1238 MB](https://huggingface.co/handy-computer/nemotron-speech-streaming-en-0.6b-gguf/resolve/7d9b719206789e4068d87c6398262ab4dfd4e45d/nemotron-speech-streaming-en-0.6b-F16.gguf?download=true)  
[🔽 F32 · 2472 MB](https://huggingface.co/handy-computer/nemotron-speech-streaming-en-0.6b-gguf/resolve/7d9b719206789e4068d87c6398262ab4dfd4e45d/nemotron-speech-streaming-en-0.6b-F32.gguf?download=true)

### Orukeet

Por Handy · 627M parámetros · Idiomas: bg, hr, cs, da, nl +20

[👉 Ver modelo](https://huggingface.co/handy-computer/orukeet-gguf/tree/ab8536716c3aa03d49c4c36c0dae6a3da71210b8)  
[🔽 Q8_0 · 740 MB](https://huggingface.co/handy-computer/orukeet-gguf/resolve/ab8536716c3aa03d49c4c36c0dae6a3da71210b8/orukeet-Q8_0.gguf?download=true)  
[🔽 Q6_K · 610 MB](https://huggingface.co/handy-computer/orukeet-gguf/resolve/ab8536716c3aa03d49c4c36c0dae6a3da71210b8/orukeet-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 549 MB](https://huggingface.co/handy-computer/orukeet-gguf/resolve/ab8536716c3aa03d49c4c36c0dae6a3da71210b8/orukeet-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 485 MB](https://huggingface.co/handy-computer/orukeet-gguf/resolve/ab8536716c3aa03d49c4c36c0dae6a3da71210b8/orukeet-Q4_K_M.gguf?download=true)  
[🔽 F16 · 1256 MB](https://huggingface.co/handy-computer/orukeet-gguf/resolve/ab8536716c3aa03d49c4c36c0dae6a3da71210b8/orukeet-F16.gguf?download=true)  
[🔽 F32 · 2508 MB](https://huggingface.co/handy-computer/orukeet-gguf/resolve/ab8536716c3aa03d49c4c36c0dae6a3da71210b8/orukeet-F32.gguf?download=true)

### Parakeet CTC 0.6B

Por Handy · 609M parámetros · Idiomas: en

[👉 Ver modelo](https://huggingface.co/handy-computer/parakeet-ctc-0.6b-gguf/tree/cdc56f0467ec675a9509a46ef2e83f4c9e49af94)  
[🔽 Q8_0 · 722 MB](https://huggingface.co/handy-computer/parakeet-ctc-0.6b-gguf/resolve/cdc56f0467ec675a9509a46ef2e83f4c9e49af94/parakeet-ctc-0.6b-Q8_0.gguf?download=true)  
[🔽 Q6_K · 594 MB](https://huggingface.co/handy-computer/parakeet-ctc-0.6b-gguf/resolve/cdc56f0467ec675a9509a46ef2e83f4c9e49af94/parakeet-ctc-0.6b-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 533 MB](https://huggingface.co/handy-computer/parakeet-ctc-0.6b-gguf/resolve/cdc56f0467ec675a9509a46ef2e83f4c9e49af94/parakeet-ctc-0.6b-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 469 MB](https://huggingface.co/handy-computer/parakeet-ctc-0.6b-gguf/resolve/cdc56f0467ec675a9509a46ef2e83f4c9e49af94/parakeet-ctc-0.6b-Q4_K_M.gguf?download=true)  
[🔽 F16 · 1220 MB](https://huggingface.co/handy-computer/parakeet-ctc-0.6b-gguf/resolve/cdc56f0467ec675a9509a46ef2e83f4c9e49af94/parakeet-ctc-0.6b-F16.gguf?download=true)  
[🔽 F32 · 2435 MB](https://huggingface.co/handy-computer/parakeet-ctc-0.6b-gguf/resolve/cdc56f0467ec675a9509a46ef2e83f4c9e49af94/parakeet-ctc-0.6b-F32.gguf?download=true)

### Parakeet CTC 1.1B

Por Handy · 1.1B parámetros · Idiomas: en

[👉 Ver modelo](https://huggingface.co/handy-computer/parakeet-ctc-1.1b-gguf/tree/a9607fbeb480b4a66a3e8bd77efc490e8410cdd4)  
[🔽 Q8_0 · 1260 MB](https://huggingface.co/handy-computer/parakeet-ctc-1.1b-gguf/resolve/a9607fbeb480b4a66a3e8bd77efc490e8410cdd4/parakeet-ctc-1.1b-Q8_0.gguf?download=true)  
[🔽 Q6_K · 1035 MB](https://huggingface.co/handy-computer/parakeet-ctc-1.1b-gguf/resolve/a9607fbeb480b4a66a3e8bd77efc490e8410cdd4/parakeet-ctc-1.1b-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 929 MB](https://huggingface.co/handy-computer/parakeet-ctc-1.1b-gguf/resolve/a9607fbeb480b4a66a3e8bd77efc490e8410cdd4/parakeet-ctc-1.1b-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 818 MB](https://huggingface.co/handy-computer/parakeet-ctc-1.1b-gguf/resolve/a9607fbeb480b4a66a3e8bd77efc490e8410cdd4/parakeet-ctc-1.1b-Q4_K_M.gguf?download=true)  
[🔽 F16 · 2129 MB](https://huggingface.co/handy-computer/parakeet-ctc-1.1b-gguf/resolve/a9607fbeb480b4a66a3e8bd77efc490e8410cdd4/parakeet-ctc-1.1b-F16.gguf?download=true)  
[🔽 F32 · 4251 MB](https://huggingface.co/handy-computer/parakeet-ctc-1.1b-gguf/resolve/a9607fbeb480b4a66a3e8bd77efc490e8410cdd4/parakeet-ctc-1.1b-F32.gguf?download=true)

### Parakeet Primeline

Por Handy · 627M parámetros · Idiomas: bg, hr, cs, da, nl +20

[👉 Ver modelo](https://huggingface.co/handy-computer/parakeet-primeline-gguf/tree/90880dc372f8cc0025ae7a08d2c887278124a538)  
[🔽 Q8_0 · 740 MB](https://huggingface.co/handy-computer/parakeet-primeline-gguf/resolve/90880dc372f8cc0025ae7a08d2c887278124a538/parakeet-primeline-Q8_0.gguf?download=true)  
[🔽 Q6_K · 610 MB](https://huggingface.co/handy-computer/parakeet-primeline-gguf/resolve/90880dc372f8cc0025ae7a08d2c887278124a538/parakeet-primeline-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 549 MB](https://huggingface.co/handy-computer/parakeet-primeline-gguf/resolve/90880dc372f8cc0025ae7a08d2c887278124a538/parakeet-primeline-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 485 MB](https://huggingface.co/handy-computer/parakeet-primeline-gguf/resolve/90880dc372f8cc0025ae7a08d2c887278124a538/parakeet-primeline-Q4_K_M.gguf?download=true)  
[🔽 F16 · 1256 MB](https://huggingface.co/handy-computer/parakeet-primeline-gguf/resolve/90880dc372f8cc0025ae7a08d2c887278124a538/parakeet-primeline-F16.gguf?download=true)  
[🔽 F32 · 2508 MB](https://huggingface.co/handy-computer/parakeet-primeline-gguf/resolve/90880dc372f8cc0025ae7a08d2c887278124a538/parakeet-primeline-F32.gguf?download=true)

### Parakeet RNN-T 0.6B

Por Handy · 617M parámetros · Idiomas: en

[👉 Ver modelo](https://huggingface.co/handy-computer/parakeet-rnnt-0.6b-gguf/tree/6001ebcc1c64dd821cf70b7b4ffdd4d18097760a)  
[🔽 Q8_0 · 730 MB](https://huggingface.co/handy-computer/parakeet-rnnt-0.6b-gguf/resolve/6001ebcc1c64dd821cf70b7b4ffdd4d18097760a/parakeet-rnnt-0.6b-Q8_0.gguf?download=true)  
[🔽 Q6_K · 601 MB](https://huggingface.co/handy-computer/parakeet-rnnt-0.6b-gguf/resolve/6001ebcc1c64dd821cf70b7b4ffdd4d18097760a/parakeet-rnnt-0.6b-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 540 MB](https://huggingface.co/handy-computer/parakeet-rnnt-0.6b-gguf/resolve/6001ebcc1c64dd821cf70b7b4ffdd4d18097760a/parakeet-rnnt-0.6b-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 476 MB](https://huggingface.co/handy-computer/parakeet-rnnt-0.6b-gguf/resolve/6001ebcc1c64dd821cf70b7b4ffdd4d18097760a/parakeet-rnnt-0.6b-Q4_K_M.gguf?download=true)  
[🔽 F16 · 1236 MB](https://huggingface.co/handy-computer/parakeet-rnnt-0.6b-gguf/resolve/6001ebcc1c64dd821cf70b7b4ffdd4d18097760a/parakeet-rnnt-0.6b-F16.gguf?download=true)  
[🔽 F32 · 2467 MB](https://huggingface.co/handy-computer/parakeet-rnnt-0.6b-gguf/resolve/6001ebcc1c64dd821cf70b7b4ffdd4d18097760a/parakeet-rnnt-0.6b-F32.gguf?download=true)

### Parakeet RNN-T 1.1B

Por Handy · 1.1B parámetros · Idiomas: en

[👉 Ver modelo](https://huggingface.co/handy-computer/parakeet-rnnt-1.1b-gguf/tree/58c3f5108699a6aba6d6dbb21f8fa153fe7d3f62)  
[🔽 Q8_0 · 1267 MB](https://huggingface.co/handy-computer/parakeet-rnnt-1.1b-gguf/resolve/58c3f5108699a6aba6d6dbb21f8fa153fe7d3f62/parakeet-rnnt-1.1b-Q8_0.gguf?download=true)  
[🔽 Q6_K · 1043 MB](https://huggingface.co/handy-computer/parakeet-rnnt-1.1b-gguf/resolve/58c3f5108699a6aba6d6dbb21f8fa153fe7d3f62/parakeet-rnnt-1.1b-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 936 MB](https://huggingface.co/handy-computer/parakeet-rnnt-1.1b-gguf/resolve/58c3f5108699a6aba6d6dbb21f8fa153fe7d3f62/parakeet-rnnt-1.1b-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 825 MB](https://huggingface.co/handy-computer/parakeet-rnnt-1.1b-gguf/resolve/58c3f5108699a6aba6d6dbb21f8fa153fe7d3f62/parakeet-rnnt-1.1b-Q4_K_M.gguf?download=true)  
[🔽 F16 · 2145 MB](https://huggingface.co/handy-computer/parakeet-rnnt-1.1b-gguf/resolve/58c3f5108699a6aba6d6dbb21f8fa153fe7d3f62/parakeet-rnnt-1.1b-F16.gguf?download=true)  
[🔽 F32 · 4282 MB](https://huggingface.co/handy-computer/parakeet-rnnt-1.1b-gguf/resolve/58c3f5108699a6aba6d6dbb21f8fa153fe7d3f62/parakeet-rnnt-1.1b-F32.gguf?download=true)

### Parakeet TDT-CTC 1.1B

Por Handy · 1.1B parámetros · Idiomas: en

[👉 Ver modelo](https://huggingface.co/handy-computer/parakeet-tdt_ctc-1.1b-gguf/tree/f1ea20171bfb7a1741e8b695d02e0a9bb2855996)  
[🔽 Q8_0 · 1267 MB](https://huggingface.co/handy-computer/parakeet-tdt_ctc-1.1b-gguf/resolve/f1ea20171bfb7a1741e8b695d02e0a9bb2855996/parakeet-tdt_ctc-1.1b-Q8_0.gguf?download=true)  
[🔽 Q6_K · 1043 MB](https://huggingface.co/handy-computer/parakeet-tdt_ctc-1.1b-gguf/resolve/f1ea20171bfb7a1741e8b695d02e0a9bb2855996/parakeet-tdt_ctc-1.1b-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 936 MB](https://huggingface.co/handy-computer/parakeet-tdt_ctc-1.1b-gguf/resolve/f1ea20171bfb7a1741e8b695d02e0a9bb2855996/parakeet-tdt_ctc-1.1b-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 825 MB](https://huggingface.co/handy-computer/parakeet-tdt_ctc-1.1b-gguf/resolve/f1ea20171bfb7a1741e8b695d02e0a9bb2855996/parakeet-tdt_ctc-1.1b-Q4_K_M.gguf?download=true)  
[🔽 F16 · 2145 MB](https://huggingface.co/handy-computer/parakeet-tdt_ctc-1.1b-gguf/resolve/f1ea20171bfb7a1741e8b695d02e0a9bb2855996/parakeet-tdt_ctc-1.1b-F16.gguf?download=true)  
[🔽 F32 · 4282 MB](https://huggingface.co/handy-computer/parakeet-tdt_ctc-1.1b-gguf/resolve/f1ea20171bfb7a1741e8b695d02e0a9bb2855996/parakeet-tdt_ctc-1.1b-F32.gguf?download=true)

### Parakeet TDT 1.1B

Por Handy · 1.1B parámetros · Idiomas: en

[👉 Ver modelo](https://huggingface.co/handy-computer/parakeet-tdt-1.1b-gguf/tree/8c21810615694c53a4f4745996190fcca880f8e5)  
[🔽 Q8_0 · 1267 MB](https://huggingface.co/handy-computer/parakeet-tdt-1.1b-gguf/resolve/8c21810615694c53a4f4745996190fcca880f8e5/parakeet-tdt-1.1b-Q8_0.gguf?download=true)  
[🔽 Q6_K · 1043 MB](https://huggingface.co/handy-computer/parakeet-tdt-1.1b-gguf/resolve/8c21810615694c53a4f4745996190fcca880f8e5/parakeet-tdt-1.1b-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 936 MB](https://huggingface.co/handy-computer/parakeet-tdt-1.1b-gguf/resolve/8c21810615694c53a4f4745996190fcca880f8e5/parakeet-tdt-1.1b-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 825 MB](https://huggingface.co/handy-computer/parakeet-tdt-1.1b-gguf/resolve/8c21810615694c53a4f4745996190fcca880f8e5/parakeet-tdt-1.1b-Q4_K_M.gguf?download=true)  
[🔽 F16 · 2145 MB](https://huggingface.co/handy-computer/parakeet-tdt-1.1b-gguf/resolve/8c21810615694c53a4f4745996190fcca880f8e5/parakeet-tdt-1.1b-F16.gguf?download=true)  
[🔽 F32 · 4282 MB](https://huggingface.co/handy-computer/parakeet-tdt-1.1b-gguf/resolve/8c21810615694c53a4f4745996190fcca880f8e5/parakeet-tdt-1.1b-F32.gguf?download=true)

### Voxtral Small 24B

Por Handy · 24.3B parámetros · Idiomas: en, fr, de, es, it +3

[👉 Ver modelo](https://huggingface.co/handy-computer/Voxtral-Small-24B-2507-gguf/tree/3b85044238d7d73b0063c54ee6d0754b5f061795)  
[🔽 Q8_0 · 25810 MB](https://huggingface.co/handy-computer/Voxtral-Small-24B-2507-gguf/resolve/3b85044238d7d73b0063c54ee6d0754b5f061795/Voxtral-Small-24B-2507-Q8_0.gguf?download=true)  
[🔽 Q6_K · 19936 MB](https://huggingface.co/handy-computer/Voxtral-Small-24B-2507-gguf/resolve/3b85044238d7d73b0063c54ee6d0754b5f061795/Voxtral-Small-24B-2507-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 17139 MB](https://huggingface.co/handy-computer/Voxtral-Small-24B-2507-gguf/resolve/3b85044238d7d73b0063c54ee6d0754b5f061795/Voxtral-Small-24B-2507-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 14302 MB](https://huggingface.co/handy-computer/Voxtral-Small-24B-2507-gguf/resolve/3b85044238d7d73b0063c54ee6d0754b5f061795/Voxtral-Small-24B-2507-Q4_K_M.gguf?download=true)  
[🔽 F16 · 48548 MB](https://huggingface.co/handy-computer/Voxtral-Small-24B-2507-gguf/resolve/3b85044238d7d73b0063c54ee6d0754b5f061795/Voxtral-Small-24B-2507-F16.gguf?download=true)  
[🔽 BF16 · 48537 MB](https://huggingface.co/handy-computer/Voxtral-Small-24B-2507-gguf/resolve/3b85044238d7d73b0063c54ee6d0754b5f061795/Voxtral-Small-24B-2507-BF16.gguf?download=true)

### Whisper Base

Por Handy · 73M parámetros · Idiomas: af, am, ar, as, az +94

[👉 Ver modelo](https://huggingface.co/handy-computer/whisper-base-gguf/tree/e0f69524f648720eca44c024d1d0dbb7027d1fa0)  
[🔽 Q8_0 · 85 MB](https://huggingface.co/handy-computer/whisper-base-gguf/resolve/e0f69524f648720eca44c024d1d0dbb7027d1fa0/whisper-base-Q8_0.gguf?download=true)  
[🔽 Q6_K · 68 MB](https://huggingface.co/handy-computer/whisper-base-gguf/resolve/e0f69524f648720eca44c024d1d0dbb7027d1fa0/whisper-base-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 64 MB](https://huggingface.co/handy-computer/whisper-base-gguf/resolve/e0f69524f648720eca44c024d1d0dbb7027d1fa0/whisper-base-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 59 MB](https://huggingface.co/handy-computer/whisper-base-gguf/resolve/e0f69524f648720eca44c024d1d0dbb7027d1fa0/whisper-base-Q4_K_M.gguf?download=true)  
[🔽 F16 · 151 MB](https://huggingface.co/handy-computer/whisper-base-gguf/resolve/e0f69524f648720eca44c024d1d0dbb7027d1fa0/whisper-base-F16.gguf?download=true)  
[🔽 F32 · 292 MB](https://huggingface.co/handy-computer/whisper-base-gguf/resolve/e0f69524f648720eca44c024d1d0dbb7027d1fa0/whisper-base-F32.gguf?download=true)

### Whisper Base English

Por Handy · 73M parámetros · Idiomas: en

[👉 Ver modelo](https://huggingface.co/handy-computer/whisper-base.en-gguf/tree/cf0804db15fb341d00c9274b90da9cbb4fe2e5c6)  
[🔽 Q8_0 · 85 MB](https://huggingface.co/handy-computer/whisper-base.en-gguf/resolve/cf0804db15fb341d00c9274b90da9cbb4fe2e5c6/whisper-base.en-Q8_0.gguf?download=true)  
[🔽 Q6_K · 68 MB](https://huggingface.co/handy-computer/whisper-base.en-gguf/resolve/cf0804db15fb341d00c9274b90da9cbb4fe2e5c6/whisper-base.en-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 64 MB](https://huggingface.co/handy-computer/whisper-base.en-gguf/resolve/cf0804db15fb341d00c9274b90da9cbb4fe2e5c6/whisper-base.en-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 59 MB](https://huggingface.co/handy-computer/whisper-base.en-gguf/resolve/cf0804db15fb341d00c9274b90da9cbb4fe2e5c6/whisper-base.en-Q4_K_M.gguf?download=true)  
[🔽 F16 · 151 MB](https://huggingface.co/handy-computer/whisper-base.en-gguf/resolve/cf0804db15fb341d00c9274b90da9cbb4fe2e5c6/whisper-base.en-F16.gguf?download=true)  
[🔽 F32 · 292 MB](https://huggingface.co/handy-computer/whisper-base.en-gguf/resolve/cf0804db15fb341d00c9274b90da9cbb4fe2e5c6/whisper-base.en-F32.gguf?download=true)

### Whisper Large v1

Por Handy · 1.5B parámetros · Idiomas: af, am, ar, as, az +94

[👉 Ver modelo](https://huggingface.co/handy-computer/whisper-large-gguf/tree/1b99acc257d1a605153c9e4d818a065569a3fdcd)  
[🔽 Q8_0 · 1668 MB](https://huggingface.co/handy-computer/whisper-large-gguf/resolve/1b99acc257d1a605153c9e4d818a065569a3fdcd/whisper-large-Q8_0.gguf?download=true)  
[🔽 Q6_K · 1296 MB](https://huggingface.co/handy-computer/whisper-large-gguf/resolve/1b99acc257d1a605153c9e4d818a065569a3fdcd/whisper-large-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 1160 MB](https://huggingface.co/handy-computer/whisper-large-gguf/resolve/1b99acc257d1a605153c9e4d818a065569a3fdcd/whisper-large-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 997 MB](https://huggingface.co/handy-computer/whisper-large-gguf/resolve/1b99acc257d1a605153c9e4d818a065569a3fdcd/whisper-large-Q4_K_M.gguf?download=true)  
[🔽 F16 · 3106 MB](https://huggingface.co/handy-computer/whisper-large-gguf/resolve/1b99acc257d1a605153c9e4d818a065569a3fdcd/whisper-large-F16.gguf?download=true)  
[🔽 F32 · 6175 MB](https://huggingface.co/handy-computer/whisper-large-gguf/resolve/1b99acc257d1a605153c9e4d818a065569a3fdcd/whisper-large-F32.gguf?download=true)

### Whisper Large v2

Por Handy · 1.5B parámetros · Idiomas: af, am, ar, as, az +94

[👉 Ver modelo](https://huggingface.co/handy-computer/whisper-large-v2-gguf/tree/b64d145562182428ef04ca992b182aec8c61e578)  
[🔽 Q8_0 · 1668 MB](https://huggingface.co/handy-computer/whisper-large-v2-gguf/resolve/b64d145562182428ef04ca992b182aec8c61e578/whisper-large-v2-Q8_0.gguf?download=true)  
[🔽 Q6_K · 1296 MB](https://huggingface.co/handy-computer/whisper-large-v2-gguf/resolve/b64d145562182428ef04ca992b182aec8c61e578/whisper-large-v2-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 1160 MB](https://huggingface.co/handy-computer/whisper-large-v2-gguf/resolve/b64d145562182428ef04ca992b182aec8c61e578/whisper-large-v2-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 997 MB](https://huggingface.co/handy-computer/whisper-large-v2-gguf/resolve/b64d145562182428ef04ca992b182aec8c61e578/whisper-large-v2-Q4_K_M.gguf?download=true)  
[🔽 F16 · 3106 MB](https://huggingface.co/handy-computer/whisper-large-v2-gguf/resolve/b64d145562182428ef04ca992b182aec8c61e578/whisper-large-v2-F16.gguf?download=true)  
[🔽 F32 · 6175 MB](https://huggingface.co/handy-computer/whisper-large-v2-gguf/resolve/b64d145562182428ef04ca992b182aec8c61e578/whisper-large-v2-F32.gguf?download=true)

### Whisper Medium English

Por Handy · 764M parámetros · Idiomas: en

[👉 Ver modelo](https://huggingface.co/handy-computer/whisper-medium.en-gguf/tree/f25c70d9095dcfdad187ebb3b113d157b414aee8)  
[🔽 Q8_0 · 831 MB](https://huggingface.co/handy-computer/whisper-medium.en-gguf/resolve/f25c70d9095dcfdad187ebb3b113d157b414aee8/whisper-medium.en-Q8_0.gguf?download=true)  
[🔽 Q6_K · 648 MB](https://huggingface.co/handy-computer/whisper-medium.en-gguf/resolve/f25c70d9095dcfdad187ebb3b113d157b414aee8/whisper-medium.en-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 583 MB](https://huggingface.co/handy-computer/whisper-medium.en-gguf/resolve/f25c70d9095dcfdad187ebb3b113d157b414aee8/whisper-medium.en-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 504 MB](https://huggingface.co/handy-computer/whisper-medium.en-gguf/resolve/f25c70d9095dcfdad187ebb3b113d157b414aee8/whisper-medium.en-Q4_K_M.gguf?download=true)  
[🔽 F16 · 1542 MB](https://huggingface.co/handy-computer/whisper-medium.en-gguf/resolve/f25c70d9095dcfdad187ebb3b113d157b414aee8/whisper-medium.en-F16.gguf?download=true)  
[🔽 F32 · 3057 MB](https://huggingface.co/handy-computer/whisper-medium.en-gguf/resolve/f25c70d9095dcfdad187ebb3b113d157b414aee8/whisper-medium.en-F32.gguf?download=true)

### Whisper Small English

Por Handy · 242M parámetros · Idiomas: en

[👉 Ver modelo](https://huggingface.co/handy-computer/whisper-small.en-gguf/tree/41b0f75fd44415ba127a5356c5ba9ed450c1debd)  
[🔽 Q8_0 · 270 MB](https://huggingface.co/handy-computer/whisper-small.en-gguf/resolve/41b0f75fd44415ba127a5356c5ba9ed450c1debd/whisper-small.en-Q8_0.gguf?download=true)  
[🔽 Q6_K · 212 MB](https://huggingface.co/handy-computer/whisper-small.en-gguf/resolve/41b0f75fd44415ba127a5356c5ba9ed450c1debd/whisper-small.en-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 194 MB](https://huggingface.co/handy-computer/whisper-small.en-gguf/resolve/41b0f75fd44415ba127a5356c5ba9ed450c1debd/whisper-small.en-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 172 MB](https://huggingface.co/handy-computer/whisper-small.en-gguf/resolve/41b0f75fd44415ba127a5356c5ba9ed450c1debd/whisper-small.en-Q4_K_M.gguf?download=true)  
[🔽 F16 · 493 MB](https://huggingface.co/handy-computer/whisper-small.en-gguf/resolve/41b0f75fd44415ba127a5356c5ba9ed450c1debd/whisper-small.en-F16.gguf?download=true)  
[🔽 F32 · 969 MB](https://huggingface.co/handy-computer/whisper-small.en-gguf/resolve/41b0f75fd44415ba127a5356c5ba9ed450c1debd/whisper-small.en-F32.gguf?download=true)

### Whisper Tiny

Por Handy · 38M parámetros · Idiomas: af, am, ar, as, az +94

[👉 Ver modelo](https://huggingface.co/handy-computer/whisper-tiny-gguf/tree/6687f30c99641ee265df421e582354adbc8848fc)  
[🔽 Q8_0 · 46 MB](https://huggingface.co/handy-computer/whisper-tiny-gguf/resolve/6687f30c99641ee265df421e582354adbc8848fc/whisper-tiny-Q8_0.gguf?download=true)  
[🔽 Q6_K · 45 MB](https://huggingface.co/handy-computer/whisper-tiny-gguf/resolve/6687f30c99641ee265df421e582354adbc8848fc/whisper-tiny-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 44 MB](https://huggingface.co/handy-computer/whisper-tiny-gguf/resolve/6687f30c99641ee265df421e582354adbc8848fc/whisper-tiny-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 44 MB](https://huggingface.co/handy-computer/whisper-tiny-gguf/resolve/6687f30c99641ee265df421e582354adbc8848fc/whisper-tiny-Q4_K_M.gguf?download=true)  
[🔽 F16 · 80 MB](https://huggingface.co/handy-computer/whisper-tiny-gguf/resolve/6687f30c99641ee265df421e582354adbc8848fc/whisper-tiny-F16.gguf?download=true)  
[🔽 F32 · 153 MB](https://huggingface.co/handy-computer/whisper-tiny-gguf/resolve/6687f30c99641ee265df421e582354adbc8848fc/whisper-tiny-F32.gguf?download=true)

### Whisper Tiny English

Por Handy · 38M parámetros · Idiomas: en

[👉 Ver modelo](https://huggingface.co/handy-computer/whisper-tiny.en-gguf/tree/becb8bcb804405dc97b380a523d9975888820986)  
[🔽 Q8_0 · 46 MB](https://huggingface.co/handy-computer/whisper-tiny.en-gguf/resolve/becb8bcb804405dc97b380a523d9975888820986/whisper-tiny.en-Q8_0.gguf?download=true)  
[🔽 Q6_K · 45 MB](https://huggingface.co/handy-computer/whisper-tiny.en-gguf/resolve/becb8bcb804405dc97b380a523d9975888820986/whisper-tiny.en-Q6_K.gguf?download=true)  
[🔽 Q5_K_M · 44 MB](https://huggingface.co/handy-computer/whisper-tiny.en-gguf/resolve/becb8bcb804405dc97b380a523d9975888820986/whisper-tiny.en-Q5_K_M.gguf?download=true)  
[🔽 Q4_K_M · 44 MB](https://huggingface.co/handy-computer/whisper-tiny.en-gguf/resolve/becb8bcb804405dc97b380a523d9975888820986/whisper-tiny.en-Q4_K_M.gguf?download=true)  
[🔽 F16 · 80 MB](https://huggingface.co/handy-computer/whisper-tiny.en-gguf/resolve/becb8bcb804405dc97b380a523d9975888820986/whisper-tiny.en-F16.gguf?download=true)  
[🔽 F32 · 153 MB](https://huggingface.co/handy-computer/whisper-tiny.en-gguf/resolve/becb8bcb804405dc97b380a523d9975888820986/whisper-tiny.en-F32.gguf?download=true)

### Parakeet TDT 0.6B v3 (compilación de Vibe)

Por Vibe · 627M parámetros · Idiomas: bg, hr, cs, da, nl +20

[👉 Ver modelo](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/tree/cd084b1be9cc53eea3330a30d3c9e3e4afbe039c)  
[🔽 Q4_K_M · 485 MB](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/resolve/cd084b1be9cc53eea3330a30d3c9e3e4afbe039c/parakeet-tdt-0.6b-v3-Q4_K_M.gguf?download=true)

### Nemotron 3.5 ASR Streaming 0.6B (compilación de Vibe)

Por Vibe · 638M parámetros · Idiomas: en-US, en-GB, es-US, es-ES, fr-FR +27  
Admite streaming.

[👉 Ver modelo](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf/tree/2e85c0261bb7d0ae27e38c63ffec82c1012b6485)  
[🔽 Q4_K_M · 496 MB](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf/resolve/2e85c0261bb7d0ae27e38c63ffec82c1012b6485/nemotron-3.5-asr-streaming-0.6b-Q4_K_M.gguf?download=true)

### Parakeet TDT 0.6B v3 Hebrew

Por Vibe · 627M parámetros · Idiomas: he

[👉 Ver modelo](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-he-gguf/tree/740e0ca8957f142803b4a2d534d47eb1b4f75c9d)  
[🔽 Q8_0 · 758 MB](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-he-gguf/resolve/740e0ca8957f142803b4a2d534d47eb1b4f75c9d/parakeet-tdt-0.6b-v3-he-q8_0.gguf?download=true)

### Antiguos (solo referencia)

Estos contenedores whisper.cpp anteriores a GGUF se conservan solo como referencia: el motor unificado solo carga GGUF.

### Whisper Tiny (.bin antiguo)

Por whisper.cpp · 39M parámetros · Idiomas: en

[👉 Ver modelo](https://huggingface.co/ggerganov/whisper.cpp/tree/5359861c739e955e79d9a303bcbc70fb988958b1)  
[🔽 F16 · 78 MB](https://huggingface.co/ggerganov/whisper.cpp/resolve/5359861c739e955e79d9a303bcbc70fb988958b1/ggml-tiny.bin?download=true)

### Whisper Large v3 Turbo (.bin antiguo)

Por whisper.cpp · 809M parámetros · Idiomas: af, am, ar, az, ba +93

[👉 Ver modelo](https://huggingface.co/ggerganov/whisper.cpp/tree/5359861c739e955e79d9a303bcbc70fb988958b1)  
[🔽 F16 · 1625 MB](https://huggingface.co/ggerganov/whisper.cpp/resolve/5359861c739e955e79d9a303bcbc70fb988958b1/ggml-large-v3-turbo.bin?download=true)

### Whisper Large v3 Turbo, Ivrit AI (.bin antiguo)

Por Ivrit AI · 809M parámetros · Idiomas: he, en

[👉 Ver modelo](https://huggingface.co/ivrit-ai/whisper-large-v3-turbo-ggml/tree/2130c78e4a9cb4914cc4df91a1c3031407789705)  
[🔽 F16 · 1625 MB](https://huggingface.co/ivrit-ai/whisper-large-v3-turbo-ggml/resolve/2130c78e4a9cb4914cc4df91a1c3031407789705/ggml-model.bin?download=true)

¡Disfruta explorando estos modelos y mejorando tu Vibe! 🌐✨

### ¿Quieres más?

Encuentra modelos adicionales aquí:

[👉 Ver más modelos](https://huggingface.co/handy-computer) — todas las familias GGUF que ejecuta el motor incluido

---

### Prepara tus propios modelos

<details>
<summary>Convertir transformers a GGML</summary>

```console
# Configurar entorno
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc
uv venv
uv pip install torch transformers huggingface_hub
huggingface-cli login --token "token" # https://huggingface.co/settings/tokens

# Convertir y subir
git clone https://github.com/openai/whisper
git clone https://github.com/ggml-org/whisper.cpp
git clone https://huggingface.co/ivrit-ai/whisper-large-v3-turbo
uv run ./whisper.cpp/models/convert-h5-to-ggml.py ./whisper-large-v3-turbo/ ./whisper .
uv run huggingface-cli upload --repo-type model whisper-large-v3-turbo-ivrit ./ggml-model.bin ./ggml-model.bin

# Cuantizar
sudo apt install cmake build-essential -y
cd whisper.cpp
cmake -B build
cmake --build build --config Release
cd ..
./whisper.cpp/build/bin/quantize ggml-model.bin ./ggml-model.int8.bin q8_0 # fp32/fp16/q8_0/q5_0
```

</details>
