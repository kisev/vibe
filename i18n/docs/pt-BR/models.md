<!-- source: 2b80fd9e5daa -->

# 🌟 Modelos do Vibe 🌟

Bem-vindo à página de Modelos do Vibe! Aqui você encontra uma lista selecionada de modelos sugeridos para usar com o Vibe. Para instalar um modelo, use o link "Configuração Mágica" para abri-lo no Vibe, ou copie e cole o link de download direto nas configurações do Vibe.

## Gravações longas

Uma gravação mais longa que a janela de entrada de um modelo é dividida em blocos antes da inferência. Com o reconhecimento de falantes ativado, a divisão segue os turnos detectados, então um bloco nunca mistura dois falantes, exceto onde os turnos deles se encontram — essas linhas mostram os dois falantes com um "?" e podem ser atribuídas a um deles. O GigaAM (25 s), o Parakeet (30 s) e o Nemotron (30 s) dividem dessa forma; o Whisper mantém seu próprio tratamento de formato longo.

Os blocos concluídos ficam no seu computador, então executar novamente um arquivo longo com as mesmas configurações retoma de onde parou. O cache guarda o texto da transcrição, o plano de blocos e um carimbo do modelo — nunca o áudio — e nunca sai do seu dispositivo. O aplicativo exclui entradas sem alterações há 30 dias quando é iniciado. Na linha de comando, ative com `--cache-dir <folder>` e exclua essa pasta para limpar; `--chunk-seconds <n>` define o comprimento planejado e não pode exceder a janela do modelo.

## Modelos disponíveis

### 🌱 Modelo Tiny

Uma versão compacta e eficiente, adequada para tarefas rápidas e ambientes com recursos limitados.

[👉 Configuração Mágica](https://shorturl.at/XSP9R)  
[🔽 Download Direto](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin?download=true)

### 🚀 Large v3 Turbo (Recomendado)

[👉 Configuração Mágica](https://tinyurl.com/yphwban5)  
[🔽 Download Direto](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin)

### 🦜 Parakeet TDT 0.6B v3

Suporta streaming e é o mais indicado para ditado.

[👉 Ver Modelo](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/tree/main)  
[🔽 Baixar Q4_K_M](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/resolve/main/parakeet-tdt-0.6b-v3-Q4_K_M.gguf?download=true)

### ⚡ Nemotron 3.5 ASR Streaming 0.6B

Suporta streaming e é o mais indicado para ditado.

[👉 Ver Modelo](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf)  
[🔽 Baixar Q4_K_M](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf/resolve/main/nemotron-3.5-asr-streaming-0.6b-Q4_K_M.gguf?download=true)

### 🇷🇺 GigaAM v3 (Russo)

Reconhecimento de fala em russo com maiúsculas e pontuação, por Salute Developers. Mais indicado para ditado em russo.

[👉 Ver Modelo](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf)  
[🔽 Baixar Q8_0](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf/resolve/main/gigaam-v3-e2e-rnnt-Q8_0.gguf?download=true)

<details>
<summary>Limitações do GigaAM e exemplos de linha de comando</summary>

**Limitações**

- Somente russo. Não há detecção automática de idioma: `--language ru` e `--language auto` selecionam russo, e qualquer outro idioma falha com `unsupported_language`.
- Não é streaming. A janela do modelo é de 25 segundos, e o [modelo Silero VAD](https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-silero-v6.2.0.bin) é necessário para dividir gravações mais longas.
- Sem tradução e sem prompt de texto.
- Marcações de tempo estáveis não são suportadas, e solicitações de carimbos de data e hora por palavra são ignoradas. Cada segmento carrega carimbos de data e hora por token com resolução de 40 ms.
- A diarização de falantes funciona normalmente.
- Quatro variantes são publicadas em `handy-computer`: [`gigaam-v3-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-rnnt-gguf), [`gigaam-v3-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-ctc-gguf), [`gigaam-v3-e2e-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf) e [`gigaam-v3-e2e-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-ctc-gguf). As variantes `e2e` adicionam maiúsculas e pontuação; as outras retornam texto em minúsculas e sem pontuação.

**Linha de comando**

Baixe o modelo VAD acima e passe-o com `--vad-model`:

```console
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format markdown --output transcript.md
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format json
```

`--format` aceita `txt` (padrão), `markdown` (alias `md`), `json`, `srt` e `vtt`. `--output` grava a transcrição em um arquivo e se recusa a sobrescrever um existente. Adicione `--diarize-model <diar.gguf>` para rotular falantes na saída Markdown e JSON.

</details>

### Modelos otimizados para outros idiomas

<details>
<summary>✡️ Hebraico (Ivrit)</summary>

Especializado em dados do idioma hebraico (Ivrit), otimizado para alta velocidade e precisão em tarefas em hebraico.

[👉 Configuração Mágica (Large v3 Turbo)](https://tinyurl.com/t9r3tyxk)  
[🔽 Download Direto (Large v3 Turbo)](https://huggingface.co/ivrit-ai/whisper-large-v3-turbo-ggml/resolve/main/ggml-model.bin?download=true)

</details>

<details>
<summary>🇳🇴 Norueguês</summary>
	
Otimizado para o norueguês pelo [AI Lab da Biblioteca Nacional da Noruega](https://huggingface.co/NbAiLab).

[👉 Configuração Mágica (medium)](https://tinyurl.com/5wzb9ux8)  
[🔽 Download Direto (medium)](https://huggingface.co/NbAiLab/nb-whisper-medium/blob/main/ggml-model.bin?download=true)

[👉 Configuração Mágica (large)](https://tinyurl.com/f228efbu)  
[🔽 Download Direto (large)](https://huggingface.co/NbAiLab/nb-whisper-large/blob/main/ggml-model.bin?download=true)

Mais modelos de tamanhos menores estão disponíveis na [página de downloads deles no huggingface](https://huggingface.co/NbAiLab/nb-whisper-large).  
Encontre o tamanho desejado, baixe o arquivo _ggml-model.bin_, renomeie o arquivo e coloque-o na pasta de modelos do vibe.

</details>

<details>
<summary>🇸🇪 Sueco</summary>

Otimizado para o sueco pelo [Data Lab da Biblioteca Nacional da Suécia](https://huggingface.co/KBLab).

[👉 Configuração Mágica (medium)](https://tinyurl.com/ynawnc33)  
[🔽 Download Direto (medium)](https://huggingface.co/KBLab/kb-whisper-medium/blob/main/ggml-model.bin?download=true)

[👉 Configuração Mágica (large v3)](https://tinyurl.com/46dvpeky)  
[🔽 Download Direto (large v3)](https://huggingface.co/KBLab/kb-whisper-large/blob/main/ggml-model.bin?download=true)

Mais modelos de tamanhos menores estão disponíveis na [página de downloads deles no huggingface](https://huggingface.co/KBLab/kb-whisper-large).  
Encontre o tamanho desejado, baixe o arquivo _ggml-model.bin_, renomeie o arquivo e coloque-o na pasta de modelos do vibe.

</details>
</details>

Aproveite para explorar esses modelos e aprimorar seu Vibe! 🌐✨

### Quer mais?

Encontre modelos adicionais aqui:

[👉 Ver Mais Modelos](https://huggingface.co/ggerganov/whisper.cpp/tree/main)

---

### Prepare seus próprios modelos

<details>
<summary>Converter transformers para GGML</summary>

```console
# Configurar ambiente
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc
uv venv
uv pip install torch transformers huggingface_hub
huggingface-cli login --token "token" # https://huggingface.co/settings/tokens

# Converter e enviar
git clone https://github.com/openai/whisper
git clone https://github.com/ggml-org/whisper.cpp
git clone https://huggingface.co/ivrit-ai/whisper-large-v3-turbo
uv run ./whisper.cpp/models/convert-h5-to-ggml.py ./whisper-large-v3-turbo/ ./whisper .
uv run huggingface-cli upload --repo-type model whisper-large-v3-turbo-ivrit ./ggml-model.bin ./ggml-model.bin

# Quantizar
sudo apt install cmake build-essential -y
cd whisper.cpp
cmake -B build
cmake --build build --config Release
cd ..
./whisper.cpp/build/bin/quantize ggml-model.bin ./ggml-model.int8.bin q8_0 # fp32/fp16/q8_0/q5_0
```

</details>
