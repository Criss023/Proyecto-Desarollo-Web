import { apiClient } from "./apiClient";

export interface EmployeeDocument {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  documentType: {
    id: string;
    name: string;
    requiresExpiration: boolean;
  };
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  expiresAt?: string;
  uploadedAt: string;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface RecordValidation {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  isComplete: boolean;
  requiredDocuments: {
    documentTypeId: string;
    documentTypeName: string;
    isPresent: boolean;
    isExpired: boolean;
    expiresAt?: string;
  }[];
  lastValidatedAt: string;
}

const MAX_SIZE_BYTES = 2 * 1024 * 1024;

// Firmas de magic bytes por tipo real de archivo
const MAGIC_SIGNATURES: { bytes: number[]; mask?: number[]; mime: string }[] = [
  { bytes: [0x25, 0x50, 0x44, 0x46], mime: "application/pdf" }, // %PDF
  { bytes: [0xff, 0xd8, 0xff], mime: "image/jpeg" }, // JPEG
  {
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    mime: "image/png",
  }, // PNG
  {
    bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
    mime: "application/msword",
  }, // DOC (OLE2)
  { bytes: [0x50, 0x4b, 0x03, 0x04], mime: "application/zip" }, // ZIP → puede ser DOCX
];

const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
  ".doc": ["application/msword"],
  ".docx": ["application/zip"], // DOCX es un ZIP internamente
};

function readFileHeader(file: File, bytes: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) =>
      resolve(new Uint8Array(e.target!.result as ArrayBuffer));
    reader.onerror = reject;
    reader.readAsArrayBuffer(file.slice(0, bytes));
  });
}

function detectMimeFromBytes(header: Uint8Array): string | null {
  for (const sig of MAGIC_SIGNATURES) {
    if (sig.bytes.every((b, i) => header[i] === b)) return sig.mime;
  }
  return null;
}

export function validateFileClient(file: File): string | null {
  if (file.size > MAX_SIZE_BYTES)
    return `El archivo excede 2 MB (tiene ${(file.size / 1024 / 1024).toFixed(1)} MB).`;

  const ext = ('.' + file.name.split('.').pop()!.toLowerCase());
  if (!Object.keys(ALLOWED_EXTENSIONS).includes(ext))
    return 'Extensión no permitida. Use PDF, JPEG, PNG, DOC o DOCX.';

  return null;
}

// Validación asíncrona con magic bytes (detecta extensión falsificada)
export async function validateFileMagic(file: File): Promise<string | null> {
  const ext = "." + file.name.split(".").pop()!.toLowerCase();
  const expectedMimes = ALLOWED_EXTENSIONS[ext];
  if (!expectedMimes) return "Extensión no permitida.";

  try {
    const header = await readFileHeader(file, 8);
    const detectedMime = detectMimeFromBytes(header);

    if (!detectedMime) return "No se pudo verificar el tipo real del archivo.";
    if (!expectedMimes.includes(detectedMime)) {
      return `El archivo no es realmente un ${ext.toUpperCase().slice(1)}. Parece ser otro tipo de archivo con la extensión cambiada.`;
    }
  } catch {
    // Si falla la lectura, dejamos pasar (el servidor validará)
  }
  return null;
}

export const employeeDocumentService = {
  list: async (employeeId: string) => {
    const res = await apiClient.get(
      `/api/v1/employees/${employeeId}/documents`,
    );
    return res.data.data;
  },

  upload: async (
    employeeId: string,
    file: File,
    documentTypeId: string,
    expiresAt?: string,
  ) => {
    const form = new FormData();
    form.append("file", file);
    form.append("documentTypeId", documentTypeId);
    if (expiresAt) form.append("expiresAt", expiresAt);
    const res = await apiClient.post(
      `/api/v1/employees/${employeeId}/documents`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data.data;
  },

  delete: async (documentId: string) => {
    await apiClient.delete(`/api/v1/employee-documents/${documentId}`);
  },

  download: async (documentId: string, fallbackFileName: string) => {
    const res = await apiClient.get(
      `/api/v1/employee-documents/${documentId}/download`,
      { responseType: "blob" },
    );
    const disposition: string = res.headers["content-disposition"] ?? "";
    const match = disposition.match(/filename[^;=\n]*=(['"]?)([^'"\n]*)\1/);
    const fileName = match?.[2] ?? fallbackFileName;
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  getValidation: async (employeeId: string) => {
    const res = await apiClient.get(
      `/api/v1/employees/${employeeId}/record-validation`,
    );
    return res.data.data;
  },

  syncValidation: async (employeeId: string) => {
    const res = await apiClient.post(
      `/api/v1/employees/${employeeId}/record-validation/sync`,
    );
    return res.data.data;
  },
};
