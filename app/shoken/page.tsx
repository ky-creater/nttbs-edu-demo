'use client';

import { useState, useMemo, useEffect } from 'react';
import { Loader, User, BookOpen, Eye } from 'lucide-react';
import { mockStudents } from '@/data/mock-students';
import { GenerationResult } from '@/components/generation-result';
import { LlmBadge } from '@/components/llm-badge';
import { getObservations, categoryLabels, categoryColors, type Observation } from '@/lib/observation-store';

type Semester = 1 | 2 | 3;

export default function ShokenPage() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [semester, setSemester] = useState<Semester>(1);
  const [pastNotes, setPastNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);

  // URLクエリパラムから生徒を自動選択
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('studentId');
    if (sid && mockStudents.some(s => s.id === sid)) {
      setSelectedStudentId(sid);
    }
  }, []);

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

  useEffect(() => {
    if (selectedStudentId) {
      setObservations(getObservations(selectedStudentId));
    } else {
      setObservations([]);
    }
  }, [selectedStudentId]);

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
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">所見ドラフト生成</h1>
            <p className="mt-1 text-sm text-gray-500">
              生徒を選択して「生成する」を押すと、通知表所見の3パターンを自動作成します。
            </p>
          </div>
          <LlmBadge />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 左カラム: 操作パネル */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">生徒を選択</label>
              <select
                value={selectedStudentId}
                onChange={e => { setSelectedStudentId(e.target.value); setVariants(null); setError(null); }}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">学期</label>
              <div className="flex gap-4">
                {([1, 2, 3] as Semester[]).map(s => (
                  <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio" name="semester" value={s}
                      checked={semester === s}
                      onChange={() => { setSemester(s); setVariants(null); setError(null); }}
                      className="accent-primary-600"
                    />
                    <span className="text-sm text-gray-700">{s}学期</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <BookOpen className="w-4 h-4 text-gray-400" />
              過去の所見・メモ <span className="text-xs text-gray-400 font-normal">（任意）</span>
            </label>
            <textarea
              value={pastNotes}
              onChange={e => setPastNotes(e.target.value)}
              placeholder="前学期の所見や日頃のメモがあれば入力してください。AIが前回との差分を踏まえて生成します。"
              className="min-h-[120px] w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!selectedStudentId || loading}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (<><Loader className="w-4 h-4 animate-spin" />生成中...</>) : '生成する'}
          </button>
        </div>

        {/* 右カラム: 生徒情報 + 結果 */}
        <div className="lg:col-span-3 space-y-4">
          {selectedStudent ? (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">生徒情報</span>
                <span className="text-[10px] text-gray-400">📊 校務支援システム</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
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
                  <span className="text-gray-500">{semester}学期 出欠</span>
                  <p className="font-medium text-gray-900 mt-0.5">欠席 {totalAbsent}日 / 遅刻 {totalLate}回</p>
                </div>
                <div>
                  <span className="text-gray-500">成績（平均）</span>
                  <p className="font-medium text-gray-900 mt-0.5">
                    {Math.round(selectedStudent.grades.reduce((sum, g) => sum + g.score, 0) / selectedStudent.grades.length)}点
                  </p>
                </div>
              </div>
              {selectedStudent.activities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selectedStudent.activities.map((act, i) => (
                    <span key={i} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{act}</span>
                  ))}
                </div>
              )}
              {selectedStudent.notes && (
                <div className="mt-3 bg-gray-50 rounded-md p-3">
                  <span className="text-[10px] text-gray-400">📝 担任メモ</span>
                  <p className="text-sm text-gray-700 mt-0.5">{selectedStudent.notes}</p>
                </div>
              )}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <h4 className="text-xs font-medium text-gray-500 mb-2">成績詳細</h4>
                <div className="grid grid-cols-5 gap-2">
                  {selectedStudent.grades.map(g => (
                    <div key={g.subject} className="text-center">
                      <p className="text-[10px] text-gray-400">{g.subject}</p>
                      <p className="text-sm font-bold text-gray-900">{g.score}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        g.grade === 'A' ? 'bg-emerald-50 text-emerald-700' :
                        g.grade === 'B' ? 'bg-blue-50 text-blue-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>{g.grade}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">生徒を選択すると、ここに情報が表示されます</p>
            </div>
          )}

          {selectedStudent && observations.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">観察メモ</span>
                <span className="text-[10px] text-gray-400">直近の記録</span>
              </div>
              <div className="space-y-2">
                {observations.slice(0, 5).map(obs => {
                  const c = categoryColors[obs.category];
                  return (
                    <div key={obs.id} className="flex items-start gap-2 text-sm">
                      <span className="text-xs text-gray-400 shrink-0 w-20 pt-0.5">{obs.date}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${c.bg} ${c.text}`}>
                        {categoryLabels[obs.category]}
                      </span>
                      <span className="text-gray-700">{obs.content}</span>
                    </div>
                  );
                })}
              </div>
              {observations.length > 5 && (
                <p className="text-xs text-gray-400 mt-2">他 {observations.length - 5} 件</p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {variants && (
            <GenerationResult content={variants[0]} variants={variants} label="所見ドラフト" onRefine={handleRefine} />
          )}
        </div>
      </div>
    </div>
  );
}
