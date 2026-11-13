<!-- source: cc4651e4e37d -->

# Usar o navegador de reuniões

O Vibe pode hospedar uma chamada na própria janela com uma barra sempre em primeiro plano cuja ação principal é **Gravar esta chamada**. A janela usa o webview da plataforma; [Por que o navegador de reuniões funciona assim](/vibe/docs#meeting-browser) cobre o isolamento e os limites.

## Abrir uma chamada no Vibe

Use um destes caminhos:

- Abra **Configurações → Gravação → Abrir no Vibe**, cole o link e abra-o.
- De outro app, script ou atalho, chame `vibe://open/?url=https://…`. O Vibe aceita apenas URLs https bem formadas e recusa qualquer outra coisa com um diálogo.
- Ative **Abrir links de reunião no Vibe** em **Configurações → Gravação** para registrar links do Zoom, Teams e Webex. Isso está disponível no Windows e no Linux, não no macOS.

Clicar em um link https no Chrome, Edge ou Firefox ainda abre esse navegador. O Vibe não se registra como navegador padrão.

## Permitir os sites que você usa

**Configurações → Gravação → Domínios permitidos** é a lista de permitidos do navegador. Ela começa vazia: adicione cada domínio que quiser abrir, e seus subdomínios são incluídos automaticamente. A correspondência é pelo nome do host via https: uma URL `http` nunca carrega.

A lista é uma fronteira, não um filtro. Um link para um host fora dela é recusado, assim como qualquer script, fonte ou imagem que uma página permitida solicite a uma origem não listada. Todo host recusado aparece em **Bloqueados** com uma ação **Permitir**; permiti-lo adiciona o domínio e recarrega a página para que os recursos recusados sejam tentados de novo.

Uma lista rígida pode quebrar uma página cujos recursos vêm de um CDN até que esse CDN seja permitido. A lista Bloqueados é o remédio, e a barra do navegador oferece o mesmo quando recusa uma navegação. Enquanto qualquer janela do navegador estiver aberta, o Vibe suprime o próprio pedido de chamada.

## Gravar uma chamada

Os controles de gravação da barra do navegador estão presentes em cada página permitida, não apenas em uma lista de hosts.

1. Abra a reunião no Vibe.
1. Pressione **Gravar esta chamada** antes ou durante a chamada.
1. Pare pela barra do navegador ou pela janela principal.

A gravação é manual; uma janela de reunião nunca começa a gravar sozinha. O gravador captura o microfone configurado e, quando ativado, o loopback de áudio do sistema, então os dois lados da chamada são gravados.

Fechar a janela durante a gravação pergunta se deve parar ou continuar gravando em segundo plano.

## Recorrer ao navegador do sistema

Se um serviço se recusar a rodar no webview incorporado, use **Abrir no navegador do sistema** na barra. É a alternativa suportada para sites fortemente dependentes de DRM ou hostis a WebRTC.

## Próximos passos

- [Por que o navegador de reuniões funciona assim](/vibe/docs#meeting-browser) explica o esquema de URL, o webview isolado, o compromisso da lista de permitidos e a regra de gravação manual.
- [Grave o microfone e o áudio do sistema](/vibe/docs#record-audio) cobre a gravação fora de uma chamada.
