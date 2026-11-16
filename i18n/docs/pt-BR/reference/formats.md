<!-- source: e0f14454bcc5 -->

# Formatos compatíveis

O Vibe aceita arquivos de áudio e vídeo e exporta transcrições em vários formatos de texto. O app desktop normaliza a mídia com ffmpeg antes da transcrição; no Linux, o `ffmpeg` do sistema é necessário, enquanto os pacotes de macOS e Windows trazem o seu próprio.

## Entrada

| Tipo | Extensões |
| --- | --- |
| Áudio | `mp3`, `wav`, `aac`, `flac`, `oga`, `ogg`, `opus`, `m4a`, `m4b`, `wma` |
| Vídeo | `mp4`, `mkv`, `avi`, `mov`, `wmv`, `webm`, `mxf` |

Um contêiner fora desta lista ainda pode funcionar se o ffmpeg conseguir decodificá-lo; converta-o primeiro se o app recusar.

## Exportação do desktop

Abra o diálogo de exportação em uma transcrição e escolha um destes:

| Formato | Conteúdo |
| --- | --- |
| TXT | Texto simples sem formatação |
| Markdown | Títulos e texto formatado |
| SRT | Legendas numeradas com marcações de tempo |
| VTT | Legendas WebVTT com marcações de tempo |
| HTML | Uma página web estilizada |
| JSON | Dados estruturados de transcrição e tempo |
| CSV | Linhas prontas para planilhas |
| DOCX | Um documento do Word formatado |
| PDF | Um documento pronto para impressão |

As opções de exportação também alternam marcações de tempo e rótulos de falante onde o formato suporta. A exportação automática pode gravar qualquer um desses formatos ao lado da gravação, na pasta de projetos ou em uma pasta escolhida por você.

## Saída da CLI

`vibe-server transcribe` grava `txt` (padrão), `markdown` (alias `md`), `json`, `srt` ou `vtt`. `--output` grava um novo arquivo e se recusa a sobrescrever um caminho existente. Veja [Linha de comando](/vibe/docs#cli).

## Páginas relacionadas

- [Modelos](/vibe/docs#models) para as famílias de modelos e seus limites.
- [Transcreva sua primeira gravação](/vibe/docs#first-transcription) para o fluxo do desktop.
