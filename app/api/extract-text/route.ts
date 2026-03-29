import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const EXTRACT_PROMPT =
  'この文書/画像の内容を正確にテキストとして書き起こしてください。レイアウトや構造もできるだけ保持してください。見出しや箇条書きはそのまま再現してください。';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileData, fileName, mimeType } = body as {
      fileData: string;
      fileName: string;
      mimeType: string;
    };

    if (!fileData || !fileName || !mimeType) {
      return NextResponse.json(
        { error: 'fileData, fileName, mimeType は必須です。' },
        { status: 400 }
      );
    }

    // Plain text: just decode base64 and return
    if (mimeType === 'text/plain') {
      const text = Buffer.from(fileData, 'base64').toString('utf-8');
      return NextResponse.json({ text, fileName });
    }

    const supportedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
    type SupportedImageType = (typeof supportedImageTypes)[number];

    const isPdf = mimeType === 'application/pdf';
    const isImage = (supportedImageTypes as readonly string[]).includes(mimeType);

    if (!isPdf && !isImage) {
      // Fallback for doc/docx: best-effort UTF-8 decode
      const text = Buffer.from(fileData, 'base64').toString('utf-8');
      return NextResponse.json({ text, fileName });
    }

    let message: Anthropic.Message;

    if (isPdf) {
      message = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: fileData,
                },
              },
              {
                type: 'text',
                text: EXTRACT_PROMPT,
              },
            ],
          },
        ],
      });
    } else {
      const imageMediaType = mimeType as SupportedImageType;
      message = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: imageMediaType,
                  data: fileData,
                },
              },
              {
                type: 'text',
                text: EXTRACT_PROMPT,
              },
            ],
          },
        ],
      });
    }

    const extractedText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('\n');

    return NextResponse.json({ text: extractedText, fileName });
  } catch (error) {
    console.error('extract-text error:', error);
    return NextResponse.json(
      { error: 'ファイルの内容読み取り中にエラーが発生しました。' },
      { status: 500 }
    );
  }
}
