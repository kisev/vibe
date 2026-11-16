<!-- source: 648b5aad742b -->

# Grave o microfone e o áudio do sistema

O Vibe grava dos dispositivos escolhidos e depois transcreve a gravação. Use este guia para chamadas, reuniões e áudio que está tocando em vez de salvo em arquivo. [Formatos compatíveis](/vibe/docs#formats) cobre arquivos.

## Escolher os dispositivos

1. Abra o Vibe e escolha **Gravar**.
1. Em **Microfone**, escolha o dispositivo de entrada. O Vibe memoriza o dispositivo pelo nome.
1. Em **Caixas de som**, escolha o dispositivo de saída para capturar o áudio do sistema. Escolha **Nenhum** para gravar apenas o microfone.

Gravar os dois dispositivos os mescla em uma faixa com ffmpeg, então os dois lados de uma chamada caem na mesma transcrição.

## Conceder permissões no macOS

Abra **Configurações → Gravação → Permissões** e conceda o que a gravação precisa:

| Permissão | Usada para |
| --- | --- |
| Microfone | Áudio do microfone |
| Áudio do sistema | Áudio reproduzido no Mac (Gravação de tela e áudio do sistema) |

Sem permissão de áudio do sistema, o macOS abre o stream de loopback mas grava silêncio, então a gravação não é utilizável.

## Gravar e transcrever

1. Pressione **Gravar**.
1. Use **Parar** quando a chamada terminar.
1. A gravação abre com um seletor de idioma. Escolha um idioma ou deixe em automático.
1. Pressione **Transcrever**.

Se **Transcrever gravações automaticamente** estiver ativado em **Configurações → Gravação**, a última etapa começa sozinha.

## Próximos passos

- [Resuma uma transcrição](/vibe/docs#summarize-transcripts) depois que a gravação terminar.
- [Use o navegador de reuniões](/vibe/docs#use-the-meeting-browser) para gravar uma chamada dentro do Vibe.
