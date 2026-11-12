<!-- source: bc1a1519974a -->

# Alternar canais de atualização

O Vibe verifica um de três canais de atualização: Release, Beta ou Dev. O canal decide quais builds o app oferece, e ele só avança.

## Escolher um canal

1. Abra **Configurações → Geral → Atualizações**.
1. Escolha **Release**, **Beta** ou **Dev**.
1. Pressione **Verificar atualizações**.

A mesma seção mostra a versão instalada, a hora da última verificação e o resultado. A verificação também roda na inicialização.

## O que cada canal traz

| Canal | Builds |
| --- | --- |
| Release | Versões estáveis |
| Beta | Candidatos a lançamento da próxima versão estável |
| Dev | As builds `dev` mais recentes |

Uma instalação Release ou Beta que seleciona Dev vê **atualizado**: toda build dev fica abaixo da versão que ela já executa. Mudar para a linha dev exige uma instalação manual de uma build dev; depois disso, o canal Dev a atualiza para frente.

Uma instalação Beta passa para a versão final trocando para Release, onde a versão estável fica acima dos seus candidatos.

## Próximos passos

- [Canais de atualização](/vibe/docs#update-channels) para os arquivos de canal e as regras de tag.
- [Por que os canais de atualização funcionam assim](/vibe/docs#update-channels-design) para a ordenação de versões.
