// Transactional emails via the Resend API (separate from Supabase auth emails).
// No-ops gracefully if RESEND_API_KEY is not configured, so application status
// changes never fail just because email isn't set up.

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const FROM = 'nexdevp <crm@nexdevp.com>'

type Decision = 'accepted' | 'rejected'

const SUBJECTS: Record<Decision, string> = {
  accepted: '¡Felicitaciones! Fuiste seleccionado en nexdevp',
  rejected: 'Actualización de tu postulación en nexdevp',
}

function buildHtml(name: string, decision: Decision): string {
  const greeting = `Hola ${name},`
  const body =
    decision === 'accepted'
      ? `¡Tenemos excelentes noticias! Fuiste <strong>seleccionado</strong> para sumarte al equipo de nexdevp.
         Ya activamos tu acceso: ingresá con tu cuenta para empezar.`
      : `Gracias por postularte a nexdevp y por el tiempo que dedicaste al proceso.
         En esta oportunidad <strong>no avanzamos</strong> con tu candidatura, pero guardamos tu perfil para futuras búsquedas.`

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; background:#0a0a0a; color:#e8e8e8; padding:32px; border-radius:12px; max-width:520px; margin:0 auto;">
      <h1 style="color:#22b561; font-size:20px; margin:0 0 16px;">nexdevp</h1>
      <p style="font-size:15px; line-height:1.6;">${greeting}</p>
      <p style="font-size:15px; line-height:1.6;">${body}</p>
      <p style="font-size:13px; color:#8a8c8b; margin-top:24px;">— El equipo de nexdevp</p>
    </div>
  `
}

export async function sendApplicantDecisionEmail(
  to: string,
  name: string,
  decision: Decision
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping applicant decision email.')
    return
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to,
        subject: SUBJECTS[decision],
        html: buildHtml(name || 'candidato/a', decision),
      }),
    })
    if (!res.ok) {
      console.error('Resend email failed:', res.status, await res.text())
    }
  } catch (err) {
    // Never let email failure break the status change.
    console.error('Resend email error:', err)
  }
}
