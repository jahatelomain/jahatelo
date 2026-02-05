type WhatsappSendResult = {
  success: boolean;
  error?: string;
};

export async function sendWhatsappOtp(phone: string, code: string): Promise<WhatsappSendResult> {
  const accessToken = process.env.META_WA_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;
  const templateName = process.env.META_WA_TEMPLATE_NAME;
  const templateLang = process.env.META_WA_TEMPLATE_LANG || 'es';

  if (!accessToken || !phoneNumberId || !templateName) {
    return { success: false, error: 'WhatsApp no configurado' };
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: templateLang },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: code }],
        },
      ],
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return { success: false, error: errorBody || 'Error enviando WhatsApp' };
  }

  return { success: true };
}
