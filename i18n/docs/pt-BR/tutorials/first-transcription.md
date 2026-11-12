<!-- source: a0b0bbb0302c -->

# Transcreva sua primeira gravação

Este tutorial transcreve um arquivo de mídia com o modelo padrão. Ele pressupõe que o Vibe está instalado e que o modelo padrão foi baixado; [Instalar o Vibe](/vibe/docs#install) cobre isso.

## Adicionar um arquivo

1. Abra o Vibe.
1. Solte um arquivo de áudio ou vídeo na área de soltar, ou escolha **Arquivo** e selecione um.
1. Espere o arquivo aparecer na fila.

O Vibe aceita os formatos em [Formatos compatíveis](/vibe/docs#formats). Ele normaliza a mídia com ffmpeg antes da transcrição, então um contêiner incomum ainda pode funcionar.

## Iniciar a transcrição

1. Deixe o idioma na opção automática, ou escolha um idioma quando a detecção errar.
1. Pressione **Transcrever**.
1. Acompanhe a prévia ao vivo. **Cancelar** interrompe a execução sem excluir a gravação.

O app desktop inicia o `vibe-server` em segundo plano e envia o áudio por HTTP local. O servidor carrega o modelo selecionado, transcreve e retorna segmentos com marcações de tempo.

## Ler o resultado

A transcrição abre quando a execução termina. Cada linha pode ser editada no próprio local, e a alteração é salva com o projeto.

Para rotular falantes, ative **Detectar alto-falantes** em **Mais opções** antes da execução. A diarização usa o modelo Nemotron-3 e rotula até 8 falantes.

## Exportar

Abra o diálogo de exportação e escolha um formato: TXT, Markdown, SRT, VTT, HTML, JSON, CSV, DOCX ou PDF. [Formatos compatíveis](/vibe/docs#formats) explica o que cada um carrega.

## Próximos passos

- [Grave o microfone e o áudio do sistema](/vibe/docs#record-audio) quando o áudio for uma chamada ao vivo em vez de um arquivo.
- [Modelos](/vibe/docs#models) quando você precisar de outro idioma, velocidade ou precisão.
- [Linha de comando](/vibe/docs#cli) para executar o mesmo motor sem a janela.
