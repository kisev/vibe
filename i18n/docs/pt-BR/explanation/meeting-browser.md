<!-- source: 6737f12a1fc7 -->

# Navegador de reuniões

O navegador de reuniões existe porque uma chamada é mais fácil de gravar quando o próprio Vibe hospeda a página: o app controla a janela, sabe quando uma gravação está em andamento e pode mostrar sua própria barra com uma ação. O design é moldado pelo que o sistema operacional realmente permite.

## Por que um esquema de URL em vez de cliques https

Um navegador nunca entrega um link `https://` a um app instalado, a menos que esse app seja o navegador padrão. Apps de reunião para desktop funcionam ao contrário: eles registram o próprio esquema (`zoommtg://`, `msteams://`, `mattermost://`), e suas próprias páginas ou instaladores o invocam.

O Vibe faz a mesma coisa, de forma honesta:

- Ative **Abrir links de reunião no Vibe** e o Vibe registra os esquemas de reunião que Zoom, Teams e Webex já usam (`zoommtg://`, `msteams://`, `webex://`), mapeando cada um para a URL web que ele carrega. O app valida a URL em Rust e a abre na janela do navegador quando o host dela pode carregar, ou no navegador do sistema caso contrário.
- Uma URL `https` entregue como argumento de inicialização segue o mesmo caminho.
- Dentro do app, a fonte **Navegador de reuniões** da página inicial e **Configurações → Gravação → Abrir no Vibe** colam um link no mesmo caminho.

O Vibe deliberadamente não traz nenhum link `vibe://open/` próprio: nenhuma página de reunião emite um, e é por isso que esse primeiro ponto de entrada foi removido. Clicar em um link `https` no Chrome, Edge ou Firefox ainda abre esse navegador. Tornar o Vibe o navegador padrão está deliberadamente fora de escopo: isso assumiria todos os links da máquina para servir a um único recurso, e ainda assim seria uma decisão do usuário.

## Por que a visualização de conteúdo é isolada

A janela contém dois webviews filhos: a barra do Vibe e a página remota. A barra é a interface do app e carrega as capacidades do app; a página é conteúdo web comum e não confiável, sem nenhuma capacidade, sem scripts injetados nela, e com os pedidos de câmera e microfone vindo da própria página em vez de o Vibe concedê-los em nome do usuário. Os dois compartilham o ambiente WebView2 do processo, porque o WebView2 não suporta um segundo diretório de dados em um mesmo processo.

A barra oferece endereço, voltar, avançar, recarregar, fechar e **Abrir no navegador do sistema**. Essa última ação é a saída de emergência para um serviço que se recusa a rodar no webview incorporado. A incorporação de múltiplos webviews é um recurso de desktop do Windows/Linux aqui; no macOS o navegador recorre a uma janela apenas com a página, sem barra, em vez de falhar.

## Por que o navegador é uma lista de permitidos

O navegador incorporado originalmente carregava tudo o que uma página pedia; a lista de hosts de reunião só decidia quais links recebiam a barra de gravação. Agora ele é uma fronteira de verdade: só podem carregar os domínios permitidos e seus subdomínios via https, tanto para as páginas de nível superior quanto para cada recurso que elas solicitarem. Um recurso recusado recebe uma resposta de erro, para que a página trate essa origem como indisponível em vez de tentar de novo para sempre.

O rigor tem um custo: uma página que busca fontes ou scripts de um CDN quebra até que esse CDN seja permitido. A lista de bloqueados é o remédio — hosts únicos, os mais recentes primeiro, cada um com uma ação **Permitir** que adiciona o domínio e recarrega a página. A lista é desenhada dentro da barra, e a barra cresce para caber nela, porque um popup dentro de um webview de 104 pixels seria cortado pela página abaixo. A barra faz a mesma oferta quando recusa uma navegação. O Windows aplica o bloqueio de recursos com o `WebResourceRequested` do WebView2; o Linux e o macOS atualmente bloqueiam apenas a navegação de nível superior.

O modo é armazenado em cache em vez de lido por janela, e o filtro de recursos é instalado nos dois modos, então alternar entre `strict` e `trusted-site` atinge uma página que já está aberta na próxima solicitação dela, em vez de exigir que seja reaberta.

## Por que a gravação continua manual

Cada página no navegador mostra **Gravar esta chamada**, e enquanto qualquer janela do navegador estiver aberta, o pedido de chamada do navegador externo é suprimido. A gravação continua manual — pressione o botão antes ou durante a chamada, pare pela barra ou pela janela principal. O início automático gravaria chamadas que o usuário não pediu para gravar e faria o indicador de microfone do app aparecer sem uma ação explícita.

Fechar a janela durante a gravação pergunta se deve parar ou continuar gravando em segundo plano, para que sair de uma chamada não descarte nem continue uma gravação silenciosamente.

## Limites

- Apenas um esquema de reunião registrado ou um argumento de inicialização `https` é entregue ao Vibe. Um clique `https` precisa da decisão de navegador padrão que o Vibe não toma.
- Sites fortemente dependentes de DRM ou hostis a WebRTC podem funcionar melhor no navegador do sistema; **Abrir no navegador do sistema** é a alternativa suportada.
- O Windows é validado primeiro. As outras plataformas usam seus próprios webviews e recorrem ao navegador do sistema se a janela não conseguir hospedar a chamada.

Os fatos e as regras da lista de permitidos estão em [Referência do navegador de reuniões](../reference/meeting-browser.md); as etapas estão em [Usar o navegador de reuniões](../how-to/use-the-meeting-browser.md).
