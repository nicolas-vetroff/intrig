// Feedback inbox helper. The target address comes from
// NEXT_PUBLIC_FEEDBACK_EMAIL so the client bundle can read it — the
// link opens the user's mail client, we never send anything server-side.
// Returns null when the env var is unset so callers can hide the link
// entirely instead of rendering a broken mailto:.
export function getFeedbackMailto(): string | null {
  const email = process.env.NEXT_PUBLIC_FEEDBACK_EMAIL
  if (!email) return null
  return `mailto:${email}?subject=${encodeURIComponent('[FEEDBACK]')}`
}
