<!-- source: fa863fbcee4b -->

# Usar o navegador de reuniões

O Vibe pode hospedar uma chamada na própria janela com uma barra sempre visível cuja ação principal é **Gravar esta chamada**. A janela usa o webview da plataforma; [Por que o navegador de reuniões funciona assim](/vibe/docs#meeting-browser) cobre o isolamento e os limites.

## Abrir uma chamada no Vibe

Use um destes caminhos:

- Abra **Configurações → Gravação → Abrir no Vibe**, cole o link e abra-o.
- De outro app, script ou atalho, chame `vibe://open/?url=https://…`. O Vibe aceita apenas URLs https bem formadas e recusa qualquer outra coisa com um diálogo.
- Ative **Abrir links de reunião no Vibe** em **Configurações → Gravação** para registrar links do Zoom, Teams e Webex. Isso está disponível no Windows e no Linux, não no macOS.

Clicar em um link https no Chrome, Edge ou Firefox ainda abre esse navegador. O Vibe não se registra como navegador padrão.

## Obter a barra de gravação

**Configurações → Gravação → Hosts de reunião** lista os hosts que recebem a barra de reunião. Os padrões são `telemost.yandex.ru` e `stream.wb.ru`.

- Adicione um host para transformar seus links em sessões graváveis.
- Remova um host para perder a barra; seus links ainda abrem na janela do navegador.

A correspondência é pelo nome do host sobre https, então `sub.telemost.yandex.ru` corresponde a uma entrada `telemost.yandex.ru`, enquanto uma URL `http` não corresponde. A lista é um filtro de conveniência, não uma fronteira de segurança: todo link https abre na janela, mas apenas os hosts listados recebem a barra.

## Gravar uma chamada

1. Abra a reunião no Vibe.
1. Pressione **Gravar esta chamada** antes ou durante a chamada.
1. Pare pela barra ou pela janela principal.

A gravação é manual; uma janela de reunião nunca começa a gravar sozinha. O gravador captura o microfone configurado e, quando ativado, o loopback de áudio do sistema, então os dois lados da chamada são gravados.

Fechar a janela durante a gravação pergunta se deve parar ou continuar gravando em segundo plano.

## Recorrer ao navegador do sistema

Se um serviço se recusar a rodar no webview incorporado, use **Abrir no navegador do sistema** na barra. É a alternativa suportada para sites fortemente dependentes de DRM ou hostis a WebRTC.

## Próximos passos

- [Por que o navegador de reuniões funciona assim](/vibe/docs#meeting-browser) explica o esquema de URL, o webview isolado e a regra de gravação manual.
- [Grave o microfone e o áudio do sistema](/vibe/docs#record-audio) cobre gravação fora de uma chamada.
