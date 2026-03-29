'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, CheckCircle, Loader2, X } from 'lucide-react';

interface FileUploadProps {
  onTextExtracted: (text: string, fileName: string) => void;
  isProcessing: boolean;
}

const ACCEPTED_TYPES = ['.pdf', '.jpg', '.jpeg', '.png', '.txt', '.doc', '.docx'];
const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function FileUpload({ onTextExtracted, isProcessing }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [extractedFileName, setExtractedFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);

    if (file.size > MAX_SIZE_BYTES) {
      setError('ファイルサイズが10MBを超えています。');
      return;
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext)) {
      setError(`対応していないファイル形式です。（${ACCEPTED_TYPES.join(', ')}）`);
      return;
    }

    setIsExtracting(true);
    setExtractedFileName(null);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // strip "data:...;base64," prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const mimeType = file.type || 'application/octet-stream';

      const res = await fetch('/api/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64,
          fileName: file.name,
          mimeType,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'テキスト抽出に失敗しました。');
      }

      const data = await res.json();
      setExtractedFileName(file.name);
      onTextExtracted(data.text, file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ファイルの読み取りに失敗しました。');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleClear = () => {
    setExtractedFileName(null);
    setError(null);
    onTextExtracted('', '');
  };

  const busy = isExtracting || isProcessing;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={handleChange}
        disabled={busy}
      />

      {!extractedFileName ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !busy && inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && !busy && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors select-none ${
            isDragOver
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          } ${busy ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isExtracting ? (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
              <p className="text-sm font-medium">AIが内容を読み取っています...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <Upload className="w-10 h-10" />
              <p className="text-sm font-medium text-gray-600">
                ファイルをドラッグ&amp;ドロップ、またはクリックして選択
              </p>
              <p className="text-xs text-gray-400">
                PDF・画像（JPG, PNG）・テキストファイルに対応 / 最大10MB
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 border border-green-200 bg-green-50 rounded-lg px-4 py-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-700 truncate">{extractedFileName}</p>
            <p className="text-xs text-green-600">読み取り完了</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="取り消し"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-red-500 text-xs">{error}</p>
      )}
    </div>
  );
}
