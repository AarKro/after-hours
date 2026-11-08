import type { ContactValues } from './validation'

/** Fake network latency so the "sending…" state is visible. */
const SIMULATED_LATENCY_MS = 900

/**
 * Sends the contact form. Simulated for now: there is no backend on GitHub Pages yet.
 * Swap the body for a real service (e.g. Web3Forms, Formspree) when one is chosen.
 */
export async function submitContactForm(values: ContactValues): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, SIMULATED_LATENCY_MS))
  if (import.meta.env.DEV) console.info('[contact] simulated submission', values)
}
