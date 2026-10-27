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
    recordStatus: string;
  };
  isComplete: boolean;
  totalRequired: number;
  uploadedRequired: number;
  missingRequired: number;
  requiredDocuments: {
    documentType: {
      id: string;
      code: string;
      name: string;
      isRequired: boolean;
      isActive: boolean;
    };
    uploaded: boolean;
    documentId?: string;
    originalName?: string;
    uploadedAt?: string;
    expiresAt?: string;
  }[];
  missingDocuments: {
    documentType: {
      id: string;
      code: string;
      name: string;
    };
    uploaded: boolean;
  }[];
  lastValidatedAt?: string;
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
}

export async function validateFileBlank(file: File): Promise<string | null> {
  const type = file.type;

  // PDF: leer como ArrayBuffer y buscar streams de contenido
  if (type === 'application/pdf') {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buf = e.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(buf);
        // Convertir a string buscando solo los marcadores clave
        let text = '';
        for (let i = 0; i < bytes.length; i++) {
          text += String.fromCharCode(bytes[i]);
        }
        // BT...ET = bloque de texto, /Image = imagen embebida
        const hasText   = text.includes('BT') && text.includes('ET');
        const hasImages = text.includes('/Image');
        const hasXobj   = text.includes('/XObject');
        resolve(hasText || hasImages || hasXobj
          ? null
          : 'El PDF no tiene contenido visible (está en blanco).');
      };
      reader.readAsArrayBuffer(file);
    });
  }

  // JPEG / PNG: crear un canvas y verificar si todos los píxeles son iguales
  if (type === 'image/jpeg' || type === 'image/png') {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Escalar a 50x50 para que sea rápido
        canvas.width  = 50;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(url); resolve(null); return; }
        ctx.drawImage(img, 0, 0, 50, 50);
        const data = ctx.getImageData(0, 0, 50, 50).data; // RGBA
        const firstR = data[0], firstG = data[1], firstB = data[2];
        let isBlank = true;
        // Permitir variación de ±10 para evitar falsos positivos por compresión JPEG
        for (let i = 0; i < data.length; i += 4) {
          if (
            Math.abs(data[i]   - firstR) > 10 ||
            Math.abs(data[i+1] - firstG) > 10 ||
            Math.abs(data[i+2] - firstB) > 10
          ) {
            isBlank = false;
            break;
          }
        }
        URL.revokeObjectURL(url);
        resolve(isBlank
          ? 'La imagen no tiene contenido visible (está en blanco).'
          : null);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  // DOCX
  if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const buffer = await file.arrayBuffer();
      const zip = await unzipFile(buffer);
      const xmlText = zip['word/document.xml'];
      if (!xmlText) return null;
      const matches = xmlText.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) ?? [];
      const text = matches.map(m => m.replace(/<[^>]+>/g, '')).join('').trim();
      return text.length > 0
        ? null
        : 'El documento Word no tiene contenido de texto (está en blanco).';
    } catch {
      return null;
    }
  }

  // DOC
  if (type === 'application/msword') {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buf = e.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(buf);
        let printableRun = 0;
        for (let i = 0; i < bytes.length; i++) {
          const b = bytes[i];
          if (b >= 32 && b <= 126) {
            printableRun++;
            if (printableRun > 20) { resolve(null); return; }
          } else {
            printableRun = 0;
          }
        }
        resolve('El documento no tiene contenido de texto (está en blanco).');
      };
      reader.readAsArrayBuffer(file);
    });
  }

  return null;
}

// Helper: descomprime un ZIP y devuelve sus archivos como strings
async function unzipFile(buffer: ArrayBuffer): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const bytes = new Uint8Array(buffer);

  // Buscar entradas del ZIP (signature 0x504B0304)
  let i = 0;
  while (i < bytes.length - 4) {
    if (bytes[i] === 0x50 && bytes[i+1] === 0x4B &&
        bytes[i+2] === 0x03 && bytes[i+3] === 0x04) {

      const compression = bytes[i+8] | (bytes[i+9] << 8);
      const compressedSize   = bytes[i+18] | (bytes[i+19] << 8) | (bytes[i+20] << 16) | (bytes[i+21] << 24);
      const fileNameLength   = bytes[i+26] | (bytes[i+27] << 8);
      const extraFieldLength = bytes[i+28] | (bytes[i+29] << 8);
      const fileNameBytes    = bytes.slice(i+30, i+30+fileNameLength);
      const fileName         = new TextDecoder().decode(fileNameBytes);
      const dataStart        = i + 30 + fileNameLength + extraFieldLength;
      const compressedData   = bytes.slice(dataStart, dataStart + compressedSize);

      if (fileName === 'word/document.xml') {
        if (compression === 0) {
          // Sin compresión
          result[fileName] = new TextDecoder().decode(compressedData);
        } else if (compression === 8) {
          // Deflate
          try {
            const ds = new DecompressionStream('deflate-raw');
            const writer = ds.writable.getWriter();
            const reader2 = ds.readable.getReader();
            writer.write(compressedData);
            writer.close();
            const chunks: Uint8Array[] = [];
            let done = false;
            while (!done) {
              const { value, done: d } = await reader2.read();
              if (value) chunks.push(value);
              done = d;
            }
            const total = chunks.reduce((a, c) => a + c.length, 0);
            const merged = new Uint8Array(total);
            let offset = 0;
            for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length; }
            result[fileName] = new TextDecoder().decode(merged);
          } catch { /* dejar pasar */ }
        }
        break; // ya encontramos lo que necesitamos
      }

      i = dataStart + compressedSize;
    } else {
      i++;
    }
  }
  return result;
};
