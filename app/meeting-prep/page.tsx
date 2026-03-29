'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  UserCheck,
  FileText,
  MessageCircle,
  ThumbsUp,
  AlertCircle,
  ArrowRight,
  Copy,
  Printer,
  Check,
  Loader2,
} from 'lucide-react';
import { mockStudents } from '@/data/mock-students';
import { LlmBadge } from '@/components/llm-badge';
import { calculateRiskScore, getRiskLevel, getRiskLabel, getRiskColor } from '@/lib/risk-calculator';

type MeetingType = 'regular' | 'concern' | 'incident';

interface TalkingPoint {
  topic: string;
  detail: string;
  priority: 'high' | 'medium' | 'low';
}

interface MeetingPrepResult {
  summary: string;
  talkingPoints: TalkingPoint[];
  questionsForParent: string[];
  positivePoints: string[];
  cautions: string[];
  nextActions: string[];
}

const meetingTypeOptions: { value: MeetingType; label: string; description: string }[] = [
  { value: 'regular', label: '定期面談', description: '学期末の通常面談' },
  { value: 'concern', label: '気になる点の共有', description: '成績低下・欠席増加等' },
  { value: 'incident', label: '個別対応', description: 'トラブル・いじめ等の緊急対応' },
];

const priorityDot: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-400',
  low: 'bg-emerald-500',
};

const priorityLabel: Record<string, string> = {
  high: '重要',
  medium: '通常',
  low: '参考',
};

function MeetingPrepContent() {
  const searchParams = useSearchParams();
  const initialStudentId = searchParams.get('studentId') ?? '';

  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId);
  const [meetingType, setMeetingType] = useState<MeetingType>('regular');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MeetingPrepResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedStudent = mockStudents.find(s => s.id === selectedStudentId) ?? null;

  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
    }
  }, [initialStudentId]);

  const handleGenerate = async () => {
    if (!selectedStudentId) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/generate-meeting-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudentId, meetingType, additionalNotes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'エラーが発生しました');
        return;
      }
      setResult(data as MeetingPrepResult);
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result || !selectedStudent) return;
    const lines: string[] = [
      `【面談準備シート】${selectedStudent.name}（${selectedStudent.grade}年${selectedStudent.class}組）`,
      '',
      '■ 生徒の現状サマリ',
      result.summary,
      '',
      '■ 話すべき論点',
      ...result.talkingPoints.map(
        (p, i) => `${i + 1}. [${priorityLabel[p.priority]}] ${p.topic}\n   ${p.detail}`
      ),
      '',
      '■ 保護者への質問案',
      ...result.questionsForParent.map((q, i) => `${i + 1}. ${q}`),
      '',
      '■ 伝えるべきポジティブな点',
      ...result.positivePoints.map((p, i) => `${i + 1}. ${p}`),
      '',
      '■ 注意事項・配慮点',
      ...result.cautions.map((c, i) => `${i + 1}. ${c}`),
      '',
      '■ 次回アクション候補',
      ...result.nextActions.map((a, i) => `${i + 1}. ${a}`),
    ];
    await navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // 生徒概要カード用の計算
  const studentSummary = selectedStudent
    ? (() => {
        const score = calculateRiskScore(selectedStudent);
        const level = getRiskLevel(score);
        const totalAbsent = selectedStudent.attendance.reduce((s, m) => s + m.absent, 0);
        const avgGrade =
          selectedStudent.grades.reduce((s, g) => s + g.score, 0) /
          (selectedStudent.grades.length || 1);
        return { score, level, totalAbsent, avgGrade: Math.round(avgGrade) };
      })()
    : null;

  return (
    <div className="print:ml-0">
      <div className="max-w-4xl print:p-0">
        {/* ヘッダー */}
        <div className="mb-8 print:hidden">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <UserCheck className="w-6 h-6 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">面談準備シート</h1>
              </div>
              <p className="text-sm text-gray-500 ml-9">
                保護者面談の論点・質問案をAIが自動生成します
              </p>
            </div>
            <LlmBadge />
          </div>
        </div>

        {/* 入力フォーム */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6 print:hidden">
          {/* 生徒選択 */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              生徒を選択
            </label>
            <select
              value={selectedStudentId}
              onChange={e => {
                setSelectedStudentId(e.target.value);
                setResult(null);
                setError(null);
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">-- 生徒を選択してください --</option>
              {mockStudents.map(s => (
                <option key={s.id} value={s.id}>
                  {s.grade}年{s.class}組 {s.number}番 {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 生徒概要カード */}
          {selectedStudent && studentSummary && (
            <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{selectedStudent.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedStudent.grade}年{selectedStudent.class}組 /{' '}
                    {selectedStudent.activities.length > 0
                      ? selectedStudent.activities.join('・')
                      : '課外活動なし'}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getRiskColor(studentSummary.level)}`}
                >
                  {getRiskLabel(studentSummary.level)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{studentSummary.avgGrade}点</p>
                  <p className="text-[11px] text-gray-500">成績平均</p>
                </div>
                <div className="text-center border-x border-gray-200">
                  <p className="text-lg font-bold text-gray-900">{studentSummary.totalAbsent}日</p>
                  <p className="text-[11px] text-gray-500">欠席合計</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{studentSummary.score}</p>
                  <p className="text-[11px] text-gray-500">リスクスコア</p>
                </div>
              </div>
            </div>
          )}

          {/* 面談種別 */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">面談種別</label>
            <div className="flex flex-col gap-2">
              {meetingTypeOptions.map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    meetingType === opt.value
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="meetingType"
                    value={opt.value}
                    checked={meetingType === opt.value}
                    onChange={() => setMeetingType(opt.value)}
                    className="mt-0.5 accent-primary-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                    <span className="text-xs text-gray-500 ml-2">（{opt.description}）</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 追加メモ */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              追加メモ{' '}
              <span className="text-xs font-normal text-gray-400">（任意）</span>
            </label>
            <textarea
              value={additionalNotes}
              onChange={e => setAdditionalNotes(e.target.value)}
              placeholder="事前に保護者から聞いていること・共有したいことがあれば記入"
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          {/* 生成ボタン */}
          <button
            onClick={handleGenerate}
            disabled={!selectedStudentId || loading}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-medium rounded-md px-4 py-2.5 text-sm transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                準備シートを生成
              </>
            )}
          </button>

          {error && (
            <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </p>
          )}
        </div>

        {/* 生成結果 */}
        {result && selectedStudent && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm print:shadow-none print:border-0">
            {/* 結果ヘッダー */}
            <div className="px-6 py-4 border-b border-gray-100 print:hidden">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">
                  面談準備シート — {selectedStudent.name}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-md px-4 py-2 text-sm transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied ? 'コピー完了' : 'コピー'}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md px-4 py-2 text-sm transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    印刷
                  </button>
                </div>
              </div>
            </div>

            {/* 印刷用タイトル */}
            <div className="hidden print:block px-6 py-4 border-b border-gray-200">
              <h1 className="text-lg font-bold">面談準備シート</h1>
              <p className="text-sm text-gray-600 mt-1">
                {selectedStudent.name}（{selectedStudent.grade}年{selectedStudent.class}組 {selectedStudent.number}番）
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {/* 現状サマリ */}
              <div className="px-6 py-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                  <FileText className="w-4 h-4 text-gray-500" />
                  生徒の現状サマリ
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>
              </div>

              {/* 論点 */}
              <div className="px-6 py-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  話すべき論点
                </div>
                <ol className="space-y-3">
                  {result.talkingPoints.map((point, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDot[point.priority] ?? 'bg-gray-400'}`}
                          />
                          <span className="text-sm font-medium text-gray-800">{point.topic}</span>
                          <span className="text-xs text-gray-400">
                            [{priorityLabel[point.priority] ?? point.priority}]
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 ml-4">{point.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* 質問案 */}
              <div className="px-6 py-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                  <MessageCircle className="w-4 h-4 text-primary-500" />
                  保護者への質問案
                </div>
                <ol className="space-y-2">
                  {result.questionsForParent.map((q, i) => (
                    <li key={i} className="bg-blue-50 rounded-md p-3 text-sm text-gray-700 flex gap-2">
                      <span className="flex-shrink-0 font-semibold text-blue-600">{i + 1}.</span>
                      {q}
                    </li>
                  ))}
                </ol>
              </div>

              {/* ポジティブな点 */}
              <div className="px-6 py-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                  <ThumbsUp className="w-4 h-4 text-emerald-500" />
                  伝えるべきポジティブな点
                </div>
                <ol className="space-y-2">
                  {result.positivePoints.map((p, i) => (
                    <li key={i} className="bg-emerald-50 rounded-md p-3 text-sm text-gray-700 flex gap-2">
                      <span className="flex-shrink-0 font-semibold text-emerald-600">{i + 1}.</span>
                      {p}
                    </li>
                  ))}
                </ol>
              </div>

              {/* 注意事項 */}
              <div className="px-6 py-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  注意事項・配慮点
                </div>
                <ol className="space-y-2">
                  {result.cautions.map((c, i) => (
                    <li key={i} className="bg-amber-50 rounded-md p-3 text-sm text-gray-700 flex gap-2">
                      <span className="flex-shrink-0 font-semibold text-amber-600">{i + 1}.</span>
                      {c}
                    </li>
                  ))}
                </ol>
              </div>

              {/* 次回アクション */}
              <div className="px-6 py-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                  次回アクション候補
                </div>
                <ol className="space-y-2">
                  {result.nextActions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 mt-0.5">
                        {i + 1}
                      </span>
                      {a}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* 印刷用フッター */}
            <div className="hidden print:block px-6 py-3 border-t border-gray-200">
              <p className="text-xs text-gray-400">校務支援AI — 面談準備シート（AI生成）</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MeetingPrepPage() {
  return (
    <Suspense fallback={<div className="ml-64 p-8 text-sm text-gray-500">読み込み中...</div>}>
      <MeetingPrepContent />
    </Suspense>
  );
}
