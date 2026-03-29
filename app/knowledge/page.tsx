'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, FileText, ChevronDown, ChevronRight, Sparkles, Loader2, FolderOpen, School, ArrowRightLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { LlmBadge } from '@/components/llm-badge';
import {
  getKnowledgeItems,
  addKnowledgeItem,
  deleteKnowledgeItem,
  knowledgeCategoryLabels,
  knowledgeCategoryDescriptions,
  type KnowledgeItem,
  type KnowledgeCategory,
} from '@/lib/knowledge-store';

const categories: KnowledgeCategory[] = ['template', 'past_document', 'school_info', 'handover'];

const categoryIcons: Record<KnowledgeCategory, React.ComponentType<{ className?: string }>> = {
  template: FileText,
  past_document: FolderOpen,
  school_info: School,
  handover: ArrowRightLeft,
};

const categoryColorMap: Record<KnowledgeCategory, { bg: string; border: string; icon: string; badge: string }> = {
  template: { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'text-violet-500', badge: 'bg-violet-100 text-violet-700' },
  past_document: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' },
  school_info: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  handover: { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'text-rose-500', badge: 'bg-rose-100 text-rose-700' },
};

interface PendingFile {
  fileName: string;
  content: string;
  category?: KnowledgeCategory;
}

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [expandedCat, setExpandedCat] = useState<KnowledgeCategory | null>(null);
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [classifying, setClassifying] = useState(false);
  const [classified, setClassified] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setItems(getKnowledgeItems());
  }, []);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newPending: PendingFile[] = [];
    for (const file of Array.from(files)) {
      let content = '';
      try {
        if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          content = await file.text();
        } else {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/extract-text', { method: 'POST', body: formData });
          if (res.ok) {
            const data = await res.json();
            content = data.text || `[テキスト抽出済み]`;
          } else {
            content = `[ファイル読み込み済み（${(file.size / 1024).toFixed(1)}KB）]`;
          }
        }
      } catch {
        content = `[読み込みエラー]`;
      }
      newPending.push({ fileName: file.name, content });
    }
    setPendingFiles(prev => [...prev, ...newPending]);
    setClassified(false);
    e.target.value = '';
  };

  const handleAutoClassify = async () => {
    if (pendingFiles.length === 0) return;
    setClassifying(true);
    try {
      const res = await fetch('/api/classify-knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: pendingFiles.map(f => ({ fileName: f.fileName, content: f.content })) }),
      });
      if (res.ok) {
        const data = await res.json();
        const classMap = new Map<string, KnowledgeCategory>();
        for (const c of data.classifications) {
          classMap.set(c.fileName, c.category as KnowledgeCategory);
        }
        setPendingFiles(prev => prev.map(f => ({ ...f, category: classMap.get(f.fileName) || 'past_document' })));
        setClassified(true);
      }
    } catch {
      setPendingFiles(prev => prev.map(f => ({ ...f, category: f.category || 'past_document' })));
      setClassified(true);
    } finally {
      setClassifying(false);
    }
  };

  const handleSaveAll = () => {
    for (const f of pendingFiles) {
      addKnowledgeItem(f.fileName, f.category || 'past_document', f.content);
    }
    setPendingFiles([]);
    setClassified(false);
    setItems(getKnowledgeItems());
  };

  const handleDelete = (id: string) => {
    deleteKnowledgeItem(id);
    setItems(getKnowledgeItems());
  };

  const removePending = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updatePendingCategory = (index: number, cat: KnowledgeCategory) => {
    setPendingFiles(prev => prev.map((f, i) => i === index ? { ...f, category: cat } : f));
  };

  const grouped = categories.reduce((acc, cat) => {
    acc[cat] = items.filter(item => item.category === cat);
    return acc;
  }, {} as Record<KnowledgeCategory, KnowledgeItem[]>);

  return (
    <div className="max-w-5xl">
      <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.doc,.txt,.md" onChange={handleFilesSelected} className="hidden" />

      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ナレッジベース</h1>
            <p className="mt-1 text-sm text-gray-500">
              過去の文書をまとめてアップロード。AIが自動分類し、全ての文書生成に反映します。
            </p>
          </div>
          <LlmBadge />
        </div>
      </div>

      {/* 一括アップロード */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800">ファイルをまとめてアップロード</h2>
          {pendingFiles.length > 0 && !classified && (
            <button onClick={handleAutoClassify} disabled={classifying}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 px-4 py-2 rounded-lg transition-colors">
              {classifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              AIで自動分類
            </button>
          )}
          {classified && pendingFiles.length > 0 && (
            <button onClick={handleSaveAll}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors">
              全て保存する（{pendingFiles.length}件）
            </button>
          )}
        </div>

        {pendingFiles.length === 0 ? (
          <label onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors">
            <Upload className="w-6 h-6 text-gray-400 mb-1" />
            <span className="text-sm text-gray-500">クリックしてファイルを選択</span>
            <span className="text-xs text-gray-400">PDF, Word, テキスト / 複数OK / AIが自動で分類</span>
          </label>
        ) : (
          <div>
            <div className="space-y-1.5 mb-3">
              {pendingFiles.map((f, i) => {
                const c = f.category ? categoryColorMap[f.category] : null;
                return (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                    <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700 flex-1 truncate">{f.fileName}</span>
                    {f.category ? (
                      <select value={f.category} onChange={e => updatePendingCategory(i, e.target.value as KnowledgeCategory)}
                        className={`text-[11px] px-2 py-1 rounded-md border ${c?.border} ${c?.bg} ${c?.icon} font-medium`}>
                        {categories.map(cat => <option key={cat} value={cat}>{knowledgeCategoryLabels[cat]}</option>)}
                      </select>
                    ) : (
                      <span className="text-[10px] text-gray-400">未分類</span>
                    )}
                    <button onClick={() => removePending(i)} className="text-gray-300 hover:text-red-500 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="text-xs text-primary-600 hover:text-primary-700">
              + さらにファイルを追加
            </button>
          </div>
        )}
      </div>

      {/* カテゴリ別一覧 — ファイル名プレビュー常時表示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(cat => {
          const catItems = grouped[cat];
          const c = categoryColorMap[cat];
          const Icon = categoryIcons[cat];
          const isExpanded = expandedCat === cat;

          return (
            <div key={cat}
              className={`rounded-xl border shadow-sm overflow-hidden ${catItems.length > 0 ? c.border : 'border-dashed border-gray-200'}`}>
              {/* ヘッダー */}
              <div
                className={`flex items-center justify-between px-4 py-3 ${catItems.length > 0 ? 'cursor-pointer hover:bg-gray-50/50' : ''} transition-colors`}
                onClick={() => catItems.length > 0 && setExpandedCat(isExpanded ? null : cat)}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.bg}`}>
                    <Icon className={`w-4 h-4 ${c.icon}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-800">{knowledgeCategoryLabels[cat]}</h3>
                    <p className="text-[10px] text-gray-400">
                      {catItems.length > 0 ? `${catItems.length} 件` : knowledgeCategoryDescriptions[cat]}
                    </p>
                  </div>
                </div>
                {catItems.length > 0 && (
                  isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </div>

              {/* ファイル名プレビュー（常時表示・展開前でも見える） */}
              {!isExpanded && catItems.length > 0 && (
                <div className="px-4 pb-3 -mt-1">
                  <div className="flex flex-wrap gap-1.5">
                    {catItems.slice(0, 3).map(item => (
                      <span key={item.id} className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                        {item.fileName}
                      </span>
                    ))}
                    {catItems.length > 3 && (
                      <span className="text-[10px] text-gray-400">+{catItems.length - 3}件</span>
                    )}
                  </div>
                </div>
              )}

              {/* 展開時の詳細 */}
              {isExpanded && catItems.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-2">
                  {catItems.map(item => (
                    <div key={item.id}>
                      <div
                        className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 rounded-md px-1 transition-colors"
                        onClick={() => setExpandedFileId(expandedFileId === item.id ? null : item.id)}>
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-700 truncate">{item.fileName}</span>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {new Date(item.uploadedAt).toLocaleDateString('ja-JP')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Link
                            href={`/documents?context=${encodeURIComponent('以下のナレッジを参考にしてください:\n\n' + item.content.slice(0, 300))}`}
                            onClick={e => e.stopPropagation()}
                            className="text-[10px] text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-2 py-0.5 rounded transition-colors flex items-center gap-0.5"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            ベースに作成
                          </Link>
                          <button onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      {expandedFileId === item.id && (
                        <div className="ml-6 mb-2">
                          <pre className="text-[11px] text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-3 border border-gray-100">
                            {item.content}
                          </pre>
                          <div className="mt-2 flex gap-2">
                            <Link
                              href={`/documents?context=${encodeURIComponent('以下のナレッジを参考にしてください:\n\n' + item.content)}`}
                              className="text-xs text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-md transition-colors inline-flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              この文書をベースに文書作成
                            </Link>
                            <Link
                              href={`/meeting-prep`}
                              className="text-xs text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-md transition-colors inline-flex items-center gap-1"
                            >
                              面談準備に活用
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
