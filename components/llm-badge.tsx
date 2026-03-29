import { Shield } from 'lucide-react';

export function LlmBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
      <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
      <div className="flex flex-col">
        <span className="text-xs font-medium text-emerald-800">国産ローカルLLM搭載</span>
        <span className="text-[10px] text-emerald-600">入力データはAI学習に一切利用されません</span>
      </div>
    </div>
  );
}
