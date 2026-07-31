import { UpdateMotelSchema } from '../schemas';

describe('motel phone validation', () => {
  it('accepts formatted Paraguayan phone and WhatsApp values', () => {
    expect(UpdateMotelSchema.safeParse({
      phone: '+595 994 473502',
      whatsapp: '+595 994 473502',
    }).success).toBe(true);
  });

  it('still rejects values without enough digits', () => {
    expect(UpdateMotelSchema.safeParse({ phone: '+595 12' }).success).toBe(false);
  });
});
