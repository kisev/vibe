<!-- source: dc7efd39c01b -->

# Por que os canais de atualização funcionam assim

O GitHub tem um único “latest release”. O Vibe precisa de três linhas — Release, Beta e Dev — entre as quais um usuário pode alternar, inclusive a partir de uma instalação antiga. Essa incompatibilidade guia o design de canais.

## Por que o site, e não o GitHub

O app lê `updater/<channel>.json` do site. Cada arquivo é o `latest.json` produzido por uma build de lançamento, copiado ao lado dos outros:

- Release → `stable.json`
- Beta → `beta.json`
- Dev → `dev.json`

Um arquivo de canal é um ativo estático implantado com o site, então apontar uma linha para uma build é um commit, não uma edição de release. Ele também permite que um canal ausente signifique algo preciso: um `404` ou `410` é “nada nesta linha”, que o app relata como atualizado. Se o app recorresse a outro canal quando falta um arquivo, um usuário Beta sem candidato seria movido silenciosamente para Release.

## Por que o sufixo beta é `-rc.<n>`

O Semver ordena:

```text
X.Y.Z-dev.N < X.Y.Z-rc.N < X.Y.Z
```

Essa ordenação é toda a razão da grafia. Com a comparação estrita do atualizador, Dev → Beta → Release sempre avança; nenhuma substituição especial é necessária.

Uma linha anterior usava `-beta.N`, mas não tinha canal dev. `X.Y.Z-beta.N` ordena acima de `X.Y.Z-dev.N`, então uma build beta pareceria mais nova que toda build dev e quebraria a troca. O canal beta mantém o nome; apenas o sufixo da versão é `-rc.<n>`.

## Por que o beta traz apenas candidatos

Apenas uma versão `X.Y.Z-rc.<n>` é escrita em `beta.json`; uma release simples é rejeitada. Isso mantém a linha beta significativa: é a linha de candidatos, não uma segunda linha estável. Depois de um lançamento estável, uma instalação Beta passa para a final trocando o canal para Release, onde `X.Y.Z` fica acima dos seus candidatos.

## Atualizações só para frente

O atualizador só avança. Uma release ruim é corrigida enviando uma mais nova, e é para isso que serve a linha beta: pegá-la antes que o Release a receba. É também por isso que uma instalação Release ou Beta que seleciona Dev vê “atualizado”: toda build dev fica abaixo da versão que ela já executa. Mudar para a linha dev exige uma instalação manual de uma build dev; depois disso, o canal Dev a atualiza para frente.

## Compromissos

- **Manifestos copiados** significam que uma mudança de canal é um commit em `main` mais um deploy do site, não uma chamada de API. O atraso é de minutos e o histórico é revisável.
- **Nenhum fallback entre canais** significa que o usuário vê um “atualizado” preciso em vez de um downgrade surpresa ou um salto entre linhas.
- **O Dev exige uma instalação manual** é o preço de manter a ordenação semver honesta. Automatizá-la exigiria um conceito de canal que os clientes antigos não têm.

## Páginas relacionadas

- [Canais de atualização](/vibe/docs#update-channels) para os arquivos e as regras de versão.
- [Alternar canais de atualização](/vibe/docs#switch-update-channels) para as etapas.
