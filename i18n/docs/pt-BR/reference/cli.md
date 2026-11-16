<!-- source: 82b1f22a4618 -->

# Linha de comando

O executável `vibe` é o app desktop. Quando recebe qualquer argumento exceto `--hidden`, ele repassa os argumentos ao `vibe-server` incluído e imprime a saída desse processo, então a CLI e a janela usam o mesmo motor e os mesmos modelos.

O binário do servidor é `vibe-server`; um checkout de desenvolvimento pode chamá-lo diretamente. `--help` em qualquer um dos pontos de entrada imprime as flags atuais.

## Subcomandos

| Comando | Finalidade |
| --- | --- |
| `transcribe <model> <audio>` | Transcreve um arquivo e imprime ou grava o resultado |
| `serve [model]` | Inicia o servidor HTTP local, com documentação Swagger |
| `pull <url>` | Baixa um modelo ou outro arquivo |
| `devices` | Lista dispositivos de GPU como JSON |

## Opções de transcribe

| Opção | Efeito |
| --- | --- |
| `--format <txt\|markdown\|md\|json\|srt\|vtt>` | Formato de saída; padrão `txt` |
| `--output <path>` | Grava em um novo arquivo; recusa sobrescrever |
| `-l`, `--language <code>` | Código do idioma |
| `--detect-language` | Detecta o idioma |
| `--translate` | Traduz para o inglês onde o modelo suporta |
| `--vad-model <path>` | Modelo Silero VAD, exigido por algumas famílias para áudio longo |
| `--diarize-model <path>` | Modelo de diarização de falantes |
| `--prompt <text>` | Prompt inicial, para modelos que usam um |
| `--word-timestamps` | Emite marcações de tempo por palavra onde suportado |
| `--threads <n>` | Threads de CPU |
| `--gpu-device <n>` | Índice do dispositivo GPU, começando em 1; `0` ou negativo significa automático |
| `--cache-dir <dir>` | Mantém trechos concluídos para que uma execução interrompida retome |
| `--chunk-seconds <n>` | Comprimento planejado do trecho, limitado pela janela do modelo |

`--enhance-audio`, `--temperature`, `--max-text-ctx`, `--max-segment-len`, `--best-of` e `--beam-size` ajustam o motor; execute `--help` para ver os padrões.

## Opções de serve

| Opção | Efeito |
| --- | --- |
| `--host <ip>` | Endereço de bind; padrão `127.0.0.1` |
| `-p`, `--port <port>` | Porta; `0` escolhe uma livre |
| `--exit-with-parent` | Encerra com o processo pai |
| `--unload-timeout <value>` | Descarrega um modelo ocioso |
| `--cache-dir <dir>` | Diretório de cache de trechos |

**Configurações → Agentes** inicia o mesmo servidor pelo app e aponta para sua documentação Swagger.

## Exemplos

```console
vibe transcribe model.gguf recording.wav --format srt --output recording.srt
vibe transcribe model.gguf recording.wav --language ru --vad-model ggml-silero-v6.2.0.bin
vibe devices
vibe serve --port 0
```

## Páginas relacionadas

- [Modelos](/vibe/docs#models) para escolhas de modelo e limites por família.
- [Formatos compatíveis](/vibe/docs#formats) para extensões de entrada e formatos de exportação.
