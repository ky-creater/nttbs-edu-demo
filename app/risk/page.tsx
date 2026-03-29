'use client';

import { useState, useMemo } from 'react';
import { AlertTriangle, TrendingUp, Shield, Users, Brain, ChevronRight, Loader2 } from 'lucide-react';
import { mockStudents } from '@/data/mock-students';
import { calculateRiskScore, getRiskLevel, getRiskColor, getRiskLabel } from '@/lib/risk-calculator';
import { Student } from '@/lib/types';

interface RiskAnalysis {
  riskFactors: string[];
  protectiveFactors: string[];
  immediateActions: string[];
  mediumTermPlan: string;
  stakeholders: string[];
}

interface StudentWithRisk extends Student {
  computedRiskScore: number;
}

export default function RiskPage() {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const studentsWithRisk: StudentWithRisk[] = useMemo(() => {
    return mockStudents
      .map(s => ({ ...s, computedRiskScore: calculateRiskScore(s) }))
      .sort((a, b) => b.computedRiskScore - a.computedRiskScore);
  }, []);

  const highCount = studentsWithRisk.filter(s => getRiskLevel(s.computedRiskScore) === 'high').length;
  const mediumCount = studentsWithRisk.filter(s => getRiskLevel(s.computedRiskScore) === 'medium').length;
  const lowCount = studentsWithRisk.filter(s => getRiskLevel(s.computedRiskScore) === 'low').length;

  const selectedStudent = studentsWithRisk.find(s => s.id === selectedStudentId) ?? null;

  const handleAnalyze = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setAnalysis(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/analyze-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });
      if (!res.ok) throw new Error('分析に失敗しました');
      const data = await res.json();
      setAnalysis(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">不登校リスクダッシュボード</h1>
          <p className="text-sm text-gray-500 mt-1">出欠・成績データをもとにリスクを自動算出し、AIによる個別支援プランを提案します</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-red-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">要注意</p>
                <p className="text-3xl font-bold text-red-600">{highCount}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">リスクスコア 60 以上</p>
          </div>
          <div className="bg-white rounded-lg border border-amber-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">経過観察</p>
                <p className="text-3xl font-bold text-amber-600">{mediumCount}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">リスクスコア 30〜59</p>
          </div>
          <div className="bg-white rounded-lg border border-emerald-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">安定</p>
                <p className="text-3xl font-bold text-emerald-600">{lowCount}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">リスクスコア 29 以下</p>
          </div>
        </div>

        {/* Student Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">生徒一覧（リスクスコア降順）</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">氏名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">クラス</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">欠席合計</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">遅刻合計</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">リスクスコア</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">レベル</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {studentsWithRisk.map(student => {
                  const score = student.computedRiskScore;
                  const level = getRiskLevel(score);
                  const colorClass = getRiskColor(level);
                  const label = getRiskLabel(level);
                  const totalAbsent = student.attendance.reduce((sum, m) => sum + m.absent, 0);
                  const totalLate = student.attendance.reduce((sum, m) => sum + m.late, 0);
                  const isSelected = student.id === selectedStudentId;

                  const barColor =
                    level === 'high' ? 'bg-red-500' :
                    level === 'medium' ? 'bg-amber-400' :
                    'bg-emerald-400';

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.grade}年{student.class}組</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{totalAbsent}日</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{totalLate}回</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800 w-8 text-right">{score}</span>
                          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColor}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${colorClass}`}>
                          {label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleAnalyze(student.id)}
                          disabled={loading && selectedStudentId === student.id}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Brain className="w-3 h-3" />
                          AI分析
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Analysis Panel */}
        {selectedStudentId && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-semibold text-gray-700">
                AI分析結果 — {selectedStudent?.name}（{selectedStudent?.grade}年{selectedStudent?.class}組）
              </h2>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p className="text-sm">AIが分析中です...</p>
              </div>
            )}

            {error && (
              <div className="p-5 text-sm text-red-600 bg-red-50 rounded-b-lg">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                {error}
              </div>
            )}

            {!loading && !error && analysis && (
              <div className="divide-y divide-gray-100">
                {/* Risk Factors */}
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <h3 className="text-sm font-semibold text-gray-700">リスク要因</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {analysis.riskFactors.map((factor, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <ChevronRight className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Protective Factors */}
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-semibold text-gray-700">保護要因</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {analysis.protectiveFactors.map((factor, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <ChevronRight className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Immediate Actions */}
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-gray-700">即時アクション</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {analysis.immediateActions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-xs flex items-center justify-center font-semibold mt-0.5">
                          {i + 1}
                        </span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Medium Term Plan */}
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-semibold text-gray-700">中期支援計画</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{analysis.mediumTermPlan}</p>
                </div>

                {/* Stakeholders */}
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-semibold text-gray-700">連携先</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.stakeholders.map((s, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
