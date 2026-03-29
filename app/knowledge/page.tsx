'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Upload, Trash2, FileText, File } from 'lucide-react';
import {
  getKnowledgeItems,
  addKnowledgeItem,
  deleteKnowledgeItem,
  knowledgeCategoryLabels,
  type KnowledgeItem,
  type KnowledgeCategory,
} from '@/lib/knowledge-store';

const categories: KnowledgeCategory[] = ['newsletter', 'notice', 'report', 'template', 'handover', 'other'];

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory>('template');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setItems(getKnowledgeItems());
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        let content = '';
        if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          content = await file.text();
        } else {
          // For PDF/docx, use extract-text API
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
        addKnowledgeItem(file.name, selectedCategory, content);
      } catch {
        addKnowledgeItem(file.name, selectedCategory, `[${file.name} - 読み込みエラー]`);
      }
    }

    setItems(getKnowledgeItems());
    setUploading(false);
    e.target.value = '';
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
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ナレッジベース</h1>
            <p className="mt-1 text-sm text-gray-500">
              過去の文書をアップロードすると、AIが学校の文体・慣習を理解して文書生成に反映します。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{items.length} 件登録済み</span>
          </div>
        </div>
      </div>

      {/* アップロードエリア */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">ファイルを追加</h2>
        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1.5">カテゴリ</label>
              <div className="flex gap-1.5 flex-wrap">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      selectedCategory === cat
                        ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {knowledgeCategoryLabels[cat]}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">
                {uploading ? 'アップロード中...' : 'クリックしてファイルを選択'}
              </span>
              <span className="text-xs text-gray-400 mt-1">PDF, Word, テキスト / 複数選択OK</span>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      </div>

      {/* 登録済みナレッジ一覧 */}
      <div className="space-y-4">
        {categories.map(cat => {
          const catItems = grouped[cat];
          if (catItems.length === 0) return null;
          return (
            <div key={cat} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary-500" />
                {knowledgeCategoryLabels[cat]}
                <span className="text-xs text-gray-400 font-normal">{catItems.length}件</span>
              </h3>
              <div className="space-y-2">
                {catItems.map(item => (
                  <div key={item.id} className="border border-gray-100 rounded-lg">
                    <div
                      className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{item.fileName}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(item.uploadedAt).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                        title="削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {expandedId === item.id && (
                      <div className="px-3 pb-3 border-t border-gray-100">
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap mt-2 max-h-48 overflow-y-auto bg-gray-50 rounded p-3">
                          {item.content}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <File className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">ナレッジはまだ登録されていません</p>
          <p className="text-xs mt-1">過去の文書をアップロードして、AIの生成精度を向上させましょう</p>
        </div>
      )}
    </div>
  );
}
