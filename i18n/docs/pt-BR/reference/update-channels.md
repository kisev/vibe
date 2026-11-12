<!-- source: 18fa449ab772 -->

# Canais de atualização

O app se atualiza a partir de um de três arquivos de canal no site, não do “latest release” do GitHub:

| Canal | Arquivo |
| --- | --- |
| Release | `https://kisev.github.io/vibe/updater/stable.json` |
| Beta | `https://kisev.github.io/vibe/updater/beta.json` |
| Dev | `https://kisev.github.io/vibe/updater/dev.json` |

Cada arquivo é o `latest.json` produzido por uma build de lançamento. Um arquivo ausente significa que a linha não tem nada: o app relata “atualizado” em vez de recorrer a outro canal.

## Linhas e versões

| Canal | Tag | Branch | Versão | O que é |
| --- | --- | --- | --- | --- |
| Release | `vX.Y.Z` | `main` | `X.Y.Z` | A linha estável |
| Beta | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | Candidato à próxima estável, publicado como pré-lançamento |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | A build móvel de `dev` |

Uma versão sem sufixo é rejeitada no canal beta; só `X.Y.Z-rc.<n>` é aceito ali. Um canal sem candidato está ausente, não vazio.

## No app

- **Configurações → Geral → Atualizações** traz o seletor de canal, a versão atual, **Verificar atualizações**, a hora da última verificação e o resultado.
- O app sonda `updater/<channel>.json` por conta própria. Um `404` ou `410` significa que o canal nunca foi publicado; qualquer outra falha é um erro real.
- A verificação roda na inicialização e após uma troca de canal.

## Limites

- O atualizador só avança. Uma build ruim é corrigida enviando uma mais nova.
- Uma instalação Release ou Beta que seleciona Dev vê “atualizado”: toda build dev fica abaixo da versão que ela já executa. Mudar para a linha dev exige uma instalação manual de uma build dev; depois disso, o canal Dev a atualiza para frente.
- Uma instalação Beta passa para a versão final trocando para Release, onde `X.Y.Z` fica acima dos seus candidatos.

## Páginas relacionadas

- [Alternar canais de atualização](/vibe/docs#switch-update-channels) para as etapas.
- [Por que os canais de atualização funcionam assim](/vibe/docs#update-channels-design) para o design.
