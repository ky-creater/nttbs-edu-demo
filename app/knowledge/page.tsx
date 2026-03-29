'use client';

import { useState, useEffect, useRef } from 'react';
import { BookOpen, Upload, Trash2, FileText, ChevronDown, ChevronRight, Newspaper, Mail, ClipboardList, FolderOpen, Package, MoreHorizontal } from 'lucide-react';
import {
  getKnowledgeItems,
  addKnowledgeItem,
  deleteKnowledgeItem,
  knowledgeCategoryLabels,
  type KnowledgeItem,
  type KnowledgeCategory,
} from '@/lib/knowledge-store';

const categories: KnowledgeCategory[] = ['newsletter', 'notice', 'report', 'template', 'handover', 'other'];

const categoryIcons: Record<KnowledgeCategory, React.ComponentType<{ className?: string }>> = {
  newsletter: Newspaper,
  notice: Mail,
  report: ClipboardList,
  template: FileText,
  handover: FolderOpen,
  other: Package,
};

const categoryColorMap: Record<KnowledgeCategory, { bg: string; border: string; icon: string; badge: string }> = {
  newsletter: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' },
  notice: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  report: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' },
  template: { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'text-violet-500', badge: 'bg-violet-100 text-violet-700' },
  handover: { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'text-rose-500', badge: 'bg-rose-100 text-rose-700' },
  other: { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-gray-500', badge: 'bg-gray-100 text-gray-700' },
};

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [expandedCat, setExpandedCat] = useState<KnowledgeCategory | null>(null);
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<KnowledgeCategory | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setItems(getKnowledgeItems());
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !uploadTarget) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        let content = '';
        if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          content = await file.text();
        } else {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/extract-text', { method: 'POST', body: formData });
          if (res.ok) {
            const data = await res.json();
            content = data.text || `[${file.name} - テキスト抽出済み]`;
          } else {
            content = `[${file.name} - ファイル読み込み済み（${(file.size / 1024).toFixed(1)}KB）]`;
          }
        }
        addKnowledgeItem(file.name, uploadTarget, content);
      } catch {
        addKnowledgeItem(file.name, uploadTarget, `[${file.name} - 読み込みエラー]`);
      }
    }

    setItems(getKnowledgeItems());
    setUploading(false);
    setUploadTarget(null);
    e.target.value = '';
  };

  const handleUploadClick = (cat: KnowledgeCategory) => {
    setUploadTarget(cat);
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleDelete = (id: string) => {
    deleteKnowledgeItem(id);
    setItems(getKnowledgeItems());
  };

  const grouped = categories.reduce((acc, cat) => {
    acc[cat] = items.filter(item => item.category === cat);
    return acc;
  }, {} as Record<KnowledgeCategory, KnowledgeItem[]>);

  return (
    <div className="max-w-5xl">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.doc,.txt,.md"
        onChange={handleFileUpload}
        className="hidden"
        disabled={uploading}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ナレッジベース</h1>
        <p className="mt-1 text-sm text-gray-500">
          過去の文書を登録すると、AIが学校の文体・慣習を理解して全ての文書生成に反映します。
        </p>
      </div>

      {/* サマリーバー */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-500" />
              <span className="text-sm font-medium text-gray-800">
                {items.length} 件の文書を登録済み
              </span>
            </div>
            <div className="flex gap-1.5">
              {categories.map(cat => {
                const count = grouped[cat].length;
                if (count === 0) return null;
                const c = categoryColorMap[cat];
                return (
                  <span key={cat} className={`text-[10px] px-2 py-0.5 rounded-full ${c.badge}`}>
                    {knowledgeCategoryLabels[cat]} {count}
                  </span>
                );
              })}
            </div>
          </div>
          <p className="text-[10px] text-gray-400">文書作成・面談準備・所見に自動反映</p>
        </div>
      </div>

      {/* カテゴリグリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(cat => {
          const catItems = grouped[cat];
          const c = categoryColorMap[cat];
          const Icon = categoryIcons[cat];
          const isExpanded = expandedCat === cat;

          return (
            <div
              key={cat}
              className={`rounded-xl border shadow-sm transition-all ${
                catItems.length > 0 ? `bg-white ${c.border}` : 'bg-gray-50/50 border-dashed border-gray-200'
              }`}
            >
              {/* カテゴリヘッダー */}
              <div
                className={`flex items-center justify-between px-4 py-3 cursor-pointer rounded-t-xl ${
                  catItems.length > 0 ? 'hover:bg-gray-50' : ''
                }`}
                onClick={() => catItems.length > 0 && setExpandedCat(isExpanded ? null : cat)}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bg}`}>
                    <Icon className={`w-4 h-4 ${c.icon}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-800">{knowledgeCategoryLabels[cat]}</h3>
                    <p className="text-[10px] text-gray-400">
                      {catItems.length > 0 ? `${catItems.length} 件登録` : '未登録'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUploadClick(cat); }}
                    className="text-xs text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    追加
                  </button>
                  {catItems.length > 0 && (
                    isExpanded
                      ? <ChevronDown className="w-4 h-4 text-gray-400" />
                      : <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* ファイル一覧（展開時） */}
              {isExpanded && catItems.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-2">
                  {catItems.map(item => (
                    <div key={item.id}>
                      <div
                        className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 rounded-md px-1 transition-colors"
                        onClick={() => setExpandedFileId(expandedFileId === item.id ? null : item.id)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-700 truncate">{item.fileName}</span>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {new Date(item.uploadedAt).toLocaleDateString('ja-JP')}
                          </span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1 shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      {expandedFileId === item.id && (
                        <div className="ml-6 mb-2">
                          <pre className="text-[11px] text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-3 border border-gray-100">
                            {item.content}
                          </pre>
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
