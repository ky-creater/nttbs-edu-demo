'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, PenTool, Archive, UserCheck, AlertTriangle, Shield, MessageSquarePlus, FileText, BookOpen } from 'lucide-react';

interface NavGroup {
  label: string;
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; matchAlso?: string[] }[];
}

const navGroups: NavGroup[] = [
  {
    label: '毎日',
    items: [
      { href: '/', label: 'ダッシュボード', icon: LayoutDashboard },
      { href: '/observations', label: '観察メモ', icon: MessageSquarePlus },
      { href: '/students', label: '生徒一覧', icon: Users },
      { href: '/risk', label: '気になる生徒', icon: AlertTriangle },
    ],
  },
  {
    label: '作成',
    items: [
      { href: '/documents', label: '文書作成', icon: PenTool },
      { href: '/meeting-prep', label: '面談準備', icon: UserCheck },
      { href: '/shoken', label: '所見作成', icon: FileText },
    ],
  },
  {
    label: '管理',
    items: [
      { href: '/knowledge', label: '参考資料', icon: BookOpen },
      { href: '/library', label: '文書ライブラリ', icon: Archive },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-navy text-white flex flex-col z-50">
      <Link href="/" className="block p-5 border-b border-white/10 hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2">
          <Shield className="w-7 h-7 text-primary-400" />
          <div>
            <h1 className="text-sm font-bold leading-tight">校務支援AI</h1>
            <p className="text-[10px] text-white/50">プラットフォーム</p>
          </div>
        </div>
      </Link>

      <nav className="flex-1 py-2 overflow-y-auto">
        {navGroups.map(group => (
          <div key={group.label} className="mb-1">
            <p className="px-5 py-1.5 text-[10px] font-medium text-white/30 uppercase tracking-wider">
              {group.label}
            </p>
            {group.items.map(item => {
              const isActive = pathname === item.href || (item.matchAlso?.some(p => pathname === p));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-primary-600/20 text-primary-300 border-r-2 border-primary-400'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <p className="text-[10px] text-white/30">Powered by K&Y AI</p>
        <p className="text-[10px] text-white/20">Demo Version</p>
      </div>
    </aside>
  );
}
