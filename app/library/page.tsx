'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Archive, Copy, RotateCcw, Trash2 } from 'lucide-react';
import { getDocuments, deleteDocument, searchDocuments } from '@/lib/document-store';
import type { SavedDocument } from '@/lib/document-store';
import type { DocumentType } from '@/lib/types';

const TYPE_LABELS: Record<DocumentType, string> = {
  class_newsletter: '学級通信',
  parent_notice: '保護者向け通知',
  complaint_response: 'クレーム対応',
  meeting_memo: '面談メモ',
};

const TYPE_COLORS: Record<DocumentType, string> = {
  class_newsletter: 'bg-blue-100 text-blue-700',
  parent_notice: 'bg-green-100 text-green-700',
  complaint_response: 'bg-red-100 text-red-700',
  meeting_memo: 'bg-purple-100 text-purple-700',
};

const FILTER_TABS: { value: DocumentType | 'all'; label: string }[] = [
  { value: 'all', label: '全て' },
  { value: 'class_newsletter', label: '学級通信' },
  { value: 'parent_notice', label: '保護者向け通知' },
  { value: 'complaint_response', label: 'クレーム対応' },
  { value: 'meeting_memo', label: '面談メモ' },
];

export default function LibraryPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadDocuments = useCallback(() => {
    const filter = typeFilter === 'all' ? undefined : typeFilter;
    const result = searchDocuments(query, filter);
    setDocuments(result);
  }, [query, typeFilter]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleCopy = async (doc: SavedDocument) => {
    await navigator.clipboard.writeText(doc.content);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReuse = (doc: SavedDocument) => {
    const params = new URLSearchParams({
      context: doc.context,
      type: doc.documentType,
    });
    router.push(`/documents?${params.toString()}`);
  };

  const handleDelete = (id: string) => {
    deleteDocument(id);
    loadDocuments();
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* ヘッダー */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Archive className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">文書ライブラリ</h1>
        </div>
        <p className="text-sm text-gray-500">
          過去に生成した文書をストック。検索・再利用できます。
        </p>
      </div>

      {/* 検索バー */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="タイトルや内容で検索..."
          className="w-full border border-gray-200 rounded-md pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* タイプフィルター */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTypeFilter(tab.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              typeFilter === tab.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 文書一覧 */}
      {documents.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Archive className="w-12 h-12 mx-auto mb-3 opacity-30" />
          {query || typeFilter !== 'all' ? (
            <p className="text-sm">該当する文書が見つかりません。</p>
          ) : (
            <p className="text-sm">
              まだ保存された文書がありません。
              <br />
              通知文・文書生成から文書を作成すると、ここに表示されます。
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm p-4"
            >
              {/* カードヘッダー */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${TYPE_COLORS[doc.documentType]}`}
                  >
                    {TYPE_LABELS[doc.documentType]}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(doc.createdAt)}</span>
                </div>
              </div>

              {/* コンテキスト（タイトル代わり） */}
              <p className="text-sm font-medium text-gray-800 mb-1 truncate">
                {doc.context.slice(0, 30)}{doc.context.length > 30 ? '...' : ''}
              </p>

              {/* 本文プレビュー */}
              <p className="text-xs text-gray-500 line-clamp-3 mb-3 leading-relaxed">
                {doc.content}
              </p>

              {/* アクション */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(doc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedId === doc.id ? 'コピー済み' : 'コピー'}
                </button>
                <button
                  onClick={() => handleReuse(doc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  再利用
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
