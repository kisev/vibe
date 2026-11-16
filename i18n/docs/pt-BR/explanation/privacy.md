<!-- source: 2459ffcb4329 -->

# Privacidade e design offline

O Vibe foi construído para que o caminho normal de transcrição não precise de conta nem de serviço de nuvem. O app inicia um servidor local, o servidor carrega um modelo do disco, e o áudio é decodificado e transcrito na mesma máquina.

## O que fica local

- Arquivos de áudio, gravações, exportações e transcrições.
- Os modelos e os binários do ffmpeg.
- O histórico de projetos na pasta de projetos.
- A API HTTP local entre o app desktop e o `vibe-server`, vinculada ao loopback.

O app não envia telemetria. **Relatar problema** monta uma issue preenchida a partir de diagnósticos locais e abre o GitHub; nada é enviado até você revisar e enviar.

## Onde a rede é usada

| Recurso | Contato de rede |
| --- | --- |
| Download de modelo | O host que serve o arquivo do modelo |
| Transcrição a partir de um link | O host de mídia e o GitHub para o binário do yt-dlp |
| Verificação de atualização | O arquivo de canal do site |
| Resumo de IA com Claude ou OpenAI | O provedor configurado |
| Resumo de IA com Ollama | A URL do Ollama, local por padrão |
| Gravação pelo celular | Um servidor de retransmissão com criptografia de ponta a ponta entre o celular e este computador |

O próprio motor de transcrição não tem caminho de rede.

## Gravação pelo celular

O celular e o desktop se conectam via iroh. O servidor de retransmissão transporta tráfego criptografado de ponta a ponta, então ele encaminha bytes que não consegue ler; a transcrição ainda acontece neste computador, e o Vibe precisa continuar aberto para a gravação funcionar.

## Compromissos

- Modelos locais custam espaço em disco e usam a CPU ou a GPU da máquina. [Motor e escolhas de GPU](/vibe/docs#engine) explica a divisão.
- Um resumo na nuvem envia o texto da transcrição ao provedor escolhido. Deixe a plataforma em Ollama para mantê-lo local.
- As atualizações são verificadas a partir de arquivos estáticos no site, o que revela que o app verificou um canal, não o que ele transcreveu.

## Páginas relacionadas

- [Configurações e arquivo de configuração](/vibe/docs#settings) para o arquivo de configuração local.
- [Transcrever a partir do celular](/vibe/docs#transcribe-from-a-phone) para as etapas de gravação pelo celular.
- [Resumir uma transcrição](/vibe/docs#summarize-transcripts) para as plataformas de IA.
