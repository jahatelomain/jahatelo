import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

type SmsSendResult = { ok: boolean; error?: string };

const getEnv = (key: string) => (process.env[key] || '').trim();

export async function sendSmsOtp(phone: string, code: string): Promise<SmsSendResult> {
  const region = getEnv('AWS_SNS_REGION') || getEnv('AWS_S3_REGION');
  const accessKeyId = getEnv('AWS_ACCESS_KEY_ID');
  const secretAccessKey = getEnv('AWS_SECRET_ACCESS_KEY');

  if (!region) {
    return { ok: false, error: 'AWS SNS sin región configurada' };
  }

  if (!accessKeyId || !secretAccessKey) {
    return { ok: false, error: 'AWS SNS sin credenciales configuradas' };
  }

  const smsType = getEnv('AWS_SNS_SMS_TYPE') || 'Transactional';
  const senderId = getEnv('AWS_SNS_SENDER_ID');
  const message = `Tu código de verificación es ${code}. No lo compartas con nadie.`;

  const client = new SNSClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  const messageAttributes: Record<string, any> = {
    'AWS.SNS.SMS.SMSType': {
      DataType: 'String',
      StringValue: smsType,
    },
  };

  if (senderId) {
    messageAttributes['AWS.SNS.SMS.SenderID'] = {
      DataType: 'String',
      StringValue: senderId,
    };
  }

  try {
    await client.send(
      new PublishCommand({
        PhoneNumber: phone,
        Message: message,
        MessageAttributes: messageAttributes,
      })
    );
    return { ok: true };
  } catch (error: any) {
    const errorDetail = error?.message || 'Error al enviar SMS';
    return { ok: false, error: errorDetail };
  }
}
