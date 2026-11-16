# Prompt-Master

Mod do Claude Code que reescreve seu prompt antes de enviá-lo, deixando-o mais claro,
específico e completo (objetivo, contexto, restrições e critério de pronto), sem inventar requisitos
e mantendo o idioma original.

## Uso

- **Botão `✨ Prompt Master: ON/OFF`** (na faixa logo acima da caixa de entrada): liga/desliga a reescrita automática no envio.
- **Botão `Reescrever rascunho`**: reescreve o texto que está na caixa e o coloca de volta para você revisar antes de enviar.
- **`/prompt-master [on|off]`**: o mesmo liga/desliga por comando.

Prompts curtos (menos de 12 caracteres), comandos `/` e `!` passam sem alteração.
A reescrita usa o modelo `haiku` e é cobrada nas credenciais da sessão.

## Instalação

No prompt de uma sessão do Claude Code no terminal:

```
/plugin install prompt-master --marketplace DanielSam13/Prompt-Master
```

Responda `y` para adicionar o marketplace e escolha o escopo (Enter para o de usuário).

Pelo shell:

```bash
claude plugin install prompt-master --marketplace DanielSam13/Prompt-Master
```

No app desktop, onde `/plugin` não roda: clique em **+** ao lado da caixa de prompt, depois **Plugins**, **Add marketplace** com `DanielSam13/Prompt-Master` e então **Add plugin**.

O mod não tem dependências para instalar: é um único módulo de hooks carregado pelo próprio Claude Code.
