export type KnowledgeCategory = 'template' | 'past_document' | 'school_info' | 'handover';

export interface KnowledgeItem {
  id: string;
  fileName: string;
  category: KnowledgeCategory;
  content: string;
  uploadedAt: string;
}

const STORAGE_KEY = 'edu-demo-knowledge';

export const knowledgeCategoryLabels: Record<KnowledgeCategory, string> = {
  template: '書式・テンプレート',
  past_document: '過去の文書',
  school_info: '学校・クラス情報',
  handover: '引き継ぎ・申し送り',
};

export const knowledgeCategoryDescriptions: Record<KnowledgeCategory, string> = {
  template: '通知文・通信・報告書のひな形',
  past_document: '昨年度の学級通信・報告書など実例',
  school_info: '校則・年間行事・クラス目標など',
  handover: '前任からのメモ・要注意事項',
};

const mockKnowledge: KnowledgeItem[] = [
  {
    id: 'k-001',
    fileName: '令和6年度_学級通信テンプレート.docx',
    category: 'template',
    content: `【学級通信テンプレート】\n\n○○中学校 2年○組 学級通信「ひまわり」第○号\n\n保護者の皆様へ\n\nいつも本校の教育活動にご理解とご協力をいただき、誠にありがとうございます。\n\n■今月のトピック\n・体育祭に向けた準備が始まりました。生徒たちは実行委員を中心に、クラスの団結を深めています。\n・中間テストの結果を踏まえ、放課後学習会を実施します。\n\n■お知らせ\n・11月15日（金）保護者面談を実施いたします。別紙のご案内をご確認ください。\n\n■担任から\n子どもたちの成長を日々感じております。ご家庭でもぜひ学校の話を聞いてあげてください。\n\n○○中学校 担任 ○○`,
    uploadedAt: '2025-01-10T09:00:00',
  },
  {
    id: 'k-002',
    fileName: '保護者面談_案内文_前回.docx',
    category: 'past_document',
    content: `保護者各位\n\n○○中学校\n校長 ○○ ○○\n\n保護者面談のご案内\n\n平素は本校の教育活動にご理解とご協力を賜り、厚く御礼申し上げます。\n下記の通り保護者面談を実施いたします。お忙しい中恐れ入りますが、ご出席くださいますようお願い申し上げます。\n\n記\n\n1. 期間: 令和○年○月○日（○）〜○月○日（○）\n2. 時間: 15:30〜17:00（お一人15分程度）\n3. 場所: 各教室\n4. 持ち物: 上履き\n\n※日程調整票を○月○日までにご提出ください。\n※ご都合がつかない場合は担任までご連絡ください。`,
    uploadedAt: '2025-01-08T14:00:00',
  },
  {
    id: 'k-003',
    fileName: '前任担任_引き継ぎメモ_2年3組.docx',
    category: 'handover',
    content: `【2年3組 引き継ぎメモ】\n\n■クラスの雰囲気\n全体的に穏やかで協力的なクラス。男女間の仲も良好。ただし、一部グループ間の関係に注意が必要。\n\n■要注意生徒\n・高橋健太: 1学期後半から欠席が増加。家庭環境の変化（両親の離婚）あり。スクールカウンセラーとの面談を継続中。\n・中村翔: 感情コントロールに課題。トラブル時は個別対応で落ち着く。保護者は協力的。\n\n■保護者対応メモ\n・佐藤さんの保護者: 心配性な傾向あり。こまめな連絡を好む。\n・山田さんの保護者: 仕事が多忙。連絡帳よりメール連絡が確実。\n\n■学習面\n・数学の理解度にばらつきあり。習熟度別の対応を推奨。\n・英語は全体的に好成績。ALTの授業に積極的。`,
    uploadedAt: '2025-01-05T10:00:00',
  },
  {
    id: 'k-004',
    fileName: '教育委員会_報告書テンプレート.docx',
    category: 'template',
    content: `【教育委員会報告書テンプレート】\n\n令和○年○月○日\n○○市教育委員会 御中\n\n○○中学校\n校長 ○○ ○○\n\n○○に関する報告書\n\n1. 概要\n（事案の概要を簡潔に記載）\n\n2. 経緯\n（時系列で経過を記載）\n\n3. 現在の状況\n（現時点での生徒・関係者の状態）\n\n4. 学校の対応\n（実施した対応・支援内容）\n\n5. 今後の方針\n（今後予定している対応）\n\n6. 保護者への対応\n（保護者への説明・連携状況）\n\n以上`,
    uploadedAt: '2025-01-03T11:00:00',
  },
  {
    id: 'k-005',
    fileName: '年間行事予定_令和6年度.pdf',
    category: 'school_info',
    content: `【令和6年度 年間行事予定（抜粋）】\n\n4月: 入学式、始業式、学級開き、身体測定\n5月: 中間テスト、修学旅行（3年）、授業参観\n6月: 体育祭、教育実習\n7月: 期末テスト、保護者面談、終業式\n9月: 始業式、防災訓練\n10月: 文化祭、中間テスト\n11月: 保護者面談、進路説明会（3年）\n12月: 期末テスト、終業式\n1月: 始業式、実力テスト\n2月: 学年末テスト、入学説明会\n3月: 卒業式、修了式`,
    uploadedAt: '2025-01-02T09:00:00',
  },
];

let initialized = false;

function ensureInitialized(): void {
  if (typeof window === 'undefined') return;
  if (initialized) return;
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockKnowledge));
  }
  initialized = true;
}

export function getKnowledgeItems(): KnowledgeItem[] {
  ensureInitialized();
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as KnowledgeItem[];
}

export function addKnowledgeItem(fileName: string, category: KnowledgeCategory, content: string): KnowledgeItem {
  ensureInitialized();
  const item: KnowledgeItem = {
    id: `k-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fileName,
    category,
    content,
    uploadedAt: new Date().toISOString(),
  };
  const raw = localStorage.getItem(STORAGE_KEY);
  const all: KnowledgeItem[] = raw ? JSON.parse(raw) : [];
  all.push(item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return item;
}

export function deleteKnowledgeItem(id: string): void {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  const all: KnowledgeItem[] = JSON.parse(raw);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.filter(item => item.id !== id)));
}

export function getKnowledgeContext(): string {
  const items = getKnowledgeItems();
  if (items.length === 0) return '';
  return items
    .map(item => `【${knowledgeCategoryLabels[item.category]}】${item.fileName}\n${item.content}`)
    .join('\n\n---\n\n');
}
