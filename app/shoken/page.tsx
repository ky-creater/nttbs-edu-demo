'use client';

import { useState, useMemo } from 'react';
import { Loader, FileText, User } from 'lucide-react';
import { mockStudents } from '@/data/mock-students';
import { GenerationResult } from '@/components/generation-result';

type Semester = 1 | 2 | 3;

export default function ShokenPage() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [semester, setSemester] = useState<Semester>(1);
  const [pastNotes, setPastNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedStudent = useMemo(
    () => mockStudents.find(s => s.id === selectedStudentId) ?? null,
    [selectedStudentId]
  );

  const semesterAttendance = useMemo(() => {
    if (!selectedStudent) return null;
    const months =
      semester === 1 ? [4, 5, 6, 7] :
      semester === 2 ? [9, 10, 11, 12] :
      [1, 2, 3];
    return selectedStudent.attendance.filter(a => months.includes(a.month));
  }, [selectedStudent, semester]);

  const totalAbsent = semesterAttendance?.reduce((sum, a) => sum + a.absent, 0) ?? 0;
  const totalLate = semesterAttendance?.reduce((sum, a) => sum + a.late, 0) ?? 0;

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

  const handleGenerate = async () => {
    if (!selectedStudentId) return;
    setLoading(true);
    setVariants(null);
    setError(null);

    try {
      const res = await fetch('/api/generate-shoken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudentId, semester, pastNotes: pastNotes || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      setVariants(data.variants);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* ページヘッダー */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-primary-600" />
          <h1 className="text-xl font-semibold text-gray-900">所見ドラフト生成</h1>
        </div>
        <p className="text-sm text-gray-500">
          生徒を選択して「生成する」を押すと、通知表所見の3パターンを自動作成します。
        </p>
      </div>

      {/* フォームカード */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        {/* 生徒選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            生徒を選択
          </label>
          <select
            value={selectedStudentId}
            onChange={e => {
              setSelectedStudentId(e.target.value);
              setVariants(null);
              setError(null);
            }}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">-- 選択してください --</option>
            {mockStudents.map(s => (
              <option key={s.id} value={s.id}>
                {s.grade}年{s.class}組 {s.number}番 {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* 学期選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            学期
          </label>
          <div className="flex gap-4">
            {([1, 2, 3] as Semester[]).map(s => (
              <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="semester"
                  value={s}
                  checked={semester === s}
                  onChange={() => {
                    setSemester(s);
                    setVariants(null);
                    setError(null);
                  }}
                  className="accent-primary-600"
                />
                <span className="text-sm text-gray-700">{s}学期</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 生徒情報カード */}
      {selectedStudent && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">生徒情報</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">氏名</span>
              <p className="font-medium text-gray-900 mt-0.5">{selectedStudent.name}</p>
            </div>
            <div>
              <span className="text-gray-500">クラス</span>
              <p className="font-medium text-gray-900 mt-0.5">
                {selectedStudent.grade}年{selectedStudent.class}組 {selectedStudent.number}番（{selectedStudent.gender}）
              </p>
            </div>
            <div>
              <span className="text-gray-500">{semester}学期 出欠サマリ</span>
              <p className="font-medium text-gray-900 mt-0.5">
                欠席 {totalAbsent}日 / 遅刻 {totalLate}回
              </p>
            </div>
            <div>
              <span className="text-gray-500">成績（平均）</span>
              <p className="font-medium text-gray-900 mt-0.5">
                {Math.round(
                  selectedStudent.grades.reduce((sum, g) => sum + g.score, 0) /
                  selectedStudent.grades.length
                )}点
              </p>
            </div>
          </div>
          {selectedStudent.activities.length > 0 && (
            <div className="mt-3">
              <span className="text-sm text-gray-500">活動</span>
              <p className="text-sm text-gray-900 mt-0.5">{selectedStudent.activities.join('、')}</p>
            </div>
          )}
          {selectedStudent.notes && (
            <div className="mt-3">
              <span className="text-sm text-gray-500">担任メモ</span>
              <p className="text-sm text-gray-700 mt-0.5">{selectedStudent.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* 過去の所見・メモ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          過去の所見・メモ <span className="text-xs text-gray-400">（任意）</span>
        </label>
        <textarea
          value={pastNotes}
          onChange={e => setPastNotes(e.target.value)}
          placeholder="前学期の所見や日頃のメモがあれば入力してください。AIが前回との差分を踏まえて生成します。"
          className="min-h-[80px] w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
        />
      </div>

      {/* 生成ボタン */}
      <button
        onClick={handleGenerate}
        disabled={!selectedStudentId || loading}
        className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            生成中...
          </>
        ) : (
          '生成する'
        )}
      </button>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 結果表示 */}
      {variants && (
        <GenerationResult
          content={variants[0]}
          variants={variants}
          label="所見ドラフト"
          onRefine={handleRefine}
        />
      )}
    </div>
  );
}
