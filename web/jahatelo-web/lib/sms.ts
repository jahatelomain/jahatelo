import { SNSClient, PublishCommand, type MessageAttributeValue } from '@aws-sdk/client-sns';

type SmsSendResult = { ok: boolean; error?: string };

const getEnv = (key: string) => (process.env[key] || '').trim();


async function sendTwilioSms(phone: string, message: string): Promise<SmsSendResult> {
  const accountSid = getEnv('TWILIO_ACCOUNT_SID');
  const authToken = getEnv('TWILIO_AUTH_TOKEN');
  const fromNumber = getEnv('TWILIO_FROM_NUMBER');

  if (!accountSid || !authToken || !fromNumber) {
    return { ok: false, error: 'Twilio sin credenciales o número remitente configurado' };
  }

  const body = new URLSearchParams({
    To: phone,
    From: fromNumber,
    Body: message,
  });

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const detail = typeof data?.message === 'string' ? data.message : `Twilio HTTP ${response.status}`;
      return { ok: false, error: detail };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Error al enviar SMS con Twilio' };
  }
}

async function sendAwsSms(phone: string, message: string): Promise<SmsSendResult> {
  const region = getEnv('AWS_SNS_REGION') || getEnv('AWS_S3_REGION');
  const accessKeyId = getEnv('AWS_ACCESS_KEY_ID');
  const secretAccessKey = getEnv('AWS_SECRET_ACCESS_KEY');

  if (!region || !accessKeyId || !secretAccessKey) {
    return { ok: false, error: 'AWS SNS sin credenciales configuradas' };
  }

  const smsType = getEnv('AWS_SNS_SMS_TYPE') || 'Transactional';
  const senderId = getEnv('AWS_SNS_SENDER_ID');

  const client = new SNSClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  const messageAttributes: Record<string, MessageAttributeValue> = {
    'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: smsType },
  };
  if (senderId) {
    messageAttributes['AWS.SNS.SMS.SenderID'] = { DataType: 'String', StringValue: senderId };
  }

  try {
    await client.send(new PublishCommand({ PhoneNumber: phone, Message: message, MessageAttributes: messageAttributes }));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Error al enviar SMS' };
  }
}

export async function sendSms(phone: string, message: string): Promise<SmsSendResult> {
  const provider = getEnv('SMS_PROVIDER').toLowerCase();
  if (provider === 'twilio') return sendTwilioSms(phone, message);

  const twilioConfigured = getEnv('TWILIO_ACCOUNT_SID') && getEnv('TWILIO_AUTH_TOKEN') && getEnv('TWILIO_FROM_NUMBER');
  if (!provider && twilioConfigured) return sendTwilioSms(phone, message);

  return sendAwsSms(phone, message);
}

export async function sendSmsOtp(phone: string, code: string): Promise<SmsSendResult> {
  const message = `Tu código de verificación de Jahatelo es ${code}. No lo compartas con nadie.`;
  return sendSms(phone, message);
}
