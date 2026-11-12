<!-- source: dd9e41dac7e3 -->

# Configurações e arquivo de configuração

As configurações ficam em `app_config.json` no diretório de configuração do app. O arquivo deve ser lido e editado: o Vibe o monitora e aplica uma alteração externa sem reiniciar. **Configurações → Agentes → Arquivo de configuração** o abre.

## Local do arquivo de configuração

| Plataforma | Diretório |
| --- | --- |
| macOS | `~/Library/Application Support/github.com.thewh1teagle.vibe` |
| Windows | `%appdata%\github.com.thewh1teagle.vibe` |
| Linux | `~/.config/github.com.thewh1teagle.vibe` |

O diretório mantém seu identificador upstream, então o nome não mudou em relação a builds anteriores.

## Seções de configurações

| Seção | Contém |
| --- | --- |
| Geral | Idioma de exibição, tema, atualizações, manter na bandeja do sistema, iniciar com o sistema, impedir suspensão |
| Privacidade | Se os projetos são salvos e a política de privacidade |
| Transcrição | Idioma, exportação automática, som e foco ao terminar, pasta de projetos |
| Modelos | Escolha de CPU/GPU, dispositivo GPU, catálogo de modelos, modelo de separação de falantes |
| Ajustes finos | Opções do Whisper, processamento de áudio, memória do modelo e tempo limite para descarregar |
| Gravação | Navegador de reuniões, detecção de reuniões, transcrição automática, atalho de gravação, permissões no macOS |
| Ditado | Atalho de ditado e modo de ativação |
| IA | Resumos e tarefas de ditado, conexão da plataforma |
| Celular | Gravação pelo celular, pareamento, dispositivos pareados |
| Agentes | API local, habilidade de agente, arquivo de configuração |
| Avançado | Registros, diagnósticos e controles de desenvolvedor |

## Valores que vale conhecer

| Grupo de chaves | Significado |
| --- | --- |
| `transcription.*` | Idioma, prompt, diarização, marcações de tempo, divisão de gravações longas |
| `model.*` | Modelo selecionado, nomes de exibição, dispositivo GPU, alternância só CPU, tempo limite para descarregar |
| `transcript.*` | Formato de exportação, marcações de tempo, falantes, exportação automática |
| `recording.*` | Dispositivos de entrada e saída, detecção de reuniões, atalho de gravação |
| `ai.*` | Plataforma, URL base, chave, modelo, prompt e opções de ativação por tarefa |
| `general.updateChannel` | `stable`, `beta` ou `dev` |
| `handoff.pairing` | Dispositivos de celular pareados e hashes de credenciais |

Os nomes exatos dos campos são estáveis o suficiente para editar, mas o app é dono do esquema: altere um valor pela interface de configurações quando existir, e deixe o app reescrever o arquivo em vez de substituí-lo inteiro.

## Páginas relacionadas

- [Alternar canais de atualização](/vibe/docs#switch-update-channels) para a configuração de canal.
- [Resumir uma transcrição](/vibe/docs#summarize-transcripts) para a conexão de IA.
- [Transcrever a partir do celular](/vibe/docs#transcribe-from-a-phone) para as configurações de gravação pelo celular.
