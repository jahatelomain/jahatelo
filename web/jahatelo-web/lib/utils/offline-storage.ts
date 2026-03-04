/**
 * Manejo de almacenamiento offline usando localStorage (simple y compatible)
 * Para formularios de captura de moteles - VERSIÓN MEJORADA CON MÚLTIPLES BORRADORES
 */

const DRAFTS_KEY = 'jahatelo_motel_drafts'; // Cambio: ahora guardamos múltiples
const PENDING_SUBMISSIONS_KEY = 'jahatelo_pending_submissions';

export interface MotelDraft {
  // Metadata del borrador
  id: string; // ID único del borrador
  savedAt: string; // ISO timestamp

  // Datos básicos
  name: string;
  contactName: string;
  contactPosition: string;

  // Contacto
  phone: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  email: string;

  // Ubicación
  address: string;
  city: string;
  neighborhood: string;
  reference: string;
  googleMapsUrl: string;

  // Operación
  scheduleWeekdays: string;
  scheduleSaturday: string;
  scheduleSunday: string;
  is24Hours: boolean;

  // Descripción
  description: string;

  // Habitaciones
  rooms: RoomDraft[];

  // Promociones
  promos: PromoDraft[];

  // Plan
  plan: 'BASIC' | 'GOLD' | 'DIAMOND';

  // Pago
  paymentMethod: 'transfer' | 'card';
  paymentFrequency: 'monthly' | 'quarterly';
  ruc: string;
  businessName: string;
  fiscalAddress: string;
}

export interface RoomDraft {
  name: string;
  pricePerHour: string;
  additionalPrice: string;
  description: string;
  amenities: string[]; // Array de amenities seleccionados
  otherAmenity: string;
}

export interface PromoDraft {
  title: string;
  description: string;
  discount: string;
  validUntil: string;
  applicableDays: string;
}

export interface PendingSubmission {
  id: string;
  data: MotelDraft;
  createdAt: string;
  attempts: number;
  lastAttempt?: string;
}

/**
 * Genera un ID único para un borrador
 */
function generateDraftId(motelName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const safeName = motelName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .substring(0, 20);
  return `draft_${safeName}_${timestamp}_${random}`;
}

/**
 * Obtiene todos los borradores guardados
 */
export function getAllDrafts(): MotelDraft[] {
  try {
    const saved = localStorage.getItem(DRAFTS_KEY);
    if (!saved) return [];
    const drafts = JSON.parse(saved);
    // Ordenar por fecha de guardado (más reciente primero)
    return drafts.sort((a: MotelDraft, b: MotelDraft) =>
      new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
  } catch (error) {
    console.error('Error loading drafts:', error);
    return [];
  }
}

/**
 * Guarda un borrador del formulario (crea nuevo o actualiza existente)
 */
export function saveDraft(draft: Partial<MotelDraft>, draftId?: string): string {
  try {
    const drafts = getAllDrafts();
    const now = new Date().toISOString();

    // Si se proporciona un ID, actualizar el borrador existente
    if (draftId) {
      const index = drafts.findIndex(d => d.id === draftId);
      if (index !== -1) {
        drafts[index] = {
          ...drafts[index],
          ...draft,
          id: draftId,
          savedAt: now,
        } as MotelDraft;
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
        return draftId;
      }
    }

    // Crear nuevo borrador
    const newId = generateDraftId(draft.name || 'sin-nombre');
    const newDraft: MotelDraft = {
      ...draft,
      id: newId,
      savedAt: now,
    } as MotelDraft;

    drafts.push(newDraft);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    return newId;
  } catch (error) {
    console.error('Error saving draft:', error);
    throw error;
  }
}

/**
 * Recupera un borrador específico por su ID
 */
export function loadDraft(id: string): MotelDraft | null {
  try {
    const drafts = getAllDrafts();
    return drafts.find(d => d.id === id) || null;
  } catch (error) {
    console.error('Error loading draft:', error);
    return null;
  }
}

/**
 * Elimina un borrador específico
 */
export function deleteDraft(id: string): boolean {
  try {
    const drafts = getAllDrafts();
    const filtered = drafts.filter(d => d.id !== id);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting draft:', error);
    return false;
  }
}

/**
 * Elimina todos los borradores
 */
export function clearAllDrafts(): boolean {
  try {
    localStorage.removeItem(DRAFTS_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing drafts:', error);
    return false;
  }
}

/**
 * Verifica si hay borradores guardados
 */
export function hasDrafts(): boolean {
  return getAllDrafts().length > 0;
}

/**
 * Guarda un formulario en la cola de envíos pendientes (para cuando no hay internet)
 */
export function savePendingSubmission(data: MotelDraft): string {
  try {
    const pending = getPendingSubmissions();
    const id = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const submission: PendingSubmission = {
      id,
      data,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };

    pending.push(submission);
    localStorage.setItem(PENDING_SUBMISSIONS_KEY, JSON.stringify(pending));

    return id;
  } catch (error) {
    console.error('Error saving pending submission:', error);
    throw error;
  }
}

/**
 * Obtiene todas las submissions pendientes
 */
export function getPendingSubmissions(): PendingSubmission[] {
  try {
    const saved = localStorage.getItem(PENDING_SUBMISSIONS_KEY);
    if (!saved) return [];
    return JSON.parse(saved);
  } catch (error) {
    console.error('Error getting pending submissions:', error);
    return [];
  }
}

/**
 * Elimina una submission pendiente de la cola
 */
export function removePendingSubmission(id: string): boolean {
  try {
    const pending = getPendingSubmissions();
    const filtered = pending.filter((sub) => sub.id !== id);
    localStorage.setItem(PENDING_SUBMISSIONS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error removing pending submission:', error);
    return false;
  }
}

/**
 * Actualiza el contador de intentos de una submission
 */
export function incrementSubmissionAttempt(id: string): boolean {
  try {
    const pending = getPendingSubmissions();
    const submission = pending.find((sub) => sub.id === id);

    if (submission) {
      submission.attempts += 1;
      submission.lastAttempt = new Date().toISOString();
      localStorage.setItem(PENDING_SUBMISSIONS_KEY, JSON.stringify(pending));
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error incrementing submission attempt:', error);
    return false;
  }
}

/**
 * Verifica si hay conexión a internet
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Genera un template vacío de borrador
 */
export function createEmptyDraft(): Partial<MotelDraft> {
  return {
    name: '',
    contactName: '',
    contactPosition: '',
    phone: '',
    whatsapp: '',
    instagram: '',
    facebook: '',
    email: '',
    address: '',
    city: '',
    neighborhood: '',
    reference: '',
    googleMapsUrl: '',
    scheduleWeekdays: '',
    scheduleSaturday: '',
    scheduleSunday: '',
    is24Hours: false,
    description: '',
    rooms: [],
    promos: [],
    plan: 'BASIC',
    paymentMethod: 'transfer',
    paymentFrequency: 'monthly',
    ruc: '',
    businessName: '',
    fiscalAddress: '',
  };
}
