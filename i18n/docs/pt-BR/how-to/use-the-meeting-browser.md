<!-- source: a039b159d4fd -->

# Usar o navegador de reuniões

O Vibe pode hospedar uma chamada na própria janela baseada em Chromium: a barra do app (endereço, voltar, avançar, recarregar, abrir externo, fechar e **Gravar esta chamada**) fica no topo, e a página preenche o restante dessa mesma janela. Não existe uma janela de barra separada. Consulte [Referência do navegador de reuniões](../reference/meeting-browser.md) para os esquemas de URL e a lista de permitidos, e [a explicação](../explanation/meeting-browser.md) para saber por que o mecanismo funciona assim.

## Abrir uma chamada no Vibe

Use um destes caminhos:

- De outro app ou do sistema: ative **Abrir links de reunião no Vibe** em **Configurações → Gravação** para registrar links do Zoom, Teams e Webex (Windows e Linux, não macOS). O app valida a URL mapeada e a abre na janela do navegador quando o host dela pode carregar, ou no navegador do sistema caso contrário.
- Dentro do Vibe: a fonte **Navegador de reuniões** da página inicial, ou **Configurações → Gravação → Abrir no Vibe**; cole o link e pressione **Abrir no Vibe**.
- O host do link precisa estar na lista de permitidos; a navegação de nível superior e os recursos de origem cruzada fora dela são recusados. Os controles de gravação da barra estão presentes em cada página permitida.

Clicar em um link https no Chrome, Edge ou Firefox ainda abre esse navegador. O Vibe não se registra como navegador padrão.

## Gravar uma chamada

1. Abra a reunião no Vibe.
1. Pressione **Gravar esta chamada** na barra da janela antes ou durante a chamada.
1. Pare pela barra ou pela janela principal.

A gravação é manual; uma janela de reunião nunca começa a gravar sozinha. O gravador captura o microfone configurado e, quando ativado, o loopback de áudio do sistema, então os dois lados da chamada são gravados.

Os seletores de microfone e caixa de som na barra alteram os mesmos dispositivos que a janela principal usa, então uma chamada pode ser encaminhada sem sair dela. Enquanto uma gravação está em andamento, eles ficam desativados e indicam os dispositivos que ela está capturando; uma fonte que a gravação não captura aparece como **Nenhum**.

Fechar a janela durante a gravação pergunta se deve parar ou continuar gravando em segundo plano.

## Permitir os sites que você usa

**Configurações → Gravação → Domínios permitidos** é a lista de permitidos do navegador; ela começa vazia. Adicione cada domínio que você precisar, e seus subdomínios são incluídos via https.

Só os domínios listados podem carregar. Um link para outro host é recusado, assim como qualquer script, fonte ou imagem que uma página permitida busque de uma origem não listada. Os hosts recusados aparecem em **Bloqueados** com uma ação **Permitir** que adiciona o domínio e recarrega a página. A barra mostra a mesma oferta quando recusa uma navegação.

A lista estrita pode quebrar uma página cujos recursos vêm de um CDN até que esse CDN seja permitido; esse é o compromisso pretendido, e a lista Bloqueados deixa a correção a um clique.

## Recorrer ao navegador do sistema

Se um serviço se recusar a rodar no webview incorporado, use **Abrir no navegador do sistema** na barra. O navegador do sistema é a alternativa suportada para sites fortemente dependentes de DRM ou hostis a WebRTC.

No macOS, o navegador incorporado não tem barra dentro da janela: a página abre em uma janela apenas com a página, a gravação continua disponível pela janela principal, e o navegador do sistema é a alternativa para a chamada inteira.
