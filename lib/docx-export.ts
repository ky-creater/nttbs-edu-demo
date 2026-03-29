import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  Packer,
  PageBreak,
  BorderStyle,
} from 'docx';
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

function parseContentToBlocks(content: string): Paragraph[] {
  const lines = content.split('\n');
  const paragraphs: Paragraph[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      paragraphs.push(new Paragraph({ text: '' }));
      continue;
    }

    // 見出し行（■や【】で始まる）
    if (trimmed.startsWith('■') || trimmed.startsWith('【')) {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: trimmed,
            bold: true,
            size: 24,
            font: { name: '游ゴシック' },
          }),
        ],
        spacing: { before: 200, after: 100 },
      }));
    }
    // 記書き（数字. で始まる）
    else if (/^\d+[\.\)）]/.test(trimmed)) {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: trimmed,
            size: 21,
            font: { name: '游明朝' },
          }),
        ],
        indent: { left: 400 },
        spacing: { after: 60 },
      }));
    }
    // 「記」
    else if (trimmed === '記') {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: '記',
            size: 21,
            font: { name: '游明朝' },
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 },
      }));
    }
    // 「以上」
    else if (trimmed === '以上') {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: '以上',
            size: 21,
            font: { name: '游明朝' },
          }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { before: 200 },
      }));
    }
    // 通常段落
    else {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: trimmed,
            size: 21,
            font: { name: '游明朝' },
          }),
        ],
        spacing: { after: 60 },
      }));
    }
  }

  return paragraphs;
}

function buildOfficialDocumentHeader(docType: DocumentType): Paragraph[] {
  const today = new Date();
  const dateStr = `令和${today.getFullYear() - 2018}年${today.getMonth() + 1}月${today.getDate()}日`;

  const headers: Paragraph[] = [];

  // 日付（右寄せ）
  headers.push(new Paragraph({
    children: [
      new TextRun({
        text: dateStr,
        size: 21,
        font: { name: '游明朝' },
      }),
    ],
    alignment: AlignmentType.RIGHT,
    spacing: { after: 200 },
  }));

  // 宛先（公式文書の場合）
  if (['parent_notice', 'board_report', 'complaint_response'].includes(docType)) {
    const addressee = docType === 'board_report' ? '○○市教育委員会　御中' : '保護者各位';
    headers.push(new Paragraph({
      children: [
        new TextRun({
          text: addressee,
          size: 21,
          font: { name: '游明朝' },
        }),
      ],
      spacing: { after: 200 },
    }));
  }

  // 発信者（右寄せ）
  headers.push(new Paragraph({
    children: [
      new TextRun({
        text: '○○中学校',
        size: 21,
        font: { name: '游明朝' },
      }),
    ],
    alignment: AlignmentType.RIGHT,
  }));

  if (['parent_notice', 'board_report'].includes(docType)) {
    headers.push(new Paragraph({
      children: [
        new TextRun({
          text: '校長　○○　○○',
          size: 21,
          font: { name: '游明朝' },
        }),
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 300 },
    }));
  } else {
    headers.push(new Paragraph({
      children: [
        new TextRun({
          text: '担任　○○　○○',
          size: 21,
          font: { name: '游明朝' },
        }),
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 300 },
    }));
  }

  return headers;
}

export async function generateDocx(
  content: string,
  docType: DocumentType,
): Promise<Blob> {
  const typeName = documentTypeLabels[docType];

  // タイトル
  const titleParagraph = new Paragraph({
    children: [
      new TextRun({
        text: typeName,
        bold: true,
        size: 32,
        font: { name: '游ゴシック' },
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '333333' },
    },
  });

  // ヘッダー（公式文書スタイル）
  const headerParagraphs = buildOfficialDocumentHeader(docType);

  // 本文
  const bodyParagraphs = parseContentToBlocks(content);

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,    // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children: [
        ...headerParagraphs,
        titleParagraph,
        new Paragraph({ text: '', spacing: { after: 100 } }),
        ...bodyParagraphs,
      ],
    }],
  });

  return await Packer.toBlob(doc);
}
