type TwilioWaSendResult = { ok: boolean; error?: string };

const getEnv = (key: string) => (process.env[key] || '').trim();

/**
 * Envía un template de autenticación (OTP) por WhatsApp usando Twilio Content API.
 * Requiere:
 * - TWILIO_ACCOUNT_SID: SID de la cuenta Twilio (puede ser turismopy)
 * - TWILIO_AUTH_TOKEN: Auth Token correspondiente
 * - TWILIO_WHATSAPP_FROM: Número remitente en formato whatsapp:+14155238886
 * - TWILIO_WA_AUTH_TEMPLATE_SID: SID del template de autenticación aprobado en Meta/Twilio
 */
export async function sendWhatsappOtp(phone: string, code: string): Promise<TwilioWaSendResult> {
  const accountSid = getEnv('TWILIO_ACCOUNT_SID');
  const authToken = getEnv('TWILIO_AUTH_TOKEN');
  const fromNumber = getEnv('TWILIO_WHATSAPP_FROM');
  const templateSid = getEnv('TWILIO_WA_AUTH_TEMPLATE_SID');

  if (!accountSid || !authToken) {
    return { ok: false, error: 'Twilio credentials not configured' };
  }
  if (!fromNumber) {
    return { ok: false, error: 'TWILIO_WHATSAPP_FROM not configured' };
  }
  if (!templateSid) {
    return { ok: false, error: 'TWILIO_WA_AUTH_TEMPLATE_SID not configured' };
  }

  // Normalizar teléfono a E.164 con prefijo whatsapp:
  const phoneE164 = phone.startsWith('+') ? phone : `+${phone}`;
  const to = `whatsapp:${phoneE164}`;

  try {
    const body = new URLSearchParams({
      To: to,
      From: fromNumber,
      ContentSid: templateSid,
      ContentVariables: JSON.stringify({ 1: code }),
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const detail =
        typeof data?.message === 'string'
          ? data.message
          : `Twilio HTTP ${response.status}`;
      return { ok: false, error: detail };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Error sending WhatsApp OTP via Twilio',
    };
  }
}