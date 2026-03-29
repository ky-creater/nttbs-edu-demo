import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import type { DocumentType } from './types';

const documentTypeLabels: Record<DocumentType, string> = {
  class_newsletter: '学級通信',
  parent_notice: '保護者向け通知',
  complaint_response: '保護者ご相談への回答',
  meeting_memo: '面談メモ',
  guidance_record: '指導記録',
  board_report: '教育委員会報告',
  recommendation: '推薦状・調査書',
  absence_reply: '欠席連絡返信',
  event_speech: '行事挨拶文',
  training_report: '研修報告',
};

// Noto Sans JP from Google Fonts (subset)
Font.register({
  family: 'NotoSansJP',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/notosansjp/v53/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFJEk757Y0rw_qMHVdbR2L8Y9QTJ1LwkRg8UGNf.0.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/notosansjp/v53/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEk757Y0rw_qMHVdbR2L8Y9QTJ1LwkRg8UGNf.0.woff2', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'NotoSansJP',
    fontSize: 10,
    lineHeight: 1.8,
  },
  header: {
    marginBottom: 20,
  },
  dateRight: {
    textAlign: 'right',
    fontSize: 10,
    marginBottom: 10,
  },
  addressee: {
    fontSize: 10,
    marginBottom: 10,
  },
  senderRight: {
    textAlign: 'right',
    fontSize: 10,
    marginBottom: 5,
  },
  title: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 700,
    marginTop: 20,
    marginBottom: 15,
    borderBottom: '1 solid #333',
    paddingBottom: 8,
  },
  heading: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 12,
    marginBottom: 4,
  },
  body: {
    fontSize: 10,
    marginBottom: 4,
  },
  indent: {
    fontSize: 10,
    marginLeft: 20,
    marginBottom: 3,
  },
  center: {
    textAlign: 'center',
    fontSize: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  right: {
    textAlign: 'right',
    fontSize: 10,
    marginTop: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    right: 50,
    fontSize: 8,
    color: '#999',
  },
});

function DocumentPdf({ content, docType }: { content: string; docType: DocumentType }) {
  const today = new Date();
  const dateStr = `令和${today.getFullYear() - 2018}年${today.getMonth() + 1}月${today.getDate()}日`;
  const typeName = documentTypeLabels[docType];
  const isOfficial = ['parent_notice', 'board_report', 'complaint_response'].includes(docType);
  const addressee = docType === 'board_report' ? '○○市教育委員会　御中' : '保護者各位';

  const lines = content.split('\n');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.dateRight}>{dateStr}</Text>
          {isOfficial && <Text style={styles.addressee}>{addressee}</Text>}
          <Text style={styles.senderRight}>○○中学校</Text>
          <Text style={styles.senderRight}>
            {isOfficial ? '校長　○○　○○' : '担任　○○　○○'}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{typeName}</Text>

        {/* Body */}
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return <Text key={i} style={styles.body}>{' '}</Text>;
          if (trimmed.startsWith('■') || trimmed.startsWith('【'))
            return <Text key={i} style={styles.heading}>{trimmed}</Text>;
          if (/^\d+[\.\)）]/.test(trimmed))
            return <Text key={i} style={styles.indent}>{trimmed}</Text>;
          if (trimmed === '記')
            return <Text key={i} style={styles.center}>記</Text>;
          if (trimmed === '以上')
            return <Text key={i} style={styles.right}>以上</Text>;
          return <Text key={i} style={styles.body}>{trimmed}</Text>;
        })}

        <Text style={styles.footer}>校務支援AI プラットフォーム</Text>
      </Page>
    </Document>
  );
}

export async function generatePdf(content: string, docType: DocumentType): Promise<Blob> {
  const blob = await pdf(<DocumentPdf content={content} docType={docType} />).toBlob();
  return blob;
}
