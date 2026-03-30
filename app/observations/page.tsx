'use client';

import { useState, useEffect, useMemo } from 'react';
import { MessageSquarePlus, Sparkles, Loader2, Plus, Mic, MicOff } from 'lucide-react';
import Link from 'next/link';
import { mockStudents } from '@/data/mock-students';
import { LlmBadge } from '@/components/llm-badge';
import {
  getObservations,
  getAllRecentObservations,
  addObservation,
  categoryLabels,
  categoryColors,
  type Observation,
  type ObservationCategory,
} from '@/lib/observation-store';

const categories: ObservationCategory[] = ['learning', 'social', 'life', 'positive'];

export default function ObservationsPage() {
  const [mode, setMode] = useState<'individual' | 'bulk'>('individual');
  const [recentObs, setRecentObs] = useState<(Observation & { studentName?: string })[]>([]);

  // Individual mode
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [category, setCategory] = useState<ObservationCategory>('learning');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [savedCount, setSavedCount] = useState(0);

  // Bulk mode
  const [bulkText, setBulkText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ studentName: string; category: string; content: string }[] | null>(null);
  const [bulkSaved, setBulkSaved] = useState(false);

  // Speech recognition
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    refreshRecent();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognitionCtor();
      rec.lang = 'ja-JP';
      rec.continuous = true;
      rec.interimResults = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (mode === 'bulk') {
          setBulkText(transcript);
        } else {
          setContent(transcript);
        }
      };
      rec.onend = () => setIsListening(false);
      setRecognition(rec);
    }
  }, [mode]);

  const refreshRecent = () => {
    const obs = getAllRecentObservations(20).map(o => ({
      ...o,
      studentName: mockStudents.find(s => s.id === o.studentId)?.name,
    }));
    setRecentObs(obs);
  };

  const handleAddIndividual = () => {
    if (!selectedStudentId || !content.trim()) return;
    addObservation(selectedStudentId, category, content.trim(), date);
    setContent('');
    setSavedCount(prev => prev + 1);
    refreshRecent();
    // Keep student selected for continuous input
  };

  const handleBulkParse = async () => {
    if (!bulkText.trim()) return;
    setBulkLoading(true);
    setBulkResults(null);
    setBulkSaved(false);
    try {
      const res = await fetch('/api/parse-observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: bulkText,
          studentNames: mockStudents.map(s => ({ id: s.id, name: s.name, class: `${s.grade}年${s.class}組` })),
        }),
      });
      if (!res.ok) throw new Error('解析に失敗しました');
      const data = await res.json();
      setBulkResults(data.observations);
    } catch {
      setBulkResults(null);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkSave = () => {
    if (!bulkResults) return;
    const today = new Date().toISOString().split('T')[0];
    for (const item of bulkResults) {
      const student = mockStudents.find(s => s.name === item.studentName);
      if (student) {
        const cat = (Object.entries(categoryLabels).find(([, v]) => v === item.category)?.[0] || 'life') as ObservationCategory;
        addObservation(student.id, cat, item.content, today);
      }
    }
    setBulkSaved(true);
    setBulkText('');
    refreshRecent();
  };

  const toggleListening = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">観察メモ</h1>
            <p className="mt-1 text-sm text-gray-500">
              日々の気づきを記録。蓄積されたメモはAI分析・面談準備に自動反映されます。
            </p>
          </div>
          <LlmBadge />
        </div>
      </div>

      {/* モード切替 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('individual')}
          className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
            mode === 'individual'
              ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Plus className="w-4 h-4 inline mr-1.5" />
          個別入力
        </button>
        <button
          onClick={() => setMode('bulk')}
          className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
            mode === 'bulk'
              ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-1.5" />
          まとめて入力（AI差配）
        </button>
      </div>

      {/* 個別入力モード */}
      {mode === 'individual' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">生徒</label>
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">選択してください</option>
                {mockStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}（{s.grade}年{s.class}組）
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">日付</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">カテゴリ</label>
              <div className="flex gap-1.5 flex-wrap">
                {categories.map(cat => {
                  const c = categoryColors[cat];
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                        category === cat
                          ? `${c.bg} ${c.text} ${c.border} font-medium`
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {categoryLabels[cat]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="relative mb-4">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="気づいたことを自由に記入...（例: 休み時間に一人で教室にいた）"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 pr-12 resize-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
            />
            {recognition && (
              <button
                onClick={toggleListening}
                className={`absolute right-3 top-3 p-2 rounded-lg transition-colors ${
                  isListening
                    ? 'bg-red-100 text-red-600 animate-pulse'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                }`}
                title={isListening ? '音声入力を停止' : '音声で入力'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              {savedCount > 0 && (
                <span className="text-xs text-emerald-600">
                  このセッションで {savedCount} 件保存しました
                </span>
              )}
            </div>
            <button
              onClick={handleAddIndividual}
              disabled={!selectedStudentId || !content.trim()}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 px-5 py-2.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              保存して次へ
            </button>
          </div>
        </div>
      )}

      {/* まとめ入力モード */}
      {mode === 'bulk' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="mb-3">
            <p className="text-sm text-gray-700 mb-1">
              今日の気づきをまとめて書いてください。AIが自動で生徒ごとに振り分けます。
            </p>
            <p className="text-xs text-gray-400">
              例: 「高橋が朝のHRに遅れてきた。佐藤は保健室に2回行っていた。山田の英語提出物が未提出。中村は理科の実験で積極的だった。」
            </p>
          </div>

          <div className="relative mb-4">
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder="今日の気づきを自由に書いてください..."
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 pr-12 resize-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              rows={5}
            />
            {recognition && (
              <button
                onClick={toggleListening}
                className={`absolute right-3 top-3 p-2 rounded-lg transition-colors ${
                  isListening
                    ? 'bg-red-100 text-red-600 animate-pulse'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                }`}
                title={isListening ? '音声入力を停止' : '音声で入力'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
          </div>

          <button
            onClick={handleBulkParse}
            disabled={!bulkText.trim() || bulkLoading}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 px-5 py-2.5 rounded-lg transition-colors"
          >
            {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AIで振り分ける
          </button>

          {/* AI差配結果 */}
          {bulkResults && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <h3 className="text-sm font-medium text-gray-800 mb-3">
                振り分け結果（{bulkResults.length}件）
              </h3>
              <div className="space-y-2 mb-4">
                {bulkResults.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <span className="text-xs font-medium text-primary-700 bg-primary-50 px-2 py-1 rounded shrink-0">
                      {item.studentName}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                      categoryColors[(Object.entries(categoryLabels).find(([, v]) => v === item.category)?.[0] || 'life') as ObservationCategory]?.bg || 'bg-gray-100'
                    } ${
                      categoryColors[(Object.entries(categoryLabels).find(([, v]) => v === item.category)?.[0] || 'life') as ObservationCategory]?.text || 'text-gray-600'
                    }`}>
                      {item.category}
                    </span>
                    <span className="text-sm text-gray-700">{item.content}</span>
                  </div>
                ))}
              </div>
              {!bulkSaved ? (
                <button
                  onClick={handleBulkSave}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-lg transition-colors"
                >
                  全て保存する
                </button>
              ) : (
                <p className="text-sm text-emerald-600 font-medium">保存しました</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 最近の観察メモ */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          最近の観察メモ
          <span className="text-xs text-gray-400 font-normal ml-2">全生徒</span>
        </h2>
        {recentObs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">観察メモはまだありません</p>
        ) : (
          <div className="space-y-2">
            {recentObs.map(obs => {
              const c = categoryColors[obs.category];
              return (
                <div key={obs.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-xs text-gray-400 shrink-0 w-20">{obs.date}</span>
                  <Link href={`/students/${obs.studentId}`} className="text-xs font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded shrink-0 w-20 text-center hover:bg-primary-100 transition-colors">
                    {obs.studentName}
                  </Link>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${c.bg} ${c.text} border ${c.border} shrink-0`}>
                    {categoryLabels[obs.category]}
                  </span>
                  <span className="text-sm text-gray-700">{obs.content}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
