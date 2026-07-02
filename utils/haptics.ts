// Feedback tatil leve (Android/PWA). No-op onde nao houver suporte (ex.: iOS Safari).
export function haptic(pattern: number | number[] = 8) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(pattern) } catch { /* sem suporte */ }
  }
}
