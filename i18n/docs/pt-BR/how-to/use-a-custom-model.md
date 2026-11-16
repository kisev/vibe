<!-- source: aa8415261690 -->

# Importar um modelo personalizado

O Vibe executa modelos GGUF pelo motor incluído. O catálogo em **Configurações → Modelos** cobre as famílias testadas; este guia adiciona um que o catálogo não lista. [Modelos](/vibe/docs#models) é a referência do que cada família suporta.

## Baixar de uma URL

1. Abra **Configurações → Modelos**.
1. Cole um link direto de modelo em **Baixar modelo** e confirme.
1. Espere o download terminar; o arquivo vai para a pasta de modelos.
1. Selecione o novo modelo na lista de modelos.

O Vibe também aceita a mesma solicitação como deep link:

```text
vibe://download/?url=https://example.com/model.gguf
```

Uma URL colada não carrega tamanho nem soma de verificação, então o Vibe verifica os bytes baixados e o cabeçalho GGUF/BIN antes de aceitar o arquivo. As entradas do catálogo em [Modelos](/vibe/docs#models) carregam uma revisão fixada, tamanho e SHA-256.

## Usar um arquivo no disco

1. Coloque o arquivo `.gguf` na pasta de modelos. O caminho da pasta está em **Configurações → Modelos → Pasta de Modelos**, que também a abre.
1. Volte para **Configurações → Modelos**; o arquivo aparece na lista de instalados.
1. Selecione-o.

Mova ou renomeie a pasta apenas por meio de **Alterar pasta de modelos** e depois selecione o modelo novamente.

## Quando um modelo não carrega

- O arquivo deve ser GGUF ou o contêiner legado `.bin` que o motor aceita.
- Um modelo que exige um transcribe.cpp mais novo que o incluído aparece no catálogo, mas ainda não pode carregar.
- Um modelo com idioma fixo rejeita outro idioma; o erro nomeia o idioma suportado.

## Próximos passos

- [Modelos](/vibe/docs#models) para o catálogo testado e os limites por família.
- [Linha de comando](/vibe/docs#cli) para executar um modelo sem a janela.
