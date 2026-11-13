<!-- source: 7770d2556ea9 -->

# Por que o navegador de reuniões funciona assim

Uma chamada é mais fácil de gravar quando o Vibe hospeda a página: o app controla a janela, sabe quando uma gravação está em andamento e pode mostrar uma barra com uma ação. O design é moldado pelo que o sistema operacional realmente permite.

## Por que um esquema de URL em vez de cliques https

Um navegador nunca entrega um link `https://` a um app instalado, a menos que esse app seja o navegador padrão. Apps de reunião funcionam ao contrário: eles registram o próprio esquema, e suas páginas ou instaladores o invocam.

O Vibe faz o mesmo:

- `vibe://open/?url=https://…` abre o destino na janela de navegador do Vibe. Qualquer app, script ou atalho pode chamá-lo. O Vibe valida a URL em Rust e recusa qualquer coisa que não seja https e bem formada.
- **Configurações → Gravação → Abrir no Vibe** cola um link no mesmo caminho.

Clicar em um link `https` no Chrome, Edge ou Firefox ainda abre esse navegador. Tornar o Vibe o navegador padrão está deliberadamente fora de escopo: isso assumiria todos os links da máquina para servir a um recurso.

## Por que a visualização de conteúdo é isolada

A janela de conteúdo é um webview comum com seu próprio diretório de dados. Cookies de serviços nunca se misturam ao armazenamento do app, nenhum script é injetado na página, e os pedidos de câmera e microfone vêm da própria página em vez de o Vibe concedê-los em nome do usuário. A página incorporada é tratada como conteúdo web não confiável, não como parte do app.

A barra oferece endereço, voltar, avançar, recarregar, fechar e **Abrir no navegador do sistema**. Essa última ação é a saída de emergência para um serviço que se recusa a rodar no webview incorporado.

## Por que o navegador é uma lista de permitidos

O navegador incorporado originalmente carregava tudo o que uma página pedia; a lista de hosts de reunião só decidia quais links recebiam a barra de gravação. Agora ele é uma fronteira de verdade. Só podem carregar os domínios que o usuário permitiu, e seus subdomínios via https: as páginas de nível superior e cada recurso que a página solicitar. Um recurso recusado recebe uma resposta de erro para que a página trate essa origem como indisponível em vez de tentar de novo para sempre.

O rigor é o objetivo, e ele tem um custo: uma página que busca fontes ou scripts de um CDN quebra até que esse CDN seja permitido. A lista de bloqueados é o remédio: hosts únicos, os mais recentes primeiro, cada um com uma ação **Permitir** que adiciona o domínio e recarrega a página. A barra do navegador oferece o mesmo quando recusa uma navegação.

## Por que a gravação continua manual

Cada página na janela do navegador mostra **Gravar esta chamada**, e enquanto qualquer janela do navegador estiver aberta o Vibe suprime o próprio pedido de chamada externa. A gravação continua manual — pressione o botão antes ou durante a chamada, pare pela barra do navegador ou pela janela principal. O início automático gravaria chamadas que o usuário não pediu para gravar e faria o indicador do microfone aparecer sem uma ação explícita.

Fechar a janela durante a gravação pergunta se deve parar ou continuar gravando em segundo plano, para que sair de uma chamada não descarte nem continue uma gravação silenciosamente.

## Limites

- Apenas links `vibe://open/` abrem automaticamente. Um clique `https` precisa da decisão de navegador padrão que o Vibe não toma.
- Sites fortemente dependentes de DRM ou hostis a WebRTC podem funcionar melhor no navegador do sistema; **Abrir no navegador do sistema** é a alternativa suportada.
- O Windows é validado primeiro. O bloqueio de recursos usa o mecanismo de cada motor: WebView2 `WebResourceRequested` no Windows; Linux e macOS atualmente bloqueiam apenas a navegação de nível superior e estão sendo finalizados.
- Registrar os esquemas do Zoom, Teams e Webex é opcional e está disponível no Windows e no Linux, não no macOS.

## Páginas relacionadas

- [Usar o navegador de reuniões](/vibe/docs#use-the-meeting-browser) para as etapas.
- [Grave o microfone e o áudio do sistema](/vibe/docs#record-audio) para o gravador em si.
