---
version: unreleased
date: 
title: "O que vem a seguir"
source: 4462099ac37f
---

## New

- 🧪 **Comparação de modelos lado a lado** — Configurações → Modelos executa um trecho ou arquivo por todos os modelos instalados que você escolher e abre os resultados em janela inteira: uma coluna por modelo com o tempo e a contagem de palavras, rolagem independente, um seletor de referência e destaque no nível da palavra que risca as palavras ausentes e marca as extras
- 🗣️ **Separação de falantes na comparação** — um interruptor adiciona rótulos de falante à transcrição de cada modelo, então a mesma execução mostra qual modelo ouviu as palavras e quem as disse
- 🔄 **Três canais de atualização** — siga Release, Beta ou Dev, veja a versão atual e quando a última verificação ocorreu, e inicie uma verificação você mesmo com um botão em vez de esperar a próxima abertura
- 🗺️ **O site tem um roteiro** — uma nova página lista cada mudança não arquivada diretamente dos arquivos de planejamento do projeto, então o que está por vir nunca é um palpite escrito à mão
- 🌐 **Reuniões abrem dentro do Vibe** — links de reunião abrem em um navegador integrado com o próprio menu (voltar, avançar, recarregar, abrir no navegador do sistema, fechar) e uma lista editável de hosts de reunião; o Vibe pode se registrar como o manipulador de links do Zoom, Teams e Webex quando você pedir, e uma chamada detectada avisa para gravá-la com o microfone e o áudio do sistema
- 🌍 **O site fala o seu idioma** — um seletor de idioma no cabeçalho troca a página no lugar, mantém `?lang=` na URL para que links compartilhados levem a escolha e aplica o layout da direita para a esquerda. `/changelog/dev` agora é o endereço permanente das notas de dev

## Improved

- 🧭 **As atualizações Dev têm a própria linha** — as builds de dev são publicadas como pré-lançamentos `-dev.N` no canal Dev, os candidatos a lançamento são gerados para o Beta, e o registro de alterações de dev mantém uma URL estável conforme as builds chegam e vão
- 🏷️ **As comparações nomeiam os modelos corretamente** — resultados e diálogos usam o nome canônico e a grafia de quantização do catálogo em vez de transformar um nome de arquivo em maiúsculas iniciais
- 🤫 **A detecção de reuniões fica fora do caminho** — a própria janela de reunião do Vibe suprime o aviso de detecção externa, e o estado de gravação é compartilhado, então uma chamada já aberta no Vibe nunca oferece gravar duas vezes
- 🕵️ **Nada sai do seu dispositivo** — toda a telemetria foi removida: sem chave de analytics, sem ping na abertura ou em uma ação, e sem banners de doação no site. Registros, diagnósticos e exportações ficam no disco e só saem quando você mesmo os envia
- 📚 **A documentação segue o Diátaxis** — tutoriais, guias práticos, referência e explicação ficam separados, no repositório e no site, então “como faço…” e “o que isso significa” não dividem mais uma única página longa
- 🔗 **As notas de versão apontam para o registro de alterações traduzido** — o corpo de cada versão linka para `https://kisev.github.io/vibe/changelog/<version>`, então o leitor escolhe o próprio idioma em vez do inglês

## Fixed

- 🎙️ **Todo modelo consegue executar a comparação** — GigaAM e Parakeet não recusam mais uma execução por falta do modelo VAD; o laboratório fornece o detector incluído para que os resultados difiram apenas pelo modelo
- 📍 **A comparação vem primeiro** — o laboratório subiu para cima do longo catálogo de modelos em Configurações → Modelos, então é a primeira coisa que você vê
- 🔍 **Transcrições longas ainda são destacadas** — a comparação de diferenças não desiste mais acima de mil palavras e informa zero diferenças; quando um texto é realmente longo demais, a coluna diz isso
- 🔁 **Os canais de atualização mantêm os nomes e a linha** — o seletor mostra Release, Beta e Dev em todos os idiomas, e o Beta oferece apenas candidatos a lançamento em vez de espelhar a build estável
- 🔌 **O interruptor do servidor de API permanece desligado** — o interruptor de agentes é escolha sua e sobrevive a uma reinicialização; ler metadados de modelos na abertura não deixa mais um servidor rodando por trás
- 🪟 **A janela de reunião pode ser fechada** — os controles ficam na própria janela, então uma página que falha ao carregar não deixa mais uma janela sem saída
- 🌍 **O site traduz a página inteira** — trocar o idioma não deixa mais seções em inglês para trás, e o registro de alterações também segue o idioma escolhido
