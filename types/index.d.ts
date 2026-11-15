export type PromptMasterFlag = boolean

declare module 'claude-code' {
  interface PluginState {
    'prompt-master': { isOn: PromptMasterFlag; isBusy: PromptMasterFlag }
  }
}
