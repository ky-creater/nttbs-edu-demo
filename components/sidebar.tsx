'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, MessageSquare, AlertTriangle, Shield, Archive } from 'lucide-react';

const navItems = [
  { href: '/', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/shoken', label: '所見ドラフト生成', icon: FileText },
  { href: '/documents', label: '通知文・文書生成', icon: MessageSquare },
  { href: '/library', label: '文書ライブラリ', icon: Archive },
  { href: '/risk', label: '不登校リスク分析', icon: AlertTriangle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-navy text-white flex flex-col z-50">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Shield className="w-7 h-7 text-primary-400" />
          <div>
            <h1 className="text-sm font-bold leading-tight">校務支援AI</h1>
            <p className="text-[10px] text-white/50">プラットフォーム</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map(item => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
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
      </nav>

      <div className="p-4 border-t border-white/10">
        <p className="text-[10px] text-white/30">Powered by K&Y AI</p>
        <p className="text-[10px] text-white/20">Demo Version</p>
      </div>
    </aside>
  );
}
