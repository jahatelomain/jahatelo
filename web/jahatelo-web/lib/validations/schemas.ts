import { z } from 'zod';

export const IdSchema = z.string().min(1, 'ID inválido');

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);
const trimString = (value: unknown) => (typeof value === 'string' ? value.trim() : value);

const UploadOrUrlSchema = z.preprocess(
  trimString,
  z.string().refine(
    (value) => value.startsWith('/uploads/') || z.string().url().safeParse(value).success,
    'URL de imagen inválida'
  )
);

const UploadOrUrlOptionalSchema = z.preprocess(
  (value) => emptyToUndefined(trimString(value)),
  UploadOrUrlSchema.optional().nullable()
);

const UrlOptionalSchema = z.preprocess(
  (value) => emptyToUndefined(trimString(value)),
  z.string().url('URL inválida').optional().nullable()
);

// ============================================
// AUTENTICACIÓN
// ============================================

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre muy largo').optional(),
  email: z.string().email('Email inválido').max(255),
  password: z.string()
    .min(6, 'Contraseña debe tener mínimo 6 caracteres')
    .max(100, 'Contraseña muy larga'),
  telefono: z.string().regex(/^\+?[0-9]{9,15}$/, 'Teléfono inválido').optional(),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/, 'Teléfono inválido').optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

const LoosePhoneSchema = z
  .string()
  .max(50, 'Teléfono muy largo')
  .refine((value) => {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 9 && digits.length <= 15;
  }, 'Teléfono inválido');

export const WhatsappOtpRequestSchema = z.object({
  phone: LoosePhoneSchema,
});

export const WhatsappOtpVerifySchema = z.object({
  phone: LoosePhoneSchema,
  code: z.string().regex(/^[0-9]{6}$/, 'Código inválido'),
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
  featuredPhoto: z
    .string()
    .refine(
      (value) => value.startsWith('/uploads/') || z.string().url().safeParse(value).success,
      'URL de imagen inválida'
    )
    .optional()
    .nullable(),
  featuredPhotoWeb: z
    .string()
    .refine(
      (value) => value.startsWith('/uploads/') || z.string().url().safeParse(value).success,
      'URL de imagen inválida'
    )
    .optional()
    .nullable(),
  featuredPhotoApp: z
    .string()
    .refine(
      (value) => value.startsWith('/uploads/') || z.string().url().safeParse(value).success,
      'URL de imagen inválida'
    )
    .optional()
    .nullable(),
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
  plan: z.enum(['FREE', 'BASIC', 'GOLD', 'DIAMOND']).optional(),
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

export const PublicMotelRegisterSchema = z.object({
  name: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  neighborhood: z.string().min(2).max(100),
  address: z.string().min(10).max(200),
  contactName: z.string().min(2).max(100).optional().nullable(),
  contactEmail: z.string().email().max(255).optional().nullable(),
  contactPhone: z.string().max(50).optional().nullable(),
});

// ============================================
// HABITACIONES
// ============================================

export const RoomSchema = z.object({
  motelId: IdSchema,
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

export const RoomAdminSchema = z.object({
  motelId: IdSchema,
  name: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre muy largo'),
  description: z.string().max(1000, 'Descripción muy larga').optional().nullable(),
  basePrice: z.coerce.number().int().min(0).optional().nullable(),
  priceLabel: z.string().max(50).optional().nullable(),
  price1h: z.coerce.number().int().min(0).optional().nullable(),
  price1_5h: z.coerce.number().int().min(0).optional().nullable(),
  price2h: z.coerce.number().int().min(0).optional().nullable(),
  price3h: z.coerce.number().int().min(0).optional().nullable(),
  price12h: z.coerce.number().int().min(0).optional().nullable(),
  price24h: z.coerce.number().int().min(0).optional().nullable(),
  priceNight: z.coerce.number().int().min(0).optional().nullable(),
  maxPersons: z.coerce.number().int().min(1).optional().nullable(),
  hasJacuzzi: z.boolean().optional(),
  hasPrivateGarage: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  amenityIds: z.array(IdSchema).optional().nullable(),
});

export const UpdateRoomAdminSchema = RoomAdminSchema.partial().omit({ motelId: true });

// ============================================
// RESEÑAS
// ============================================

export const ReviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating mínimo 1').max(5, 'Rating máximo 5'),
  comment: z.string().min(10, 'Comentario muy corto').max(500, 'Comentario muy largo').optional().nullable(),
  motelId: IdSchema,
});

// ============================================
// PROMOS
// ============================================

export const PromoSchema = z.object({
  motelId: IdSchema,
  title: z.string().min(3, 'Título muy corto').max(100, 'Título muy largo'),
  description: z.string().max(500, 'Descripción muy larga').optional().nullable(),
  imageUrl: UploadOrUrlOptionalSchema,
  validFrom: z.preprocess(
    (value) => {
      const cleaned = emptyToUndefined(value);
      if (typeof cleaned !== 'string') return cleaned;
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
        return `${cleaned}T00:00:00Z`;
      }
      return cleaned;
    },
    z.string().datetime('Fecha de inicio inválida').optional().nullable()
  ),
  validUntil: z.preprocess(
    (value) => {
      const cleaned = emptyToUndefined(value);
      if (typeof cleaned !== 'string') return cleaned;
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
        return `${cleaned}T00:00:00Z`;
      }
      return cleaned;
    },
    z.string().datetime('Fecha de fin inválida').optional().nullable()
  ),
  isActive: z.boolean().optional(),
  isGlobal: z.boolean().optional(),
});

export const UpdatePromoSchema = PromoSchema.partial().omit({ motelId: true });

export const PromoQuerySchema = z.object({
  motelId: IdSchema.optional(),
  search: z.string().max(100).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  type: z.enum(['GLOBAL', 'SPECIFIC']).optional(),
});

// ============================================
// CONTACTO
// ============================================

export const ContactSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre muy largo'),
  email: z.string().email('Email inválido'),
  telefono: z.string().regex(/^\+?[0-9]{9,15}$/, 'Teléfono inválido').optional(),
  message: z.string().min(10, 'Mensaje muy corto').max(1000, 'Mensaje muy largo'),
});

export const ContactMessageSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre muy largo'),
  phone: z.string().max(50, 'Teléfono muy largo').optional().nullable(),
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
  targetMotelId: IdSchema.optional().nullable(),
});

// ============================================
// ANUNCIOS/BANNERS
// ============================================

export const AdvertisementSchema = z.object({
  title: z.string().min(3, 'Título muy corto').max(100, 'Título muy largo'),
  advertiser: z.string().min(2, 'Anunciante muy corto').max(100, 'Anunciante muy largo'),
  imageUrl: UploadOrUrlSchema,
  largeImageUrl: UploadOrUrlOptionalSchema,
  largeImageUrlWeb: UploadOrUrlOptionalSchema,
  largeImageUrlApp: UploadOrUrlOptionalSchema,
  description: z.string().max(500, 'Descripción muy larga').optional().nullable(),
  linkUrl: UrlOptionalSchema,
  placement: z.enum(['POPUP_HOME', 'CAROUSEL', 'LIST_INLINE']),
  status: z.enum(['ACTIVE', 'PAUSED', 'INACTIVE']),
  priority: z.number().int().min(0, 'Prioridad mínima 0').max(100, 'Prioridad máxima 100'),
  startDate: z.string().datetime('Fecha de inicio inválida').optional().nullable(),
  endDate: z.string().datetime('Fecha de fin inválida').optional().nullable(),
  maxViews: z.number().int().positive('Vistas deben ser positivas').optional().nullable(),
  maxClicks: z.number().int().positive('Clicks deben ser positivos').optional().nullable(),
});

export const UpdateAdvertisementSchema = AdvertisementSchema.partial().extend({
  imageUrl: UploadOrUrlOptionalSchema,
});

export const AdvertisementAdminUpdateSchema = UpdateAdvertisementSchema.extend({
  viewCount: z.number().int().min(0, 'Vistas inválidas').optional(),
  clickCount: z.number().int().min(0, 'Clicks inválidos').optional(),
});

export const AdvertisementQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'INACTIVE']).optional(),
  placement: z.enum(['POPUP_HOME', 'CAROUSEL', 'LIST_INLINE']).optional(),
});

export const PublicAdvertisementQuerySchema = z.object({
  placement: z.enum(['POPUP_HOME', 'CAROUSEL', 'LIST_INLINE']),
});

export const TrackAdvertisementSchema = z.object({
  advertisementId: IdSchema,
  eventType: z.enum(['VIEW', 'CLICK']),
});

export const AdvertisementTrackSchema = TrackAdvertisementSchema.extend({
  deviceType: z.string().max(50).optional().nullable(),
  userCity: z.string().max(100).optional().nullable(),
  userCountry: z.string().max(100).optional().nullable(),
  source: z.string().max(50).optional().nullable(),
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
  motelId: IdSchema.optional().nullable(),
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

export const AdminUserQuerySchema = z.object({
  role: z.enum(['SUPERADMIN', 'MOTEL_ADMIN', 'USER']).optional(),
  module: z.string().max(50).optional(),
  search: z.string().max(100).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const AdminUserCreateSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(2).max(100),
  role: z.enum(['SUPERADMIN', 'MOTEL_ADMIN', 'USER']),
  motelId: IdSchema.optional().nullable(),
  password: z.string().min(8).max(100).optional(),
  modulePermissions: z.array(z.string().max(50)).optional(),
});

export const AdminUserUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(['SUPERADMIN', 'MOTEL_ADMIN', 'USER']).optional(),
  motelId: IdSchema.optional().nullable(),
  isActive: z.boolean().optional(),
  resetPassword: z.boolean().optional(),
  modulePermissions: z.array(z.string().max(50)).optional(),
});

// ============================================
// PUSH TOKENS
// ============================================

export const PushTokenSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  deviceId: z.string().optional().nullable(),
  platform: z.enum(['ios', 'android', 'web']).optional().nullable(),
});

export const PushTokenRegisterSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  userId: z.string().min(1).max(100).optional().nullable(),
  deviceId: z.string().max(100).optional().nullable(),
  deviceType: z.string().max(50).optional().nullable(),
  deviceName: z.string().max(100).optional().nullable(),
  appVersion: z.string().max(50).optional().nullable(),
});

export const PushTokenDeleteSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
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
  icon: z.string().min(1).max(50).optional().nullable(),
  type: z.enum(['MOTEL', 'ROOM', 'BOTH']).optional().nullable(),
  description: z.string().max(255).optional().nullable(),
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

export const PublicProspectSchema = z.object({
  contactName: z.string().min(2).max(100),
  phone: z.string().max(50),
  motelName: z.string().min(2).max(100),
  channel: z.enum(['WEB', 'APP', 'MANUAL']).optional(),
}).refine(
  (data) => data.phone.replace(/\D/g, '').length >= 7,
  { message: 'Teléfono inválido', path: ['phone'] }
);

export const AdminProspectCreateSchema = z.object({
  contactName: z.string().min(2).max(100),
  phone: z.string().max(50),
  motelName: z.string().min(2).max(100),
  channel: z.enum(['WEB', 'APP', 'MANUAL']).optional(),
  notes: z.string().max(1000).optional().nullable(),
});

export const AdminProspectUpdateSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'IN_NEGOTIATION', 'WON', 'LOST']).optional(),
  notes: z.string().max(1000).optional().nullable(),
  channel: z.enum(['WEB', 'APP', 'MANUAL']).optional(),
});

// ============================================
// BÚSQUEDA
// ============================================

export const SearchSchema = z.object({
  query: z.string().min(1).max(200).optional(),
  ciudad: z.string().max(100).optional(),
  precioMin: z.number().min(0).optional(),
  precioMax: z.number().min(0).optional(),
  amenidades: z.array(IdSchema).optional(),
  plan: z.enum(['FREE', 'BASIC', 'GOLD', 'DIAMOND']).optional(),
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
// ANALYTICS
// ============================================

export const AnalyticsTrackSchema = z.object({
  motelId: IdSchema,
  eventType: z.enum([
    'VIEW',
    'CLICK_PHONE',
    'CLICK_WHATSAPP',
    'CLICK_MAP',
    'CLICK_WEBSITE',
    'FAVORITE_ADD',
    'FAVORITE_REMOVE',
  ]),
  source: z.string().max(50).optional().nullable(),
  userCity: z.string().max(100).optional().nullable(),
  userCountry: z.string().max(100).optional().nullable(),
  deviceType: z.string().max(50).optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

// ============================================
// FINANCIERO/PAGOS
// ============================================

export const PaymentSchema = z.object({
  motelId: IdSchema,
  amount: z.number().positive('Monto debe ser positivo'),
  currency: z.string().length(3).default('PYG'),
  method: z.enum(['cash', 'transfer', 'card', 'mercadopago']),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
  description: z.string().max(500).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

export const UpdatePaymentSchema = PaymentSchema.partial().omit({ motelId: true });

export const FinancialUpdateSchema = z.object({
  billingDay: z.coerce.number().int().min(1).max(31).optional().nullable(),
  paymentType: z.enum(['DIRECT_DEBIT', 'TRANSFER', 'EXCHANGE']).optional().nullable(),
  financialStatus: z.enum(['ACTIVE', 'INACTIVE', 'DISABLED']).optional().nullable(),
  plan: z.enum(['FREE', 'BASIC', 'GOLD', 'DIAMOND']).optional().nullable(),
  billingCompanyName: z.string().max(150).optional().nullable(),
  billingTaxId: z.string().max(50).optional().nullable(),
  adminContactName: z.string().max(100).optional().nullable(),
  adminContactEmail: z.string().email().max(255).optional().nullable(),
  adminContactPhone: z.string().max(50).optional().nullable(),
});

export const FinancialPaymentCreateSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).optional().nullable(),
  paidAt: z.string().datetime().optional().nullable(),
  status: z.enum(['PAID', 'PENDING', 'FAILED', 'REFUNDED']).optional(),
  paymentType: z.enum(['DIRECT_DEBIT', 'TRANSFER', 'EXCHANGE']).optional().nullable(),
  reference: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

// ============================================
// ROOM PHOTOS
// ============================================

export const RoomPhotoSchema = z.object({
  roomTypeId: IdSchema,
  url: UploadOrUrlSchema,
  order: z.coerce.number().int().min(0).optional().nullable(),
});

export const UpdateRoomPhotoSchema = RoomPhotoSchema.partial().omit({ roomTypeId: true });

// ============================================
// SETTINGS
// ============================================

export const SettingsUpdateSchema = z
  .record(z.string(), z.unknown())
  .refine((value) => Object.keys(value).length > 0, { message: 'Sin configuraciones para actualizar' });

// ============================================
// INBOX
// ============================================

export const InboxUpdateSchema = z.object({
  isRead: z.boolean(),
});

// ============================================
// MENU
// ============================================

export const MenuCategorySchema = z.object({
  motelId: IdSchema,
  title: z.string().min(2).max(100),
  sortOrder: z.coerce.number().int().min(0).optional().nullable(),
});

export const UpdateMenuCategorySchema = MenuCategorySchema.partial().omit({ motelId: true });

export const MenuItemSchema = z.object({
  categoryId: IdSchema,
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().nullable(),
  price: z.coerce.number().int().min(0),
  photoUrl: UploadOrUrlOptionalSchema,
});

export const UpdateMenuItemSchema = MenuItemSchema.partial().omit({ categoryId: true });

// ============================================
// ADMIN ANALYTICS / AUDIT
// ============================================

export const AdminAnalyticsQuerySchema = z.object({
  period: z.coerce.number().int().min(1).max(365).optional(),
  motelId: IdSchema.optional(),
  source: z.string().max(50).optional(),
  deviceType: z.string().max(50).optional(),
  eventType: z.string().max(50).optional(),
});

export const MotelAnalyticsQuerySchema = z.object({
  period: z.coerce.number().int().min(1).max(365).optional(),
});

export const AdminAuditQuerySchema = z.object({
  action: z.string().max(50).optional(),
  entityType: z.string().max(50).optional(),
  userId: IdSchema.optional(),
  q: z.string().max(100).optional(),
});

export const AdvertisementAnalyticsQuerySchema = z.object({
  period: z.coerce.number().int().refine((value) => [7, 30, 90].includes(value), {
    message: 'Periodo inválido',
  }).optional(),
});

export const BulkIdsSchema = z.object({
  ids: z.array(IdSchema).min(1, 'Se requiere al menos un ID'),
});

export const BulkActivateSchema = BulkIdsSchema.extend({
  isActive: z.boolean(),
});

export const SearchSuggestionQuerySchema = z.object({
  q: z.string().min(2).max(100),
});

// ============================================
// MOBILE / PUBLIC QUERIES
// ============================================

export const MobileMotelsQuerySchema = z.object({
  search: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  neighborhood: z.string().max(100).optional(),
  amenity: z.string().max(100).optional(),
  featured: z.coerce.boolean().optional(),
  ids: z.string().max(500).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const MobileMotelSlugSchema = z.object({
  slug: z.string().min(1).max(200),
});

export const MobileReviewQuerySchema = z.object({
  motelId: IdSchema,
});

export const MobileProfileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional().nullable(),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/).optional().nullable(),
  profilePhoto: UploadOrUrlOptionalSchema,
  pushToken: z.string().max(200).optional().nullable(),
  deviceInfo: z.record(z.string(), z.any()).optional().nullable(),
});

export const MobileNotificationPreferencesSchema = z.object({
  enableNotifications: z.boolean().optional(),
  enableEmail: z.boolean().optional(),
  enablePush: z.boolean().optional(),
  enableAdvertisingPush: z.boolean().optional(),
  notifyNewPromos: z.boolean().optional(),
  notifyPriceDrops: z.boolean().optional(),
  notifyUpdates: z.boolean().optional(),
  notifyReviewReplies: z.boolean().optional(),
  notifyReviewLikes: z.boolean().optional(),
  notifyPromotions: z.boolean().optional(),
  notifyNewMotels: z.boolean().optional(),
});

export const UploadFormSchema = z.object({
  folder: z.string().max(100).optional().nullable(),
});

export const EmptySchema = z.object({});

export const AdminPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
