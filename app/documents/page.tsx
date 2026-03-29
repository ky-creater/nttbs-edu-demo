'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Newspaper, Mail, Shield, ClipboardList, BookOpen, Building2, Award, Reply, Mic, GraduationCap } from 'lucide-react';
import { GenerationResult } from '@/components/generation-result';
import { FileUpload } from '@/components/file-upload';
import { saveDocument } from '@/lib/document-store';
import type { DocumentType, Tone } from '@/lib/types';

const documentTypes: {
  value: DocumentType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'class_newsletter',
    label: '学級通信',
    description: 'クラスの活動・お知らせを保護者に伝える',
    icon: <Newspaper className="w-5 h-5" />,
  },
  {
    value: 'parent_notice',
    label: '保護者向け通知',
    description: '行事・連絡事項などの公式通知文',
    icon: <Mail className="w-5 h-5" />,
  },
  {
    value: 'complaint_response',
    label: 'クレーム対応文書',
    description: '保護者からの苦情・要望への回答文',
    icon: <Shield className="w-5 h-5" />,
  },
  {
    value: 'meeting_memo',
    label: '面談メモ',
    description: '保護者面談の記録・確認事項の整理',
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    value: 'guidance_record',
    label: '指導記録',
    description: '生徒指導の経過・対応を記録',
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    value: 'board_report',
    label: '教育委員会報告',
    description: '教育委員会への報告書・稟議',
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    value: 'recommendation',
    label: '推薦状・調査書',
    description: '進路に関する推薦文・調査書',
    icon: <Award className="w-5 h-5" />,
  },
  {
    value: 'absence_reply',
    label: '欠席連絡返信',
    description: '保護者からの欠席連絡への返信',
    icon: <Reply className="w-5 h-5" />,
  },
  {
    value: 'event_speech',
    label: '行事挨拶文',
    description: '式典・行事での挨拶原稿',
    icon: <Mic className="w-5 h-5" />,
  },
  {
    value: 'training_report',
    label: '研修報告',
    description: '校内研修・外部研修の記録',
    icon: <GraduationCap className="w-5 h-5" />,
  },
];

const tones: { value: Tone; label: string }[] = [
  { value: 'formal', label: 'フォーマル' },
  { value: 'friendly', label: '親しみやすい' },
  { value: 'concise', label: '簡潔' },
];

const documentTypeLabels: Record<DocumentType, string> = {
  class_newsletter: '学級通信',
  parent_notice: '保護者向け通知',
  complaint_response: 'クレーム対応文書',
  meeting_memo: '面談メモ',
  guidance_record: '指導記録',
  board_report: '教育委員会報告',
  recommendation: '推薦状・調査書',
  absence_reply: '欠席連絡返信',
  event_speech: '行事挨拶文',
  training_report: '研修報告',
};

function DocumentsPageInner() {
  const searchParams = useSearchParams();
  const [selectedType, setSelectedType] = useState<DocumentType>('parent_notice');
  const [context, setContext] = useState('');
  const [tone, setTone] = useState<Tone>('formal');
  const [grade, setGrade] = useState('');
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [uploadedText, setUploadedText] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  useEffect(() => {
    const ctxParam = searchParams.get('context');
    const typeParam = searchParams.get('type') as DocumentType | null;
    if (ctxParam) setContext(ctxParam);
    if (typeParam && documentTypes.some((d) => d.value === typeParam)) {
      setSelectedType(typeParam);
    }
  }, [searchParams]);

  const handleSave = () => {
    if (!result) return;
    saveDocument({
      documentType: selectedType,
      context,
      content: result,
      tone,
      grade: grade ? Number(grade) : undefined,
      className: className || undefined,
    });
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const handleRefine = async (currentText: string, instruction: string): Promise<string> => {
    const res = await fetch('/api/refine-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentText, instruction }),
    });
    if (!res.ok) throw new Error('修正に失敗しました');
    const data = await res.json();
    return data.content;
  };

  const handleTextExtracted = (text: string, fileName: string) => {
    if (!text) {
      setUploadedText(null);
      setUploadedFileName('');
    } else {
      setUploadedText(text);
      setUploadedFileName(fileName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!context.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const contextWithUpload = uploadedText
        ? context.trim() + '\n\n---参考文書---\n' + uploadedText
        : context.trim();

      const res = await fetch('/api/generate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: selectedType,
          context: contextWithUpload,
          tone,
          grade: grade ? Number(grade) : undefined,
          className: className || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('生成に失敗しました。もう一度お試しください。');
      }

      const data = await res.json();
      setResult(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">通知文・文書生成</h1>
        <p className="mt-1 text-sm text-gray-500">
          状況を入力するだけで、すぐに使える文書をAIが生成します。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 文書タイプ選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">文書タイプ</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {documentTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setSelectedType(type.value)}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                  selectedType === type.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span
                  className={`mt-0.5 flex-shrink-0 ${
                    selectedType === type.value ? 'text-primary-600' : 'text-gray-400'
                  }`}
                >
                  {type.icon}
                </span>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      selectedType === type.value ? 'text-primary-700' : 'text-gray-800'
                    }`}
                  >
                    {type.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 参考文書アップロード */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            参考文書をアップロード
            <span className="ml-1 text-xs font-normal text-gray-400">（任意）</span>
          </label>
          <FileUpload
            onTextExtracted={handleTextExtracted}
            isProcessing={loading}
          />
        </div>

        {/* コンテキスト入力 */}
        <div>
          <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-1">
            状況・内容
          </label>
          {uploadedFileName && (
            <div className="mb-2 inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-md text-xs">
              <span>📎</span>
              <span className="font-medium truncate max-w-[240px]">{uploadedFileName}</span>
              <span>の内容を参考にして生成します</span>
            </div>
          )}
          <textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="例: 来月の修学旅行について保護者に連絡したい。日程は11月15日〜17日、費用は約4万円。"
            className="min-h-[120px] w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
            required
          />
        </div>

        {/* 文体選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">文体</label>
          <div className="flex gap-4">
            {tones.map((t) => (
              <label key={t.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tone"
                  value={t.value}
                  checked={tone === t.value}
                  onChange={() => setTone(t.value)}
                  className="accent-primary-500"
                />
                <span className="text-sm text-gray-700">{t.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 学年・クラス（任意） */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            学年・クラス
            <span className="ml-1 text-xs font-normal text-gray-400">（任意）</span>
          </label>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={3}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="学年"
                className="w-20 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-500">年</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="クラス名"
                className="w-28 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-500">組</span>
            </div>
          </div>
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={loading || !context.trim()}
          className="w-full py-2.5 px-4 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '生成中...' : '生成する'}
        </button>
      </form>

      {/* エラー表示 */}
      {error && (
        <div className="mt-6 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 結果表示 */}
      {result && (
        <div className="mt-6">
          <GenerationResult content={result} label={documentTypeLabels[selectedType]} onRefine={handleRefine} />
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-emerald-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              ライブラリに保存
            </button>
          </div>
        </div>
      )}

      {/* 保存トースト */}
      {showSavedToast && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in">
          保存しました
        </div>
      )}
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto py-8 px-4 text-sm text-gray-400">読み込み中...</div>}>
      <DocumentsPageInner />
    </Suspense>
  );
}
