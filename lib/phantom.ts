// lib/phantom.ts
export function getPhantomProvider() {
  if (typeof window === "undefined") return undefined
  const anyWindow = window as any
  if ("phantom" in anyWindow && anyWindow.phantom?.solana?.isPhantom) {
    return anyWindow.phantom.solana
  }
  if (anyWindow.solana?.isPhantom) {
    return anyWindow.solana
  }
  return undefined
}

export async function connectPhantom() {
  const provider = getPhantomProvider()
  if (!provider) throw new Error("Phantom wallet not found. Please install the Phantom extension.")
  const resp = await provider.connect()
  return resp.publicKey.toString()
}

export async function disconnectPhantom() {
  const provider = getPhantomProvider()
  if (!provider) return
  try { await provider.disconnect() } catch { /* ignore */ }
}
