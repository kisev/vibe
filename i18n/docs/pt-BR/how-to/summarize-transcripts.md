<!-- source: f5e20b838770 -->

# Resumir uma transcrição

O Vibe pode transformar uma transcrição pronta em resumo, anotações ou tradução. A solicitação vai para a plataforma de IA configurada: um modelo Ollama local, Claude ou qualquer endpoint compatível com OpenAI. [Configurações e arquivo de configuração](/vibe/docs#settings) lista onde a conexão é armazenada.

## Usar um modelo Ollama local

1. Instale o [Ollama](https://ollama.com) e baixe um modelo, por exemplo `ollama pull llama3.1`.
1. Abra **Configurações → IA**.
1. Defina **Plataforma** como **Ollama**. A URL padrão é `http://localhost:11434`.
1. Escolha o nome do modelo.
1. Ative **Resumos** e, opcionalmente, **Resumir novas transcrições automaticamente**.

O Ollama roda nesta máquina, então a transcrição fica local.

## Usar Claude ou um endpoint compatível com OpenAI

1. Abra **Configurações → IA** e escolha a plataforma.
1. Cole a chave de API e altere a URL base se o endpoint não for o padrão.
1. Escolha o modelo.
1. Ative **Resumos**.

Para um endpoint não padrão, a URL base e a chave são a conexão que o app usa tanto para resumos quanto para ditado.

## Resumir

1. Conclua uma transcrição.
1. Abra a ação de resumo na visualização da transcrição.
1. Escolha uma predefinição e, se necessário, edite o prompt.
1. Execute; o resultado é salvo com o projeto e pode ser exportado ao lado da transcrição.

Com **Resumir novas transcrições automaticamente** ativado, o resumo roda assim que uma transcrição termina.

## Próximos passos

- [Configurações e arquivo de configuração](/vibe/docs#settings) para o arquivo de config e as seções de configurações.
- [Privacidade e design offline](/vibe/docs#privacy) para quais plataformas mantêm o texto na máquina.
