'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockStudents } from '@/data/mock-students';
import { calculateRiskScore, getRiskLevel, getRiskColor, getRiskLabel } from '@/lib/risk-calculator';
import { Search } from 'lucide-react';

const CLASS_FILTERS = [
  { label: '全て', value: 0 },
  { label: '1組', value: 1 },
  { label: '2組', value: 2 },
  { label: '3組', value: 3 },
];

export default function StudentsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState(0);

  const filtered = mockStudents.filter(s => {
    const matchName = s.name.includes(searchQuery);
    const matchClass = selectedClass === 0 || s.class === selectedClass;
    return matchName && matchClass;
  });

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">生徒一覧</h1>
        <p className="text-sm text-gray-500 mt-1">生徒を選択して校務データの統合ビューを確認できます</p>
      </div>

      {/* 検索・フィルタ */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="名前で検索..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <div className="flex gap-2">
          {CLASS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setSelectedClass(f.value)}
              className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                selectedClass === f.value
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 生徒カードグリッド */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.map(student => {
          const score = calculateRiskScore(student);
          const level = getRiskLevel(score);
          const colorClass = getRiskColor(level);
          const label = getRiskLabel(level);
          const avgScore = Math.round(
            student.grades.reduce((s, g) => s + g.score, 0) / (student.grades.length || 1)
          );

          return (
            <div
              key={student.id}
              onClick={() => router.push(`/students/${student.id}`)}
              className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{student.name}</p>
                  <p className="text-xs text-gray-500">
                    {student.grade}年{student.class}組 {student.number}番
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>
                  {label}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-3 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="text-gray-400">成績平均</span>
                  <span className="font-semibold text-gray-800">{avgScore}点</span>
                </span>
              </div>

              {student.activities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {student.activities.slice(0, 2).map((act, i) => (
                    <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {act}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-12 text-sm">該当する生徒が見つかりません</p>
      )}
    </div>
  );
}
