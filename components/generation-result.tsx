'use client';
import { useState } from 'react';
import { Copy, Check, Edit3 } from 'lucide-react';

interface GenerationResultProps {
  content: string;
  variants?: string[];
  label?: string;
}

export function GenerationResult({ content, variants, label }: GenerationResultProps) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [selectedVariant, setSelectedVariant] = useState(0);

  const displayContent = variants ? variants[selectedVariant] : editContent;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm animate-card-in">
      {label && (
        <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(!editing)}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="編集"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="コピー"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {variants && variants.length > 1 && (
        <div className="px-4 pt-3 flex gap-2">
          {variants.map((_, i) => (
            <button
              key={i}
              onClick={() => setSelectedVariant(i)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedVariant === i
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              パターン {i + 1}
            </button>
          ))}
        </div>
      )}

      <div className="p-4">
        {editing ? (
          <textarea
            value={variants ? variants[selectedVariant] : editContent}
            onChange={e => !variants && setEditContent(e.target.value)}
            className="w-full min-h-[200px] p-3 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
          />
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {displayContent}
          </p>
        )}
      </div>
    </div>
  );
}
