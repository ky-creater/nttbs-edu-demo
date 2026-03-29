import { Student } from '@/lib/types';

function generateAttendance(pattern: 'good' | 'moderate' | 'poor' | 'declining') {
  const months = [4, 5, 6, 7, 9, 10, 11, 12, 1, 2, 3];
  return months.map((month, i) => {
    let absent = 0, late = 0;
    const schoolDays = month === 7 || month === 3 ? 15 : 20;
    switch (pattern) {
      case 'good':
        absent = Math.floor(Math.random() * 2);
        late = Math.floor(Math.random() * 2);
        break;
      case 'moderate':
        absent = 1 + Math.floor(Math.random() * 3);
        late = Math.floor(Math.random() * 4);
        break;
      case 'poor':
        absent = 4 + Math.floor(Math.random() * 6);
        late = 2 + Math.floor(Math.random() * 5);
        break;
      case 'declining':
        absent = Math.min(Math.floor(i * 0.8 + Math.random() * 3), schoolDays - 5);
        late = Math.min(Math.floor(i * 0.5 + Math.random() * 2), 8);
        break;
    }
    return {
      month,
      present: schoolDays - absent,
      absent,
      late,
      earlyLeave: Math.floor(Math.random() * 2),
    };
  });
}

const subjectsBase = ['国語', '数学', '英語', '理科', '社会'];

function generateGrades(level: 'high' | 'mid' | 'low') {
  return subjectsBase.map(subject => {
    let base: number;
    switch (level) {
      case 'high': base = 75 + Math.floor(Math.random() * 25); break;
      case 'mid': base = 55 + Math.floor(Math.random() * 25); break;
      case 'low': base = 30 + Math.floor(Math.random() * 30); break;
    }
    return {
      subject,
      score: base,
      grade: (base >= 80 ? 'A' : base >= 60 ? 'B' : 'C') as 'A' | 'B' | 'C',
    };
  });
}

export const mockStudents: Student[] = [
  { id: 's001', name: '田中 太郎', grade: 2, class: 1, number: 1, gender: '男', attendance: generateAttendance('good'), grades: generateGrades('high'), activities: ['サッカー部キャプテン', '生徒会副会長'], notes: 'リーダーシップがあり、クラスをまとめる存在' },
  { id: 's002', name: '佐藤 花子', grade: 2, class: 1, number: 2, gender: '女', attendance: generateAttendance('good'), grades: generateGrades('high'), activities: ['吹奏楽部', '学級委員'], notes: '真面目で努力家、友人関係も良好' },
  { id: 's003', name: '鈴木 一郎', grade: 2, class: 1, number: 3, gender: '男', attendance: generateAttendance('declining'), grades: generateGrades('mid'), activities: ['美術部'], notes: '2学期から遅刻が増加傾向。友人関係に変化あり' },
  { id: 's004', name: '高橋 美咲', grade: 2, class: 1, number: 4, gender: '女', attendance: generateAttendance('moderate'), grades: generateGrades('mid'), activities: ['バレーボール部'], notes: '明るい性格だが、テスト前に体調不良で休むことが多い' },
  { id: 's005', name: '伊藤 健太', grade: 2, class: 1, number: 5, gender: '男', attendance: generateAttendance('poor'), grades: generateGrades('low'), activities: [], notes: '不登校傾向。保護者と連携して対応中' },
  { id: 's006', name: '渡辺 さくら', grade: 2, class: 1, number: 6, gender: '女', attendance: generateAttendance('good'), grades: generateGrades('high'), activities: ['テニス部', '図書委員'], notes: '文武両道。読書好きで国語が特に優秀' },
  { id: 's007', name: '山本 翔太', grade: 2, class: 1, number: 7, gender: '男', attendance: generateAttendance('moderate'), grades: generateGrades('mid'), activities: ['バスケットボール部'], notes: '運動能力は高いが、授業中の集中力に課題' },
  { id: 's008', name: '中村 あかり', grade: 2, class: 1, number: 8, gender: '女', attendance: generateAttendance('declining'), grades: generateGrades('mid'), activities: ['合唱部'], notes: '最近元気がない。友人とのトラブルの可能性' },
  { id: 's009', name: '小林 大輝', grade: 2, class: 1, number: 9, gender: '男', attendance: generateAttendance('good'), grades: generateGrades('low'), activities: ['野球部'], notes: '部活動には熱心だが、学習面で支援が必要' },
  { id: 's010', name: '加藤 優奈', grade: 2, class: 1, number: 10, gender: '女', attendance: generateAttendance('good'), grades: generateGrades('high'), activities: ['科学部', '英語弁論大会出場'], notes: '知的好奇心が旺盛。将来は理系志望' },
  { id: 's011', name: '吉田 蓮', grade: 2, class: 2, number: 1, gender: '男', attendance: generateAttendance('moderate'), grades: generateGrades('mid'), activities: ['サッカー部'], notes: '友人が多く社交的。提出物の期限に課題あり' },
  { id: 's012', name: '山田 楓', grade: 2, class: 2, number: 2, gender: '女', attendance: generateAttendance('good'), grades: generateGrades('high'), activities: ['美術部部長', '文化祭実行委員'], notes: '創造力豊か。美術展で入賞実績あり' },
  { id: 's013', name: '松本 陸', grade: 2, class: 2, number: 3, gender: '男', attendance: generateAttendance('poor'), grades: generateGrades('low'), activities: [], notes: '家庭環境に課題。SC（スクールカウンセラー）と連携中' },
  { id: 's014', name: '井上 七海', grade: 2, class: 2, number: 4, gender: '女', attendance: generateAttendance('good'), grades: generateGrades('mid'), activities: ['陸上部', '保健委員'], notes: '責任感が強い。周囲への気配りができる生徒' },
  { id: 's015', name: '木村 悠斗', grade: 2, class: 2, number: 5, gender: '男', attendance: generateAttendance('declining'), grades: generateGrades('low'), activities: ['帰宅部'], notes: 'ゲーム依存の傾向。夜更かしによる遅刻が増加' },
  { id: 's016', name: '林 結衣', grade: 2, class: 2, number: 6, gender: '女', attendance: generateAttendance('good'), grades: generateGrades('high'), activities: ['ダンス部', '放送委員'], notes: '表現力豊か。人前での発表も得意' },
  { id: 's017', name: '斎藤 颯太', grade: 2, class: 2, number: 7, gender: '男', attendance: generateAttendance('good'), grades: generateGrades('mid'), activities: ['剣道部'], notes: '礼儀正しく落ち着いた性格。努力を惜しまない' },
  { id: 's018', name: '清水 心愛', grade: 2, class: 2, number: 8, gender: '女', attendance: generateAttendance('moderate'), grades: generateGrades('mid'), activities: ['ソフトテニス部'], notes: '友人関係は良好。数学に苦手意識あり' },
  { id: 's019', name: '山口 海斗', grade: 2, class: 2, number: 9, gender: '男', attendance: generateAttendance('good'), grades: generateGrades('high'), activities: ['水泳部', '学級委員'], notes: '全国大会出場レベル。文武両道を体現' },
  { id: 's020', name: '中島 彩花', grade: 2, class: 2, number: 10, gender: '女', attendance: generateAttendance('declining'), grades: generateGrades('mid'), activities: ['吹奏楽部'], notes: '3学期から休みがち。部活の人間関係が原因の可能性' },
  { id: 's021', name: '藤田 瑛太', grade: 2, class: 3, number: 1, gender: '男', attendance: generateAttendance('good'), grades: generateGrades('mid'), activities: ['卓球部'], notes: 'マイペースだが着実に成長中' },
  { id: 's022', name: '岡田 凜', grade: 2, class: 3, number: 2, gender: '女', attendance: generateAttendance('good'), grades: generateGrades('high'), activities: ['演劇部', '生徒会書記'], notes: 'コミュニケーション能力が高い。周囲のまとめ役' },
  { id: 's023', name: '後藤 大和', grade: 2, class: 3, number: 3, gender: '男', attendance: generateAttendance('moderate'), grades: generateGrades('low'), activities: ['サッカー部'], notes: '授業態度に課題はあるが、スポーツには真剣に取り組む' },
  { id: 's024', name: '前田 芽依', grade: 2, class: 3, number: 4, gender: '女', attendance: generateAttendance('good'), grades: generateGrades('mid'), activities: ['茶道部', '美化委員'], notes: '穏やかな性格。周囲との協調性が高い' },
  { id: 's025', name: '近藤 陽翔', grade: 2, class: 3, number: 5, gender: '男', attendance: generateAttendance('poor'), grades: generateGrades('low'), activities: [], notes: '長期欠席。適応指導教室と連携中。月1回面談実施' },
  { id: 's026', name: '石井 咲良', grade: 2, class: 3, number: 6, gender: '女', attendance: generateAttendance('good'), grades: generateGrades('high'), activities: ['バドミントン部', '学年委員'], notes: '成績優秀。後輩の面倒見がよい' },
  { id: 's027', name: '坂本 遥人', grade: 2, class: 3, number: 7, gender: '男', attendance: generateAttendance('moderate'), grades: generateGrades('mid'), activities: ['科学部'], notes: 'プログラミングに興味あり。実験系の授業で積極的' },
  { id: 's028', name: '遠藤 日向', grade: 2, class: 3, number: 8, gender: '女', attendance: generateAttendance('declining'), grades: generateGrades('mid'), activities: ['バレーボール部'], notes: '最近保健室の利用が増加。養護教諭と情報共有中' },
  { id: 's029', name: '藤原 壮太', grade: 2, class: 3, number: 9, gender: '男', attendance: generateAttendance('good'), grades: generateGrades('mid'), activities: ['柔道部', '体育委員'], notes: '体力測定で学年トップ。生活面も安定' },
  { id: 's030', name: '村上 紬', grade: 2, class: 3, number: 10, gender: '女', attendance: generateAttendance('good'), grades: generateGrades('high'), activities: ['英語部', 'ボランティア活動'], notes: '国際交流に積極的。ホームステイ経験あり' },
];
