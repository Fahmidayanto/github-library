import { NextRequest, NextResponse } from 'next/server';
import { translateTexts, translateText } from '@/lib/translator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const targetLang = (body.targetLang === 'en' ? 'en' : 'id') as 'id' | 'en';

    if (Array.isArray(body.texts)) {
      const texts = body.texts.map((t: unknown) => (typeof t === 'string' ? t : ''));
      const translations = await translateTexts(texts, targetLang);
      return NextResponse.json({
        success: true,
        targetLang,
        translations,
      });
    }

    if (typeof body.text === 'string') {
      const translation = await translateText(body.text, targetLang);
      return NextResponse.json({
        success: true,
        targetLang,
        translation,
      });
    }

    return NextResponse.json(
      { error: 'Missing "text" string or "texts" array in request body' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[/api/translate] Translation error:', error);
    return NextResponse.json(
      { error: 'Failed to process translation' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const targetLang = (searchParams.get('targetLang') === 'en' ? 'en' : 'id') as 'id' | 'en';

    if (!text) {
      return NextResponse.json(
        { error: 'Missing "text" query parameter' },
        { status: 400 }
      );
    }

    const translation = await translateText(text, targetLang);
    return NextResponse.json({
      success: true,
      targetLang,
      translation,
    });
  } catch (error) {
    console.error('[/api/translate] GET translation error:', error);
    return NextResponse.json(
      { error: 'Failed to process translation' },
      { status: 500 }
    );
  }
}

