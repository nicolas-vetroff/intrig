'use server'

export type WaitlistResult = {
  success: boolean
  message: string
}

// TODO: remplacer par l'implementation avec validation Zod + insert Drizzle
// (tache 7). Stub UI-only pour l'instant.
export async function joinWaitlist(
  _prevState: WaitlistResult | null,
  _formData: FormData,
): Promise<WaitlistResult> {
  return {
    success: false,
    message: 'Inscription indisponible pour le moment.',
  }
}
