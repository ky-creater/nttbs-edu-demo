import type { DocumentType, Tone } from '@/lib/types';

export interface SavedDocument {
  id: string;
  documentType: DocumentType;
  context: string;
  content: string;
  tone: Tone;
  grade?: number;
  className?: string;
  createdAt: string;
}

const STORAGE_KEY = 'edu-demo-documents';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function saveDocument(doc: Omit<SavedDocument, 'id' | 'createdAt'>): SavedDocument {
  const newDoc: SavedDocument = {
    ...doc,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  const existing = getDocuments();
  const updated = [newDoc, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newDoc;
}

export function getDocuments(): SavedDocument[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedDocument[];
  } catch {
    return [];
  }
}

export function deleteDocument(id: string): void {
  const existing = getDocuments();
  const updated = existing.filter((doc) => doc.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function searchDocuments(query: string, typeFilter?: DocumentType): SavedDocument[] {
  const all = getDocuments();
  const lowerQuery = query.toLowerCase();

  return all.filter((doc) => {
    const matchesType = !typeFilter || doc.documentType === typeFilter;
    const matchesQuery =
      !query ||
      doc.context.toLowerCase().includes(lowerQuery) ||
      doc.content.toLowerCase().includes(lowerQuery);
    return matchesType && matchesQuery;
  });
}
