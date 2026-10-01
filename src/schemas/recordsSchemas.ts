// src/schemas/recordsSchemas.ts

import { z } from 'zod';

const ALLOWED_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

// --- Tipo documental ----------------------------------------------------------

export const documentTypeSchema = z.object({
  name: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  description: z
    .string()
    .max(500, 'Máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  isRequired: z.boolean(),
  requiresExpiration: z.boolean(),
  allowedMimeTypes: z
    .array(z.enum(ALLOWED_MIMES))
    .min(1, 'Selecciona al menos un tipo de archivo'),
});

export type DocumentTypeFormData = z.infer<typeof documentTypeSchema>;

// --- Carga de documento -------------------------------------------------------

export const uploadDocumentSchema = z.object({
  documentTypeId: z.string().min(1, 'Selecciona el tipo de documento'),
  expiresAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido (YYYY-MM-DD)')
    .optional()
    .or(z.literal('')),
});

export type UploadDocumentFormData = z.infer<typeof uploadDocumentSchema>;

// --- Actualizar contacto (self-service) --------------------------------------

export const updateContactSchema = z.object({
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()\\.]{7,20}$/, 'Formato de teléfono inválido')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(255, 'Máximo 255 caracteres')
    .optional()
    .or(z.literal('')),
});

export type UpdateContactFormData = z.infer<typeof updateContactSchema>;