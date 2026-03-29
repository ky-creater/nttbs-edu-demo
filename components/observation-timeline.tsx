'use client';

import { useState, useEffect } from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import {
  getObservations,
  addObservation,
  categoryLabels,
  categoryColors,
  type Observation,
  type ObservationCategory,
} from '@/lib/observation-store';

const categories: ObservationCategory[] = ['learning', 'social', 'life', 'positive'];

export function ObservationTimeline({ studentId }: { studentId: string }) {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<ObservationCategory>('learning');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setObservations(getObservations(studentId));
  }, [studentId]);

  const handleAdd = () => {
    if (!content.trim()) return;
    const obs = addObservation(studentId, category, content.trim(), date);
    setObservations(prev => [obs, ...prev]);
    setContent('');
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">
          観察メモ
          <span className="text-[10px] text-gray-400 font-normal ml-2">
            {observations.length}件の記録
          </span>
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          メモを追加
        </button>
      </div>

      {/* 入力フォーム */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">日付</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1.5"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">カテゴリ</label>
              <div className="flex gap-1.5">
                {categories.map(cat => {
                  const c = categoryColors[cat];
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
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
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="気づいたことを自由に記入..."
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 mb-3 resize-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!content.trim()}
              className="text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 px-4 py-1.5 rounded-md transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      )}

      {/* タイムライン */}
      {observations.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">観察メモはまだありません</p>
          <p className="text-xs mt-1">日々の気づきを記録しましょう</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200" />
          <div className="space-y-3">
            {observations.map(obs => {
              const c = categoryColors[obs.category];
              return (
                <div key={obs.id} className="relative pl-8">
                  <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${c.bg.replace('50', '400').replace('bg-', 'bg-')}`}
                    style={{ backgroundColor: obs.category === 'learning' ? '#60a5fa' : obs.category === 'social' ? '#a78bfa' : obs.category === 'life' ? '#fbbf24' : '#34d399' }}
                  />
                  <div className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400">{obs.date}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${c.bg} ${c.text} ${c.border} border`}>
                        {categoryLabels[obs.category]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{obs.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
