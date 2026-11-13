/** Short vibration on tap where the browser supports it — a phone-only affordance, never required. */
export function haptic(ms = 8) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(ms);
  } catch {
    /* purely optional polish */
  }
}
