import { z } from 'zod';

// ============================================
// AUTENTICACIÓN
// ============================================

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre muy largo'),
  email: z.string().email('Email inválido').max(255),
  password: z.string()
    .min(8, 'Contraseña debe tener mínimo 8 caracteres')
    .max(100, 'Contraseña muy larga')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  telefono: z.string().regex(/^\+?[0-9]{9,15}$/, 'Teléfono inválido').optional(),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/, 'Teléfono inválido').optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

// ============================================
// MOTELES
// ============================================

export const MotelSchema = z.object({
  name: z.string().min(3, 'Nombre muy corto').max(100, 'Nombre muy largo').optional(),
  description: z.string().max(2000, 'Descripción muy larga').optional().nullable(),
  city: z.string().min(2).max(100).optional(),
  neighborhood: z.string().min(2).max(100).optional(),
  address: z.string().min(10, 'Dirección muy corta').max(200, 'Dirección muy larga').optional(),
  country: z.string().min(2).max(100).optional().nullable(),
  mapUrl: z.string().url('URL inválida').optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/, 'Teléfono inválido').optional().nullable(),
  whatsapp: z.string().regex(/^\+?[0-9]{9,15}$/, 'WhatsApp inválido').optional().nullable(),
  website: z.string().url('URL inválida').optional().nullable(),
  instagram: z.string().optional().nullable(),
  featuredPhoto: z.string().url('URL de imagen inválida').optional().nullable(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  isActive: z.boolean().optional(),
  contactName: z.string().min(2).max(100).optional().nullable(),
  contactEmail: z.string().email('Email inválido').max(255).optional().nullable(),
  contactPhone: z.string().regex(/^\+?[0-9]{9,15}$/, 'Teléfono inválido').optional().nullable(),
  adminContactName: z.string().min(2).max(100).optional().nullable(),
  adminContactEmail: z.string().email('Email inválido').max(255).optional().nullable(),
  adminContactPhone: z.string().regex(/^\+?[0-9]{9,15}$/, 'Teléfono inválido').optional().nullable(),
  operationsContactName: z.string().min(2).max(100).optional().nullable(),
  operationsContactEmail: z.string().email('Email inválido').max(255).optional().nullable(),
  operationsContactPhone: z.string().regex(/^\+?[0-9]{9,15}$/, 'Teléfono inválido').optional().nullable(),
  plan: z.enum(['BASIC', 'PREMIUM', 'PLATINUM']).optional(),
  nextBillingAt: z.string().datetime('Fecha inválida').optional().nullable(),
  isFeatured: z.boolean().optional(),
});

export const UpdateMotelSchema = MotelSchema.partial();

export const MotelRegisterSchema = z.object({
  nombre: z.string().min(3).max(100),
  direccion: z.string().min(10).max(200),
  ciudad: z.string().min(2).max(100),
  telefono: z.string().regex(/^\+?[0-9]{9,15}$/),
  email: z.string().email().max(255),
  contactName: z.string().min(2).max(100),
  message: z.string().max(1000).optional(),
});

// ============================================
// HABITACIONES
// ============================================

export const RoomSchema = z.object({
  motelId: z.string().uuid('ID de motel inválido'),
  nombre: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre muy largo'),
  descripcion: z.string().max(500, 'Descripción muy larga').optional().nullable(),
  precio30min: z.number().min(0, 'Precio debe ser positivo').optional().nullable(),
  precio1h: z.number().min(0, 'Precio debe ser positivo').optional().nullable(),
  precio2h: z.number().min(0, 'Precio debe ser positivo').optional().nullable(),
  precio3h: z.number().min(0, 'Precio debe ser positivo').optional().nullable(),
  precio6h: z.number().min(0, 'Precio debe ser positivo').optional().nullable(),
  precio12h: z.number().min(0, 'Precio debe ser positivo').optional().nullable(),
  precio24h: z.number().min(0, 'Precio debe ser positivo').optional().nullable(),
  capacidad: z.number().int().min(1, 'Capacidad debe ser mínimo 1').optional(),
});

export const UpdateRoomSchema = RoomSchema.partial().omit({ motelId: true });

// ============================================
// RESEÑAS
// ============================================

export const ReviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating mínimo 1').max(5, 'Rating máximo 5'),
  comment: z.string().min(10, 'Comentario muy corto').max(500, 'Comentario muy largo').optional().nullable(),
  motelId: z.string().uuid('ID de motel inválido'),
});

// ============================================
// PROMOS
// ============================================

export const PromoSchema = z.object({
  motelId: z.string().uuid('ID de motel inválido'),
  title: z.string().min(3, 'Título muy corto').max(100, 'Título muy largo'),
  description: z.string().max(500, 'Descripción muy larga').optional().nullable(),
  imageUrl: z.string().url('URL de imagen inválida').optional().nullable(),
  validFrom: z.string().datetime('Fecha de inicio inválida').optional().nullable(),
  validUntil: z.string().datetime('Fecha de fin inválida').optional().nullable(),
  isActive: z.boolean().optional(),
  isGlobal: z.boolean().optional(),
});

export const UpdatePromoSchema = PromoSchema.partial().omit({ motelId: true });

// ============================================
// CONTACTO
// ============================================

export const ContactSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre muy largo'),
  email: z.string().email('Email inválido'),
  telefono: z.string().regex(/^\+?[0-9]{9,15}$/, 'Teléfono inválido').optional(),
  message: z.string().min(10, 'Mensaje muy corto').max(1000, 'Mensaje muy largo'),
});

// ============================================
// NOTIFICACIONES
// ============================================

export const NotificationSchema = z.object({
  title: z.string().min(1, 'Título requerido').max(65, 'Título muy largo'),
  body: z.string().min(1, 'Contenido requerido').max(240, 'Contenido muy largo'),
  category: z.enum(['advertising', 'security', 'maintenance']),
  sendNow: z.boolean(),
  scheduledFor: z.string().datetime('Fecha de envío inválida').optional().nullable(),
  targetRole: z.enum(['USER', 'MOTEL_ADMIN', 'SUPERADMIN']).optional().nullable(),
  targetMotelId: z.string().uuid('ID de motel inválido').optional().nullable(),
});

// ============================================
// ANUNCIOS/BANNERS
// ============================================

export const AdvertisementSchema = z.object({
  title: z.string().min(3, 'Título muy corto').max(100, 'Título muy largo'),
  advertiser: z.string().min(2, 'Anunciante muy corto').max(100, 'Anunciante muy largo'),
  imageUrl: z.string().url('URL de imagen inválida'),
  largeImageUrl: z.string().url('URL de imagen grande inválida').optional().nullable(),
  description: z.string().max(500, 'Descripción muy larga').optional().nullable(),
  linkUrl: z.string().url('URL de enlace inválida').optional().nullable(),
  placement: z.enum(['POPUP_HOME', 'CAROUSEL', 'SECTION_BANNER', 'LIST_INLINE']),
  status: z.enum(['ACTIVE', 'PAUSED', 'INACTIVE']),
  priority: z.number().int().min(0, 'Prioridad mínima 0').max(100, 'Prioridad máxima 100'),
  startDate: z.string().datetime('Fecha de inicio inválida').optional().nullable(),
  endDate: z.string().datetime('Fecha de fin inválida').optional().nullable(),
  maxViews: z.number().int().positive('Vistas deben ser positivas').optional().nullable(),
  maxClicks: z.number().int().positive('Clicks deben ser positivos').optional().nullable(),
});

export const UpdateAdvertisementSchema = AdvertisementSchema.partial();

export const TrackAdvertisementSchema = z.object({
  advertisementId: z.string().uuid('ID de anuncio inválido'),
  eventType: z.enum(['VIEW', 'CLICK']),
});

// ============================================
// USUARIOS
// ============================================

export const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string()
    .min(8, 'Contraseña debe tener mínimo 8 caracteres')
    .max(100, 'Contraseña muy larga')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  role: z.enum(['USER', 'MOTEL_ADMIN', 'SUPERADMIN']),
  telefono: z.string().regex(/^\+?[0-9]{9,15}$/).optional().nullable(),
  motelId: z.string().uuid().optional().nullable(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().max(255).optional(),
  password: z.string()
    .min(8)
    .max(100)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .optional(),
  role: z.enum(['USER', 'MOTEL_ADMIN', 'SUPERADMIN']).optional(),
  telefono: z.string().regex(/^\+?[0-9]{9,15}$/).optional().nullable(),
  isActive: z.boolean().optional(),
});

// ============================================
// PUSH TOKENS
// ============================================

export const PushTokenSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  deviceId: z.string().optional().nullable(),
  platform: z.enum(['ios', 'android', 'web']).optional().nullable(),
});

// ============================================
// PREFERENCIAS DE NOTIFICACIONES
// ============================================

export const NotificationPreferencesSchema = z.object({
  advertising: z.boolean().optional(),
  security: z.boolean().optional(),
  maintenance: z.boolean().optional(),
});

// ============================================
// AMENIDADES
// ============================================

export const AmenitySchema = z.object({
  name: z.string().min(2).max(100),
  icon: z.string().min(1).max(50),
  category: z.string().min(2).max(50).optional().nullable(),
});

export const UpdateAmenitySchema = AmenitySchema.partial();

// ============================================
// PROSPECTOS
// ============================================

export const ProspectSchema = z.object({
  nombre: z.string().min(3).max(100),
  telefono: z.string().regex(/^\+?[0-9]{9,15}$/),
  email: z.string().email().optional().nullable(),
  ciudad: z.string().min(2).max(100).optional().nullable(),
  direccion: z.string().max(200).optional().nullable(),
  notas: z.string().max(1000).optional().nullable(),
  channel: z.enum(['web', 'phone', 'email', 'social', 'referral', 'other']).optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'rejected']).optional(),
  manuallyCreated: z.boolean().optional(),
});

export const UpdateProspectSchema = ProspectSchema.partial();

// ============================================
// BÚSQUEDA
// ============================================

export const SearchSchema = z.object({
  query: z.string().min(1).max(200).optional(),
  ciudad: z.string().max(100).optional(),
  precioMin: z.number().min(0).optional(),
  precioMax: z.number().min(0).optional(),
  amenidades: z.array(z.string().uuid()).optional(),
  plan: z.enum(['FREE', 'BASIC', 'PREMIUM', 'PLATINUM']).optional(),
});

// ============================================
// COORDENADAS (GEOCODING)
// ============================================

export const CoordinatesSchema = z.object({
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
  radius: z.number().min(0).max(100).optional(), // km
});

// ============================================
// FINANCIERO/PAGOS
// ============================================

export const PaymentSchema = z.object({
  motelId: z.string().uuid(),
  amount: z.number().positive('Monto debe ser positivo'),
  currency: z.string().length(3).default('PYG'),
  method: z.enum(['cash', 'transfer', 'card', 'mercadopago']),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
  description: z.string().max(500).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

export const UpdatePaymentSchema = PaymentSchema.partial().omit({ motelId: true });
