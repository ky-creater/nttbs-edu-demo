'use client';

import { useState, useMemo } from 'react';
import { AlertTriangle, TrendingUp, Shield, Users, Brain, ChevronRight, Loader2, ChevronDown } from 'lucide-react';
import { LlmBadge } from '@/components/llm-badge';
import { getObservationsText } from '@/lib/observation-store';
import { mockStudents } from '@/data/mock-students';
import { calculateRiskScore, calculateRiskBreakdown, getRiskLevel, getRiskColor, getRiskLabel } from '@/lib/risk-calculator';
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        body: JSON.stringify({ studentId, observationNotes: getObservationsText(studentId) }),
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

  const handleToggleExpand = (studentId: string) => {
    setExpandedId(prev => prev === studentId ? null : studentId);
  };

  return (
    <div>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">気になる生徒</h1>
              <p className="text-sm text-gray-500 mt-1">出欠・成績データから支援が必要な生徒を自動検出し、AIが個別の対応プランを提案します</p>
            </div>
            <LlmBadge />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-red-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">要支援</p>
                <p className="text-3xl font-bold text-red-600">{highCount}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">サポート指標 60 以上</p>
            <p className="text-[10px] text-gray-400 mt-1">📊 出欠・成績データに基づく自動判定</p>
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
            <p className="text-xs text-gray-400 mt-2">サポート指標 30〜59</p>
            <p className="text-[10px] text-gray-400 mt-1">📊 出欠・成績データに基づく自動判定</p>
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
            <p className="text-xs text-gray-400 mt-2">サポート指標 29 以下</p>
            <p className="text-[10px] text-gray-400 mt-1">📊 出欠・成績データに基づく自動判定</p>
          </div>
        </div>

        {/* Student Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">生徒一覧（サポート指標 高い順）</h2>
            <span className="text-xs text-gray-400 ml-auto">指標行をクリックで内訳表示</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">氏名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">クラス</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">欠席合計</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">遅刻合計</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" title="出欠・成績データから算出した参考値です">サポート指標 <span className="normal-case text-[10px] text-gray-400 font-normal">(?)</span></th>
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
                  const isExpanded = student.id === expandedId;

                  const barColor =
                    level === 'high' ? 'bg-red-500' :
                    level === 'medium' ? 'bg-amber-400' :
                    'bg-emerald-400';

                  const breakdown = isExpanded ? calculateRiskBreakdown(student) : null;

                  const getBreakdownBarColor = (itemScore: number, max: number) => {
                    const ratio = itemScore / max;
                    if (ratio >= 0.7) return 'bg-red-500';
                    if (ratio >= 0.4) return 'bg-amber-400';
                    return 'bg-emerald-400';
                  };

                  return (
                    <>
                      <tr
                        key={student.id}
                        className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{student.grade}年{student.class}組</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{totalAbsent}日</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{totalLate}回</td>
                        <td
                          className="px-4 py-3 cursor-pointer select-none"
                          onClick={() => handleToggleExpand(student.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-800 w-8 text-right">{score}</span>
                            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${barColor}`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
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
                      {isExpanded && breakdown && (
                        <tr key={`${student.id}-breakdown`}>
                          <td colSpan={7} className="bg-gray-50 border-t border-gray-100 px-6 py-4">
                            <p className="text-xs font-semibold text-gray-600 mb-3">
                              サポート指標内訳 — {student.name}
                            </p>
                            <div className="space-y-3">
                              {/* 欠席率 */}
                              <div>
                                <div className="flex items-center gap-3 mb-0.5">
                                  <span className="text-xs text-gray-500 w-20">欠席率</span>
                                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-2 rounded-full ${getBreakdownBarColor(breakdown.absence.score, breakdown.absence.max)}`}
                                      style={{ width: `${(breakdown.absence.score / breakdown.absence.max) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-600 font-medium">
                                    {breakdown.absence.score}/{breakdown.absence.max}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-400 ml-[92px]">{breakdown.absence.label}</p>
                              </div>
                              {/* 遅刻傾向 */}
                              <div>
                                <div className="flex items-center gap-3 mb-0.5">
                                  <span className="text-xs text-gray-500 w-20">遅刻傾向</span>
                                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-2 rounded-full ${getBreakdownBarColor(breakdown.lateness.score, breakdown.lateness.max)}`}
                                      style={{ width: `${(breakdown.lateness.score / breakdown.lateness.max) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-600 font-medium">
                                    {breakdown.lateness.score}/{breakdown.lateness.max}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-400 ml-[92px]">{breakdown.lateness.label}</p>
                              </div>
                              {/* 悪化傾向 */}
                              <div>
                                <div className="flex items-center gap-3 mb-0.5">
                                  <span className="text-xs text-gray-500 w-20">悪化傾向</span>
                                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-2 rounded-full ${getBreakdownBarColor(breakdown.trend.score, breakdown.trend.max)}`}
                                      style={{ width: `${(breakdown.trend.score / breakdown.trend.max) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-600 font-medium">
                                    {breakdown.trend.score}/{breakdown.trend.max}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-400 ml-[92px]">{breakdown.trend.label}</p>
                              </div>
                              {/* 成績低下 */}
                              <div>
                                <div className="flex items-center gap-3 mb-0.5">
                                  <span className="text-xs text-gray-500 w-20">成績低下</span>
                                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-2 rounded-full ${getBreakdownBarColor(breakdown.grades.score, breakdown.grades.max)}`}
                                      style={{ width: `${(breakdown.grades.score / breakdown.grades.max) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-600 font-medium">
                                    {breakdown.grades.score}/{breakdown.grades.max}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-400 ml-[92px]">{breakdown.grades.label}</p>
                              </div>
                            </div>
                            {/* データソース */}
                            <div className="border-t border-gray-100 pt-3 mt-3">
                              <p className="text-[11px] text-gray-400">📊 出欠データ: 校務支援システム（出欠管理）</p>
                              <p className="text-[11px] text-gray-400">📊 成績データ: 校務支援システム（成績管理）</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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

                {/* Data Sources */}
                <div className="px-5 py-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">データソース</p>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">📊 出欠データ: 校務支援システム（出欠管理）</p>
                    <p className="text-xs text-gray-400">📊 成績データ: 校務支援システム（成績管理）</p>
                    <p className="text-xs text-gray-400">📝 担任メモ: 教員入力</p>
                    <p className="text-xs text-gray-400">🤖 分析: 上記データをAIが統合分析</p>
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
