import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

// Ligado/desligado é lembrado só nesta sessão; isBusy mostra "reescrevendo…".
const isOn = atom({ plugin: 'prompt-master', key: 'isOn' } as const, true)
const isBusy = atom({ plugin: 'prompt-master', key: 'isBusy' } as const, false)

const SYSTEM = `Você é o Prompt Master, um especialista em engenharia de prompts.
Reescreva o prompt do usuário para um assistente de programação (Claude Code) de forma que fique:
- claro, específico e sem ambiguidade;
- com objetivo, contexto, restrições e critério de "pronto" explícitos quando puderem ser inferidos;
- organizado (listas curtas quando ajudar), sem enrolação.
Regras: mantenha o MESMO idioma do original; não invente fatos, arquivos ou requisitos que não estejam implícitos;
preserve nomes de arquivos, código, caminhos e @menções exatamente; não responda ao pedido, apenas reescreva.
Devolva SOMENTE o prompt reescrito, sem aspas, prefácio ou comentários.`

async function rewrite($: EngineInterface, text: string): Promise<string | undefined> {
  const r = await $.model.complete(
    { model: 'haiku', system: SYSTEM, prompt: `Prompt original:\n\n${text}`, maxTokens: 2000 })
  if (!r.isAnswered) return undefined
  const out = r.text.trim()
  return out.length > 0 ? out : undefined
}

// Prompts curtos demais ("ok", "sim", "continue") passam direto.
const worthRewriting = (text: string) => {
  const t = text.trim()
  return t.length >= 12 && !t.startsWith('/') && !t.startsWith('!')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'prompt-master',
      description: 'Liga/desliga o Prompt Master (on | off | sem argumento alterna)',
    })
    return next(e)
  })

  on('command.run', { command: 'prompt-master' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    const now = await update($, isOn, v => (arg === 'on' ? true : arg === 'off' ? false : !v))
    return { text: now ? '✨ Prompt Master ligado.' : 'Prompt Master desligado.' }
  })

  // Reescreve automaticamente no envio, quando ligado.
  on('prompt.submit', async ($, e, next) => {
    if (e.command || e.isMeta || e.origin.kind === 'plugin') return next(e)
    if (!(await read($, isOn)) || !worthRewriting(e.text)) return next(e)

    await update($, isBusy, () => true)
    $.ui.status('✨ Prompt Master reescrevendo…')
    try {
      const better = await rewrite($, e.text).catch(() => undefined)
      if (!better) {
        $.ui.toast('Prompt Master: não consegui reescrever, enviei o original.')
        return next(e)
      }
      return next({ ...e, text: better }).catch(() => next(e))
    } finally {
      $.ui.status(undefined)
      await update($, isBusy, () => false)
    }
  })

  // O botão "Prompt Master" junto à caixa de entrada.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const { Box, Button, Text } = $.ui.resolve(e)
    const on_ = await read($, isOn)
    const busy = await read($, isBusy)

    return (
      <Box flexDirection="row" gap={1}>
        <Button
          key="toggle"
          label={on_ ? '✨ Prompt Master: ON' : 'Prompt Master: OFF'}
          onPress={async () => {
            const now = await update($, isOn, v => !v)
            $.ui.toast(now ? 'Prompt Master ligado: prompts serão reescritos antes de enviar.' : 'Prompt Master desligado.')
          }}
        />
        <Button
          key="preview"
          label="Reescrever rascunho"
          onPress={async () => {
            const { text } = await $.prompt.read()
            if (!text.trim()) {
              $.ui.toast('Digite algo na caixa primeiro.')
              return
            }
            await update($, isBusy, () => true)
            try {
              const better = await rewrite($, text)
              if (better) await $.prompt.fill({ text: better, mode: 'replace' })
              else $.ui.toast('Prompt Master: não consegui reescrever.')
            } finally {
              await update($, isBusy, () => false)
            }
          }}
        />
        {busy && <Text dimColor>reescrevendo…</Text>}
      </Box>
    )
  })
}
