'use client';
import { useState } from 'react';
import { Copy, Check, Edit3, Wand2, Loader2, RotateCcw } from 'lucide-react';

interface GenerationResultProps {
  content: string;
  variants?: string[];
  label?: string;
  onRefine?: (currentText: string, instruction: string) => Promise<string>;
}

export function GenerationResult({ content, variants, label, onRefine }: GenerationResultProps) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [refineInput, setRefineInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refinedContent, setRefinedContent] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const currentContent = refinedContent ?? (variants ? variants[selectedVariant] : editContent);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefine = async () => {
    if (!refineInput.trim() || !onRefine || isRefining) return;
    setIsRefining(true);
    try {
      setHistory(prev => [...prev, currentContent]);
      const result = await onRefine(currentContent, refineInput.trim());
      setRefinedContent(result);
      setRefineInput('');
    } catch {
      // keep current content
    } finally {
      setIsRefining(false);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setRefinedContent(prev);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm animate-card-in">
      {label && (
        <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            {refinedContent && (
              <span className="text-[10px] bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">
                AI修正済み
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {history.length > 0 && (
              <button
                onClick={handleUndo}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="元に戻す"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setEditing(!editing)}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="手動編集"
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

      {variants && variants.length > 1 && !refinedContent && (
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
            value={currentContent}
            onChange={e => {
              if (refinedContent !== null) {
                setRefinedContent(e.target.value);
              } else if (!variants) {
                setEditContent(e.target.value);
              }
            }}
            className="w-full min-h-[200px] p-3 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
          />
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {currentContent}
          </p>
        )}
      </div>

      {onRefine && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={refineInput}
              onChange={e => setRefineInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRefine()}
              placeholder="修正指示を入力（例: もう少し柔らかい表現にして）"
              className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isRefining}
            />
            <button
              onClick={handleRefine}
              disabled={!refineInput.trim() || isRefining}
              className="px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              {isRefining ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              {isRefining ? '修正中...' : '修正'}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            Enterキーで送信。何度でも修正できます。
          </p>
        </div>
      )}
    </div>
  );
}
