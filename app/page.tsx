import { mockStudents } from '@/data/mock-students';
import { calculateRiskScore, getRiskLevel } from '@/lib/risk-calculator';
import { Users, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const studentsWithRisk = mockStudents.map(s => ({
    ...s,
    riskScore: calculateRiskScore(s),
  }));

  const totalStudents = studentsWithRisk.length;
  const highRisk = studentsWithRisk.filter(s => getRiskLevel(s.riskScore!) === 'high').length;
  const mediumRisk = studentsWithRisk.filter(s => getRiskLevel(s.riskScore!) === 'medium').length;
  const avgScore = Math.round(
    studentsWithRisk.reduce((sum, s) => sum + s.grades.reduce((gs, g) => gs + g.score, 0) / s.grades.length, 0) / totalStudents
  );

  const kpis = [
    { label: '生徒数', value: totalStudents, unit: '名', icon: Users, color: 'bg-primary-50 text-primary-600' },
    { label: '要注意生徒', value: highRisk, unit: '名', icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
    { label: '経過観察', value: mediumRisk, unit: '名', icon: TrendingUp, color: 'bg-amber-50 text-amber-600' },
    { label: '平均点', value: avgScore, unit: '点', icon: FileText, color: 'bg-emerald-50 text-emerald-600' },
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
        <h2 className="text-sm font-semibold text-gray-900 mb-3">要注意生徒一覧</h2>
        <div className="space-y-2">
          {studentsWithRisk
            .filter(s => getRiskLevel(s.riskScore!) !== 'low')
            .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
            .slice(0, 5)
            .map(student => (
              <div key={student.id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">{student.name}</span>
                  <span className="text-xs text-gray-400">{student.grade}年{student.class}組</span>
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
