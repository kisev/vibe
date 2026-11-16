<!-- source: 03e5a04c40fd -->

# Instalar o Vibe

Este tutorial leva uma máquina nova de um download a uma janela do Vibe em execução. Ele pressupõe um desktop com conexão à internet e sem instalação existente. [Transcreva sua primeira gravação](/vibe/docs#first-transcription) é o próximo passo.

## Baixar o instalador

Abra a [página de download](https://kisev.github.io/vibe/) e escolha a build para esta máquina:

| Plataforma | Build |
| --- | --- |
| Windows | instalador `.exe` |
| macOS, Apple silicon | `aarch64.dmg` |
| macOS, Intel | `x64.dmg` |
| Linux | `.deb` ou `.rpm`, x86-64 ou arm64 |

Os mesmos arquivos são anexados a cada [lançamento do GitHub](https://github.com/kisev/vibe/releases). O `.deb` do Linux declara suas dependências de execução, incluindo `ffmpeg`.

## Instalar e abrir

1. Execute o instalador e siga as instruções.
1. Abra o Vibe pelo menu de aplicativos ou execute `vibe` em um terminal.

As builds de lançamento não são assinadas. No macOS, a primeira execução exige um clique com o botão direito → **Abrir** no Finder para passar pelo Gatekeeper; as execuções seguintes abrem normalmente. O SmartScreen do Windows pode mostrar um aviso pelo mesmo motivo.

## Concluir a configuração

Na primeira execução, o Vibe oferece o modelo padrão. Aceite o download e espere terminar. O modelo é armazenado localmente e reutilizado em todas as execuções seguintes; [Modelos](/vibe/docs#models) lista as alternativas.

A janela está pronta quando a área de soltar e as ações **Gravar** e **Do link** estão visíveis.

## Próximos passos

- [Transcreva sua primeira gravação](/vibe/docs#first-transcription) usa esta instalação.
- [Formatos compatíveis](/vibe/docs#formats) lista o que o Vibe pode abrir e exportar.
- [Solução de problemas de uma falha](https://github.com/kisev/vibe/blob/main/docs/how-to/troubleshoot-a-crash.md) cobre registros e diagnósticos se a janela não abrir.
