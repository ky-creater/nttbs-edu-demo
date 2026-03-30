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

// モックデータ: 2026年1月〜3月の直近データ（17名・43件）
const mockObservations: Observation[] = [
  // === 1組 ===
  // 田中 太郎 (s001) - リーダー・優等生
  { id: 'obs-101', studentId: 's001', date: '2026-03-24', category: 'positive', content: '学級会で全員の意見をまとめ、建設的な結論に導いた。ファシリテーション力が成長。', createdAt: '2026-03-24T15:00:00' },
  { id: 'obs-102', studentId: 's001', date: '2026-03-10', category: 'social', content: '休み時間に転入生に声をかけ、校内を案内していた。自然な気配りができる。', createdAt: '2026-03-10T10:30:00' },
  { id: 'obs-103', studentId: 's001', date: '2026-02-18', category: 'learning', content: '英語のスピーチコンテストに自ら応募。発音の練習を昼休みにも続けている。', createdAt: '2026-02-18T12:15:00' },

  // 鈴木 一郎 (s003) - 遅刻増加・友人関係変化
  { id: 'obs-104', studentId: 's003', date: '2026-03-27', category: 'life', content: '今週3回目の遅刻。「寝坊した」とのこと。表情に疲れが見える。', createdAt: '2026-03-27T08:35:00' },
  { id: 'obs-105', studentId: 's003', date: '2026-03-14', category: 'social', content: '以前仲が良かったグループと距離を置いている様子。昼食を一人で食べていた。', createdAt: '2026-03-14T12:20:00' },
  { id: 'obs-106', studentId: 's003', date: '2026-02-25', category: 'positive', content: '美術の授業で集中して制作に取り組んでいた。作品の完成度が高い。', createdAt: '2026-02-25T14:30:00' },

  // 高橋 美咲 (s004) - テスト前体調不良
  { id: 'obs-107', studentId: 's004', date: '2026-03-18', category: 'life', content: 'テスト前日に早退。腹痛を訴えたが、前回のテスト前にも同様の症状。', createdAt: '2026-03-18T13:00:00' },
  { id: 'obs-108', studentId: 's004', date: '2026-02-20', category: 'positive', content: 'バレーボール部の試合で好プレー。チームメイトを鼓舞する声掛けも。', createdAt: '2026-02-20T16:00:00' },

  // 伊藤 健太 (s005) - 不登校傾向
  { id: 'obs-001', studentId: 's005', date: '2026-03-25', category: 'life', content: '朝のHRに遅れて入室。表情が暗く、声をかけても反応が薄い。', createdAt: '2026-03-25T08:30:00' },
  { id: 'obs-002', studentId: 's005', date: '2026-03-12', category: 'social', content: '休み時間に一人で教室に残っていた。友人グループとの距離がある様子。', createdAt: '2026-03-12T10:15:00' },
  { id: 'obs-003', studentId: 's005', date: '2026-02-27', category: 'learning', content: '数学の小テストで白紙提出。前回は70点だったので急な変化。', createdAt: '2026-02-27T14:00:00' },
  { id: 'obs-004', studentId: 's005', date: '2026-02-06', category: 'positive', content: '放課後、廊下で後輩に丁寧に話しかけている姿を確認。面倒見の良さは健在。', createdAt: '2026-02-06T16:30:00' },

  // 山本 翔太 (s007) - 集中力課題
  { id: 'obs-109', studentId: 's007', date: '2026-03-21', category: 'learning', content: '数学の授業中にスマホをいじっていた。注意後は素直に従うが、5分後に再び。', createdAt: '2026-03-21T10:00:00' },
  { id: 'obs-110', studentId: 's007', date: '2026-03-07', category: 'positive', content: 'バスケ部の練習試合でチームハイの18得点。運動面の集中力は抜群。', createdAt: '2026-03-07T17:00:00' },
  { id: 'obs-111', studentId: 's007', date: '2026-02-14', category: 'social', content: 'クラスメイトに気軽に声をかける姿が目立つ。ムードメーカー的存在。', createdAt: '2026-02-14T12:30:00' },

  // 中村 あかり (s008) - 元気がない
  { id: 'obs-005', studentId: 's008', date: '2026-03-26', category: 'life', content: '保健室に行く頻度が増えている（今週2回目）。体調不良を訴えるが、特定の授業前が多い。', createdAt: '2026-03-26T11:00:00' },
  { id: 'obs-006', studentId: 's008', date: '2026-03-11', category: 'social', content: '昼休みに別クラスの友人と一緒にいることが増えた。クラス内の友人関係に変化か。', createdAt: '2026-03-11T12:30:00' },
  { id: 'obs-007', studentId: 's008', date: '2026-02-19', category: 'positive', content: '合唱部の練習で積極的に声を出していた。音楽活動には意欲的。', createdAt: '2026-02-19T15:00:00' },

  // 小林 大輝 (s009) - 部活熱心・学習支援必要
  { id: 'obs-112', studentId: 's009', date: '2026-03-19', category: 'learning', content: '国語の読解問題で苦戦。文章を読むスピードが遅く、時間内に解き終わらない。', createdAt: '2026-03-19T11:00:00' },
  { id: 'obs-113', studentId: 's009', date: '2026-02-28', category: 'positive', content: '野球部の朝練に毎日参加。後輩への指導も丁寧で信頼されている。', createdAt: '2026-02-28T07:30:00' },

  // 加藤 優奈 (s010) - 理系志望・知的好奇心
  { id: 'obs-114', studentId: 's010', date: '2026-03-20', category: 'learning', content: '理科の自由研究で独自の仮説を立てて検証。論理的思考力が際立つ。', createdAt: '2026-03-20T15:00:00' },
  { id: 'obs-115', studentId: 's010', date: '2026-02-13', category: 'positive', content: '英語弁論大会の準備を自主的に進めている。放課後にALTに発音指導を依頼。', createdAt: '2026-02-13T16:30:00' },

  // === 2組 ===
  // 吉田 蓮 (s011) - 社交的・提出物課題
  { id: 'obs-116', studentId: 's011', date: '2026-03-26', category: 'learning', content: '数学のワークが2週間未提出。声をかけると「やります」と言うが提出されず。', createdAt: '2026-03-26T09:00:00' },
  { id: 'obs-117', studentId: 's011', date: '2026-03-06', category: 'social', content: '昼休みにクラス全体の遊びを企画。自然とみんなが集まる中心的存在。', createdAt: '2026-03-06T12:40:00' },

  // 山田 楓 (s012) - 創造力豊か
  { id: 'obs-118', studentId: 's012', date: '2026-03-17', category: 'positive', content: '文化祭のポスターデザインが校内で好評。「プロみたい」と他学年からも反響。', createdAt: '2026-03-17T14:00:00' },
  { id: 'obs-119', studentId: 's012', date: '2026-02-21', category: 'learning', content: '授業中にスケッチブックに絵を描いていた。注意すると切り替えはできる。', createdAt: '2026-02-21T10:30:00' },

  // 松本 陸 (s013) - 家庭環境課題
  { id: 'obs-011', studentId: 's013', date: '2026-03-28', category: 'social', content: '授業中に隣の席の生徒と口論。些細なことで感情的になる場面が増えている。', createdAt: '2026-03-28T10:30:00' },
  { id: 'obs-012', studentId: 's013', date: '2026-03-13', category: 'life', content: '3日連続の遅刻。起床困難とのこと。生活リズムの乱れが顕著。', createdAt: '2026-03-13T08:45:00' },
  { id: 'obs-013', studentId: 's013', date: '2026-02-24', category: 'learning', content: '理科の実験では積極的に参加。手を動かす活動には集中できている。', createdAt: '2026-02-24T11:00:00' },

  // 木村 悠斗 (s015) - ゲーム依存・遅刻増加
  { id: 'obs-008', studentId: 's015', date: '2026-03-24', category: 'learning', content: '英語の提出物が3回連続未提出。前学期は提出率100%だった。', createdAt: '2026-03-24T09:00:00' },
  { id: 'obs-009', studentId: 's015', date: '2026-03-10', category: 'life', content: '昼食を食べていない様子。弁当を持ってきていなかった。', createdAt: '2026-03-10T12:20:00' },
  { id: 'obs-010', studentId: 's015', date: '2026-02-12', category: 'positive', content: '体育のバスケでチームを盛り上げていた。運動面では活発。', createdAt: '2026-02-12T14:30:00' },

  // 山口 海斗 (s019) - 文武両道
  { id: 'obs-120', studentId: 's019', date: '2026-03-22', category: 'positive', content: '水泳の県大会で2位入賞。クラスメイトが教室で拍手で迎えていた。', createdAt: '2026-03-22T08:40:00' },
  { id: 'obs-121', studentId: 's019', date: '2026-02-26', category: 'social', content: '委員会活動で下級生の意見を丁寧に聞き取り。リーダーシップが自然。', createdAt: '2026-02-26T15:30:00' },

  // 中島 彩花 (s020) - 休みがち
  { id: 'obs-014', studentId: 's020', date: '2026-03-25', category: 'social', content: '部活動を休みがち。顧問によると「行きたくない」と話しているとのこと。', createdAt: '2026-03-25T16:00:00' },
  { id: 'obs-015', studentId: 's020', date: '2026-02-17', category: 'positive', content: '音楽の授業で素晴らしい演奏を披露。クラスメイトから称賛を受けていた。', createdAt: '2026-02-17T14:00:00' },

  // === 3組 ===
  // 後藤 大和 (s023) - 授業態度課題
  { id: 'obs-127', studentId: 's023', date: '2026-03-23', category: 'learning', content: '社会の授業中に居眠り。前日のサッカー練習で疲れている様子。', createdAt: '2026-03-23T13:30:00' },
  { id: 'obs-128', studentId: 's023', date: '2026-03-05', category: 'positive', content: 'サッカー部の練習で後輩に熱心に指導。技術面だけでなく声掛けも丁寧。', createdAt: '2026-03-05T17:30:00' },

  // 近藤 陽翔 (s025) - 長期欠席
  { id: 'obs-122', studentId: 's025', date: '2026-03-19', category: 'life', content: '適応指導教室に週2回通所中。スタッフによると少しずつ会話が増えているとのこと。', createdAt: '2026-03-19T14:00:00' },
  { id: 'obs-123', studentId: 's025', date: '2026-01-30', category: 'positive', content: '月1回の面談で「3年生になったら学校に行きたい」と前向きな発言あり。', createdAt: '2026-01-30T15:00:00' },

  // 遠藤 日向 (s028) - 保健室利用増加
  { id: 'obs-124', studentId: 's028', date: '2026-03-27', category: 'life', content: '今週3回目の保健室利用。頭痛を訴えるが、養護教諭によると「話を聞いてほしい様子」。', createdAt: '2026-03-27T11:00:00' },
  { id: 'obs-125', studentId: 's028', date: '2026-03-13', category: 'social', content: '部活の先輩との関係がぎくしゃくしている様子。練習中に涙ぐむ場面あり。', createdAt: '2026-03-13T17:00:00' },
  { id: 'obs-126', studentId: 's028', date: '2026-02-10', category: 'positive', content: '授業中の発表で自分の意見をしっかり述べていた。内容も的確。', createdAt: '2026-02-10T10:00:00' },
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
