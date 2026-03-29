export type ObservationCategory = 'learning' | 'social' | 'life' | 'positive';

export interface Observation {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  category: ObservationCategory;
  content: string;
  createdAt: string;
}

const STORAGE_KEY = 'edu-demo-observations';

export const categoryLabels: Record<ObservationCategory, string> = {
  learning: '学習',
  social: '対人',
  life: '生活',
  positive: 'ポジティブ',
};

export const categoryColors: Record<ObservationCategory, { bg: string; text: string; border: string }> = {
  learning: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  social: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  life: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  positive: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

// モックデータ: 要支援生徒にプリセット
const mockObservations: Observation[] = [
  // 高橋 健太 (s-001) - リスク高
  { id: 'obs-001', studentId: 's-001', date: '2025-01-20', category: 'life', content: '朝のHRに遅れて入室。表情が暗く、声をかけても反応が薄い。', createdAt: '2025-01-20T08:30:00' },
  { id: 'obs-002', studentId: 's-001', date: '2025-01-15', category: 'social', content: '休み時間に一人で教室に残っていた。友人グループとの距離がある様子。', createdAt: '2025-01-15T10:15:00' },
  { id: 'obs-003', studentId: 's-001', date: '2025-01-08', category: 'learning', content: '数学の小テストで白紙提出。前回は70点だったので急な変化。', createdAt: '2025-01-08T14:00:00' },
  { id: 'obs-004', studentId: 's-001', date: '2024-12-18', category: 'positive', content: '放課後、部活の後輩に丁寧にアドバイスしている姿を確認。面倒見の良さは健在。', createdAt: '2024-12-18T16:30:00' },
  // 佐藤 美咲 (s-002) - リスク中
  { id: 'obs-005', studentId: 's-002', date: '2025-01-22', category: 'life', content: '保健室に行く頻度が増えている（今週2回目）。体調不良を訴えるが、特定の授業前が多い。', createdAt: '2025-01-22T11:00:00' },
  { id: 'obs-006', studentId: 's-002', date: '2025-01-14', category: 'social', content: '昼休みに別クラスの友人と一緒にいることが増えた。クラス内の友人関係に変化か。', createdAt: '2025-01-14T12:30:00' },
  { id: 'obs-007', studentId: 's-002', date: '2025-01-10', category: 'positive', content: '文化祭実行委員に自ら立候補。意欲的な姿勢が見られる。', createdAt: '2025-01-10T15:00:00' },
  // 山田 太郎 (s-003) - リスク中
  { id: 'obs-008', studentId: 's-003', date: '2025-01-21', category: 'learning', content: '英語の提出物が3回連続未提出。前学期は提出率100%だった。', createdAt: '2025-01-21T09:00:00' },
  { id: 'obs-009', studentId: 's-003', date: '2025-01-17', category: 'life', content: '昼食を食べていない様子。弁当を持ってきていなかった。', createdAt: '2025-01-17T12:20:00' },
  { id: 'obs-010', studentId: 's-003', date: '2025-01-06', category: 'positive', content: '体育のバスケでチームを盛り上げていた。運動面では活発。', createdAt: '2025-01-06T14:30:00' },
  // 中村 翔 (s-011) - リスク高
  { id: 'obs-011', studentId: 's-011', date: '2025-01-23', category: 'social', content: '授業中に隣の席の生徒と口論。些細なことで感情的になる場面が増えている。', createdAt: '2025-01-23T10:30:00' },
  { id: 'obs-012', studentId: 's-011', date: '2025-01-16', category: 'life', content: '3日連続の遅刻。起床困難とのこと。生活リズムの乱れが顕著。', createdAt: '2025-01-16T08:45:00' },
  { id: 'obs-013', studentId: 's-011', date: '2025-01-09', category: 'learning', content: '理科の実験では積極的に参加。手を動かす活動には集中できている。', createdAt: '2025-01-09T11:00:00' },
  // 渡辺 花 (s-021) - リスク中
  { id: 'obs-014', studentId: 's-021', date: '2025-01-22', category: 'social', content: '部活動を休みがち。顧問によると「行きたくない」と話しているとのこと。', createdAt: '2025-01-22T16:00:00' },
  { id: 'obs-015', studentId: 's-021', date: '2025-01-13', category: 'positive', content: '美術の授業で素晴らしい作品を完成。クラスメイトから称賛を受けていた。', createdAt: '2025-01-13T14:00:00' },
];

let initialized = false;

function ensureInitialized(): void {
  if (typeof window === 'undefined') return;
  if (initialized) return;
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockObservations));
  }
  initialized = true;
}

export function getObservations(studentId: string): Observation[] {
  ensureInitialized();
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const all: Observation[] = JSON.parse(raw);
  return all
    .filter(o => o.studentId === studentId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAllRecentObservations(limit: number = 10): Observation[] {
  ensureInitialized();
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const all: Observation[] = JSON.parse(raw);
  return all
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function addObservation(studentId: string, category: ObservationCategory, content: string, date: string): Observation {
  ensureInitialized();
  const obs: Observation = {
    id: `obs-${Date.now()}`,
    studentId,
    date,
    category,
    content,
    createdAt: new Date().toISOString(),
  };
  const raw = localStorage.getItem(STORAGE_KEY);
  const all: Observation[] = raw ? JSON.parse(raw) : [];
  all.push(obs);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return obs;
}

export function getObservationsText(studentId: string): string {
  const obs = getObservations(studentId);
  if (obs.length === 0) return '';
  return obs
    .map(o => `[${o.date}][${categoryLabels[o.category]}] ${o.content}`)
    .join('\n');
}
