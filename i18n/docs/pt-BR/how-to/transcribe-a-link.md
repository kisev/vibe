<!-- source: b806d3524bf0 -->

# Transcrever a partir de um link

O Vibe baixa o áudio por trás de uma URL de mídia com o yt-dlp e transcreve o resultado. Os sites compatíveis são os que o yt-dlp suporta; quando um site para de funcionar, um yt-dlp atualizado costuma corrigir.

## Enviar o link

1. Abra o Vibe e escolha **Do link**.
1. Cole uma URL, ou cole várias separadas por espaços em branco para colocá-las na fila.
1. Pressione **Transcrever**.

O Vibe pede para instalar o yt-dlp na primeira vez que um link é usado e para atualizá-lo quando um site falha. O áudio baixado é temporário; a transcrição é salva como qualquer outro projeto.

## O que esperar

- Um único link começa assim que o download termina.
- Uma fila executa um link por vez e mostra o progresso por item.
- Pesos, modelos e a transcrição ficam locais. O download em si contata o host de mídia e o GitHub para o yt-dlp.

## Próximos passos

- [Formatos compatíveis](/vibe/docs#formats) para arquivos locais e opções de exportação.
- [Modelos](/vibe/docs#models) quando o áudio precisar de outro idioma ou precisão.
