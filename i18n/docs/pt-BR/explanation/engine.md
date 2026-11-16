<!-- source: 6fd793aea9b2 -->

# Motor e escolhas de GPU

O Vibe separa o shell desktop do motor de transcrição. O shell é um app Tauri em Rust e React; o motor é o `vibe-server`, um processo Rust que chama a biblioteca C++ transcribe.cpp sobre ggml.

## Por que o motor é um processo separado

O servidor é dono do carregamento de modelos e da computação pesada. Mantê-lo fora do processo desktop significa:

- a janela pode reiniciar sem recarregar um modelo de vários gigabytes;
- o mesmo binário serve o app, a CLI e a API HTTP local;
- uma falha no motor não leva a janela junto;
- o motor pode ser atualizado no próprio ritmo, fixado pela build do app.

O app desktop conversa com o servidor por HTTP local. Nada nesse caminho sai da máquina; [Privacidade e design offline](/vibe/docs#privacy) cobre a superfície de rede.

## Um motor, muitas famílias de modelos

Toda família suportada roda na mesma build ggml: Whisper, Parakeet, Nemotron, Canary, Qwen3-ASR, Voxtral e GigaAM. Silero VAD e a diarização Nemotron-3 também rodam nessa pilha. Um único motor mantém o tratamento de memória, a quantização e o despacho de GPU iguais para todos os modelos.

O compromisso é o acoplamento de versões: um modelo cujo GGUF precisa de um transcribe.cpp mais novo que a build incluída aparece em [Modelos](/vibe/docs#models), mas não carrega até o motor avançar. Essa fixação é deliberada, porque atualizações do motor são eventos de paridade, não atualizações de dependência em segundo plano.

## Backends de GPU

O ggml escolhe um backend para a máquina em que roda:

| Plataforma | Backend |
| --- | --- |
| macOS | Metal |
| Windows | Vulkan |
| Linux | Vulkan |

Uma máquina sem GPU utilizável roda na CPU. **Configurações → Modelos** traz **Transcrever na CPU** e, no Windows e no Linux, um seletor de dispositivo GPU. Se um carregamento de GPU falhar, o app tenta de novo na CPU e relata que fez isso.

A GPU importa mais para modelos grandes e arquivos longos. Modelos pequenos em uma CPU moderna podem ser rápidos o suficiente, e o caminho de CPU é a alternativa quando falta um driver ou o carregador Vulkan.

## Páginas relacionadas

- [Modelos](/vibe/docs#models) para o catálogo e os limites por família.
- [Linha de comando](/vibe/docs#cli) para opções do `vibe-server`, como `--gpu-device`.
- [Privacidade e design offline](/vibe/docs#privacy) para o que fica na máquina.
