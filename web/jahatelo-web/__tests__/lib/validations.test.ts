import {
  LoginSchema,
  RegisterSchema,
  ReviewSchema,
  MotelSchema,
} from '@/lib/validations/schemas';

describe('Validation Schemas', () => {
  describe('LoginSchema', () => {
    it('should validate correct email and password', () => {
      const valid = {
        email: 'test@example.com',
        password: 'Test1234',
      };
      expect(() => LoginSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalid = {
        email: 'not-an-email',
        password: 'Test1234',
      };
      expect(() => LoginSchema.parse(invalid)).toThrow();
    });

    it('should reject empty password', () => {
      const invalid = {
        email: 'test@example.com',
        password: '',
      };
      expect(() => LoginSchema.parse(invalid)).toThrow();
    });
  });

  describe('RegisterSchema', () => {
    it('should validate strong password', () => {
      const valid = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongPass123',
      };
      expect(() => RegisterSchema.parse(valid)).not.toThrow();
    });

    it('should reject password without uppercase', () => {
      const invalid = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weakpass123',
      };
      expect(() => RegisterSchema.parse(invalid)).toThrow('mayúscula');
    });

    it('should reject password without lowercase', () => {
      const invalid = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'WEAKPASS123',
      };
      expect(() => RegisterSchema.parse(invalid)).toThrow('minúscula');
    });

    it('should reject password without number', () => {
      const invalid = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'WeakPassword',
      };
      expect(() => RegisterSchema.parse(invalid)).toThrow('número');
    });

    it('should reject short password', () => {
      const invalid = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Pass1',
      };
      expect(() => RegisterSchema.parse(invalid)).toThrow('mínimo 8');
    });

    it('should validate optional phone', () => {
      const valid = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongPass123',
        phone: '+595981234567',
      };
      expect(() => RegisterSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid phone format', () => {
      const invalid = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongPass123',
        phone: '123',
      };
      expect(() => RegisterSchema.parse(invalid)).toThrow('inválido');
    });
  });

  describe('ReviewSchema', () => {
    it('should validate review with rating and comment', () => {
      const valid = {
        motelId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 5,
        comment: 'Excelente lugar, muy recomendado para pasar el rato',
      };
      expect(() => ReviewSchema.parse(valid)).not.toThrow();
    });

    it('should reject rating below 1', () => {
      const invalid = {
        motelId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 0,
        comment: 'Mal servicio',
      };
      expect(() => ReviewSchema.parse(invalid)).toThrow();
    });

    it('should reject rating above 5', () => {
      const invalid = {
        motelId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 6,
        comment: 'Muy bueno',
      };
      expect(() => ReviewSchema.parse(invalid)).toThrow();
    });

    it('should reject short comment', () => {
      const invalid = {
        motelId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 5,
        comment: 'Bueno',
      };
      expect(() => ReviewSchema.parse(invalid)).toThrow('muy corto');
    });

    it('should reject invalid motelId', () => {
      const invalid = {
        motelId: 'not-a-uuid',
        rating: 5,
        comment: 'Excelente lugar para visitar',
      };
      expect(() => ReviewSchema.parse(invalid)).toThrow('inválido');
    });
  });

  describe('MotelSchema', () => {
    it('should validate motel with all fields', () => {
      const valid = {
        name: 'Motel Test',
        description: 'Un motel de prueba',
        city: 'Asunción',
        address: 'Calle Principal 123',
        phone: '+595981234567',
      };
      expect(() => MotelSchema.parse(valid)).not.toThrow();
    });

    it('should accept optional fields as null', () => {
      const valid = {
        name: 'Motel Test',
        phone: null,
        website: null,
      };
      expect(() => MotelSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid phone format', () => {
      const invalid = {
        name: 'Motel Test',
        phone: '123',
      };
      expect(() => MotelSchema.parse(invalid)).toThrow('inválido');
    });

    it('should reject invalid website URL', () => {
      const invalid = {
        name: 'Motel Test',
        website: 'not-a-url',
      };
      expect(() => MotelSchema.parse(invalid)).toThrow();
    });

    it('should validate latitude range', () => {
      const valid = {
        name: 'Motel Test',
        latitude: -25.2637,
        longitude: -57.5759,
      };
      expect(() => MotelSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid latitude', () => {
      const invalid = {
        name: 'Motel Test',
        latitude: 100, // > 90
      };
      expect(() => MotelSchema.parse(invalid)).toThrow();
    });
  });
});
