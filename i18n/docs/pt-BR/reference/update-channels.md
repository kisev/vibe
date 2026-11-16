<!-- source: 63b7a2f2736b -->

# Canais de atualização

O app se atualiza a partir de um de três arquivos de canal no site, não da “latest release” do GitHub:

| Canal | Arquivo |
| --- | --- |
| Release | `https://kisev.github.io/vibe/updater/stable.json` |
| Beta | `https://kisev.github.io/vibe/updater/beta.json` |
| Dev | `https://kisev.github.io/vibe/updater/dev.json` |

Cada arquivo é o `latest.json` que uma build de lançamento produziu. Um canal sem arquivo é uma linha sem nada: o app relata “Atualizado” em vez de recorrer a outro canal ou tratar o arquivo ausente como uma verificação com falha.

## Linhas e versões

| Canal | Tag | Branch | Versão | O que é |
| --- | --- | --- | --- | --- |
| Release | `vX.Y.Z` | `main` | `X.Y.Z` | A linha estável |
| Beta | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | Candidato para a próxima estável, publicado como pré-lançamento do GitHub |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | A build móvel de `dev` |

`beta.json` fica ausente enquanto nenhum candidato está publicado. Uma release simples é rejeitada no canal beta; só `X.Y.Z-rc.<n>` é aceito ali.

## De onde vêm os manifestos

- **Release e beta**: o atualizador Tauri da build de lançamento produz o `latest.json`. `scripts/channel.py <version> --channel <stable|beta>` o baixa de `https://github.com/kisev/vibe/releases/download/v<version>/latest.json`, valida a versão e escreve `website/public/updater/<channel>.json`. Faça commit do arquivo em `main`; o deploy do site o publica.
- **Dev**: `.github/workflows/dev-build.yml` publica um pré-lançamento com artefatos do atualizador e `latest.json`. `scripts/dev_manifest.py` lê a release dev completa mais recente e escreve `website/public/updater/dev.json`; uma build dev nova dispara o deploy do site. Se a release mais recente estiver parcial ou a chamada de API falhar, o `dev.json` anterior permanece.

`channel.py` se recusa a mover um canal para trás e entende a ordenação de `-rc.<n>`.

## No app

- **Configurações → Geral → Atualizações** traz o seletor de canal, a versão atual, **Verificar atualizações**, a hora da última verificação e o resultado.
- A seleção em tempo de execução fica em `desktop/src-tauri/src/updater.rs`; o lado do webview é `desktop/src/providers/updater.tsx`.
- `desktop/src-tauri/src/updater.rs` sonda `updater/<channel>.json` diretamente. Um `404` ou `410` significa que o canal nunca foi publicado; qualquer outra falha é um erro real.
- O endpoint estático do plugin do Tauri em `tauri.conf.json` é a alternativa que o próprio plugin conhece; a escolha do canal acontece no código do app.

## Limites

- O atualizador só avança. Uma build ruim é corrigida enviando uma mais nova.
- Uma instalação Release ou Beta que seleciona Dev vê “Atualizado”: toda build dev fica abaixo da versão que ela já executa. Mudar para a linha dev exige uma instalação manual de uma build dev; depois disso, o canal Dev a atualiza para frente.
- Uma instalação Beta passa para a versão final trocando para Release, onde `X.Y.Z` fica acima dos seus candidatos.
- Apps compilados antes dos arquivos de canal (a linha 3.x do upstream) ainda leem a release do GitHub que estiver marcada como “latest”. `gh release edit --latest` é o que é entregue a eles, executado por último.

Veja [Publicar uma release](../how-to/publish-a-release.md) e [Cortar uma build dev](../how-to/cut-a-dev-build.md) para os procedimentos, e [a explicação](../explanation/update-channels.md) para saber por que as linhas e os sufixos têm esse formato.
