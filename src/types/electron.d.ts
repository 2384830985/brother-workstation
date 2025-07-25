export interface IElectronAPI {
  shell: {
    openExternal: (url: string) => Promise<void>
    openPath: (path: string) => Promise<string>
    showItemInFolder: (fullPath: string) => void
    trashItem: (fullPath: string) => Promise<void>
  }

  clipboard: {
    readText: () => string
    writeText: (text: string) => void
    readHTML: () => string
    writeHTML: (markup: string) => void
    readImage: () => Electron.NativeImage
    writeImage: (image: Electron.NativeImage) => void
    clear: () => void
  }

  nativeImage: {
    createFromPath: (path: string) => Electron.NativeImage
    createFromDataURL: (dataURL: string) => Electron.NativeImage
  }

  dev: {
    getEnvironment: () => {
      nodeVersion: string
      electronVersion: string
      chromeVersion: string
      platform: string
      arch: string
      isDev: boolean
    }
    log: (...args: any[]) => void
    reportError: (error: Error) => void
  }
}

export interface IElectronIPC {
  on: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => Electron.IpcRenderer
  off: (channel: string, listener?: (...args: any[]) => void) => Electron.IpcRenderer
  send: (channel: string, ...args: any[]) => void
  invoke: (channel: string, ...args: any[]) => Promise<any>
  // 执行环境管理相关方法
  invoke(channel: 'run-install-script', scriptName: string): Promise<{ success: boolean }>
  invoke(channel: 'check-binary-exists', binaryName: string): Promise<boolean>
  invoke(channel: 'get-binary-version', binaryName: string): Promise<string>
  invoke(channel: 'set-default-runtime', runtime: string): Promise<{ success: boolean; runtime: string }>
  invoke(channel: 'open-bin-directory'): Promise<{ success: boolean }>
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
    ipcRenderer: IElectronIPC
  }
}
