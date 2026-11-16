import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'prompt-master',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

const SURFACES = ['terminal', 'desktop', 'mobile'] as const
const USAGE = {
  input_tokens: 1,
  output_tokens: 1,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 0,
}
const BETTER = 'Prompt reescrito e mais claro.'
const LONG = 'arruma o bug do login ai pfv'

test('os dois botões aparecem em cada superfície', async $ => {
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect((await ui.find({ key: 'toggle' }))?.text).toContain('Prompt Master: ON')
    expect((await ui.find({ key: 'preview' }))?.text).toContain('Reescrever rascunho')
    await ui.unmount()
  }
})

test('o botão ON/OFF alterna o estado e avisa', async ($, on) => {
  const toasts: string[] = []
  on('ui.toast', (_, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await ui.press({ key: 'toggle' })
  expect((await ui.find({ key: 'toggle' }))?.text).toContain('Prompt Master: OFF')
  await ui.press({ key: 'toggle' })
  expect((await ui.find({ key: 'toggle' }))?.text).toContain('Prompt Master: ON')
  expect(toasts.length).toBe(2)
  await ui.unmount()
})

test('"Reescrever rascunho" troca o rascunho pelo texto reescrito', async ($, on) => {
  const filled: string[] = []
  on('prompt.read', () => ({ value: { text: LONG, cursor: LONG.length } }))
  on('model.complete', () => ({ value: { isAnswered: true, text: BETTER, usage: USAGE } }))
  on('prompt.fill', (_, e) => {
    filled.push(e.text)
    return { isFilled: true }
  })

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await ui.press({ key: 'preview' })
  expect(filled).toEqual([BETTER])
  await ui.unmount()
})

test('"Reescrever rascunho" com a caixa vazia só avisa', async ($, on) => {
  const toasts: string[] = []
  let calls = 0
  on('prompt.read', () => ({ value: { text: '  ', cursor: 0 } }))
  on('model.complete', () => {
    calls += 1
    return { value: { isAnswered: true, text: BETTER, usage: USAGE } }
  })
  on('ui.toast', (_, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await ui.press({ key: 'preview' })
  expect(calls).toBe(0)
  expect(toasts).toEqual(['Digite algo na caixa primeiro.'])
  await ui.unmount()
})

const submit = (text: string) => ({ text, wait: false, origin: { kind: 'composer' } }) as const

test('ligado, o envio chega reescrito; curto e desligado passam iguais', async ($, on) => {
  on('model.complete', () => ({ value: { isAnswered: true, text: BETTER, usage: USAGE } }))
  on('prompt.submit', (_, e) => ({ text: e.text }))

  expect((await $.prompt.submit(submit(LONG))) as { text: string }).toEqual({ text: BETTER })
  expect((await $.prompt.submit(submit('ok'))) as { text: string }).toEqual({ text: 'ok' })

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await ui.press({ key: 'toggle' })
  await ui.unmount()
  expect((await $.prompt.submit(submit(LONG))) as { text: string }).toEqual({ text: LONG })
})

test('se o modelo falhar, o prompt original é enviado', async ($, on) => {
  on('model.complete', () => ({
    value: { isAnswered: false, reason: 'empty-reply', usage: USAGE },
  }))
  on('prompt.submit', (_, e) => ({ text: e.text }))
  on('ui.toast', () => ({ value: undefined }))

  expect((await $.prompt.submit(submit(LONG))) as { text: string }).toEqual({ text: LONG })
})
