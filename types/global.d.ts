// types/global.d.ts
export {}

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean
      publicKey?: { toString(): string }
      connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } }>
      disconnect: () => Promise<void>
      on: (event: string, handler: (...args: any[]) => void) => void
      request?: (args: { method: string; params?: any }) => Promise<any>
    }
  }
}
