import { mockStudents } from '@/data/mock-students';
import { calculateRiskScore, getRiskLevel, calculateRiskBreakdown } from '@/lib/risk-calculator';
import { Users, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

function countAbsenceIncreasing(students: typeof mockStudents): number {
  return students.filter(s => {
    const attendance = s.attendance;
    if (attendance.length < 6) return false;
    const early = attendance.slice(0, 3);
    const recent = attendance.slice(-3);
    const earlyAvg = early.reduce((sum, m) => sum + m.absent, 0) / 3;
    const recentAvg = recent.reduce((sum, m) => sum + m.absent, 0) / 3;
    return recentAvg > earlyAvg * 2 && recentAvg > 0;
  }).length;
}

function countGradeLow(students: typeof mockStudents): number {
  return students.filter(s => {
    const avg = s.grades.reduce((sum, g) => sum + g.score, 0) / (s.grades.length || 1);
    return avg < 55;
  }).length;
}

function countLatenessTendency(students: typeof mockStudents): number {
  return students.filter(s => {
    const recent = s.attendance.slice(-3);
    const totalLate = recent.reduce((sum, m) => sum + m.late, 0);
    return totalLate >= 5;
  }).length;
}

function getTopRiskFactor(student: (typeof mockStudents)[0]): string {
  const bd = calculateRiskBreakdown(student);
  const factors = [
    { label: '欠席増加', score: bd.trend.score },
    { label: '欠席多数', score: bd.absence.score },
    { label: '遅刻傾向', score: bd.lateness.score },
    { label: '成績低下', score: bd.grades.score },
  ];
  const top = factors.reduce((prev, cur) => (cur.score > prev.score ? cur : prev));
  return top.score > 0 ? top.label : '複合要因';
}

export default function DashboardPage() {
  const studentsWithRisk = mockStudents.map(s => ({
    ...s,
    riskScore: calculateRiskScore(s),
  }));

  const totalStudents = studentsWithRisk.length;
  const absenceIncreasing = countAbsenceIncreasing(mockStudents);
  const gradeLow = countGradeLow(mockStudents);
  const latenessTendency = countLatenessTendency(mockStudents);

  const kpis = [
    {
      label: '生徒数',
      value: totalStudents,
      unit: '名',
      icon: Users,
      color: 'bg-primary-50 text-primary-600',
      source: '校務支援システム（学籍）',
    },
    {
      label: '欠席増加中',
      value: absenceIncreasing,
      unit: '名',
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-600',
      source: '校務支援システム（出欠管理）',
    },
    {
      label: '成績低下',
      value: gradeLow,
      unit: '名',
      icon: TrendingUp,
      color: 'bg-amber-50 text-amber-600',
      source: '校務支援システム（成績管理）',
    },
    {
      label: '遅刻傾向',
      value: latenessTendency,
      unit: '名',
      icon: FileText,
      color: 'bg-orange-50 text-orange-600',
      source: '校務支援システム（出欠管理）',
    },
  ];

  const features = [
    {
      href: '/shoken',
      title: '所見ドラフト生成',
      description: '生徒データをもとにAIが通知表所見を3パターン自動生成。編集・コピーしてそのまま活用できます。',
      badge: 'AI生成',
    },
    {
      href: '/documents',
      title: '通知文・文書生成',
      description: '学級通信、保護者通知、クレーム対応文書をAIがドラフト。文体も選択可能。',
      badge: 'AI生成',
    },
    {
      href: '/risk',
      title: '不登校リスク分析',
      description: '出欠データから不登校リスクを自動スコアリング。AIが対応提案も生成します。',
      badge: 'AI分析',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-sm text-gray-500 mt-1">校務支援AIプラットフォーム &#8212; デモ環境</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{kpi.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{kpi.value}</span>
                <span className="text-sm text-gray-400">{kpi.unit}</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">📊 {kpi.source}</p>
            </div>
          );
        })}
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">AI機能</h2>
      <div className="grid grid-cols-3 gap-4">
        {features.map((feature, i) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 text-[10px] font-medium bg-primary-50 text-primary-600 rounded-full">
                {feature.badge}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
              {feature.title}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-sm font-semibold text-gray-900">要注意生徒一覧</h2>
          <span className="text-[10px] text-gray-400">📊 出欠・成績データに基づく自動判定</span>
        </div>
        <div className="space-y-2">
          {studentsWithRisk
            .filter(s => getRiskLevel(s.riskScore!) !== 'low')
            .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
            .slice(0, 5)
            .map(student => (
              <div key={student.id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{student.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{student.grade}年{student.class}組</span>
                    <p className="text-xs text-gray-400">主要因: {getTopRiskFactor(student)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        getRiskLevel(student.riskScore!) === 'high' ? 'bg-red-500' : 'bg-amber-400'
                      }`}
                      style={{ width: `${student.riskScore}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    getRiskLevel(student.riskScore!) === 'high' ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {student.riskScore}点
                  </span>
                </div>
              </div>
            ))}
        </div>
        <Link
          href="/risk"
          className="mt-3 inline-block text-xs text-primary-600 hover:text-primary-700 font-medium"
        >
          全生徒のリスク分析を見る →
        </Link>
      </div>
    </div>
  );
}
