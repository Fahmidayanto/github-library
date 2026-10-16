import { NextRequest, NextResponse } from 'next/server';
import { getOrGenerateSummary, loadCachedSummaries } from '@/lib/ai-summarizer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repoParam = searchParams.get('repo')?.trim();
    const force = searchParams.get('force') === 'true';

    if (repoParam) {
      const result = await getOrGenerateSummary(repoParam, { forceRefresh: force });
      if (result.summary) {
        return NextResponse.json({
          success: true,
          isAiGenerated: true,
          source: result.source,
          repo: repoParam,
          summary: result.summary,
        });
      }
      return NextResponse.json(
        {
          success: false,
          message: `Tidak dapat menghasilkan AI summary untuk ${repoParam}. Silakan periksa koneksi atau URL repositori.`,
        },
        { status: 404 }
      );
    }

    const summaries = loadCachedSummaries();
    return NextResponse.json({
      success: true,
      count: Object.keys(summaries).length,
      summaries,
    });
  } catch (error: any) {
    console.error('Error di /api/github/summary GET:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const repoParam = body?.repo?.trim();
    const force = Boolean(body?.force);

    if (!repoParam) {
      return NextResponse.json({ success: false, error: 'Parameter repo wajib diisi.' }, { status: 400 });
    }

    const result = await getOrGenerateSummary(repoParam, {
      forceRefresh: force,
      meta: body?.meta,
    });

    if (result.summary) {
      return NextResponse.json({
        success: true,
        isAiGenerated: true,
        source: result.source,
        repo: repoParam,
        summary: result.summary,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: `Gagal menghasilkan AI summary untuk ${repoParam}`,
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Error di /api/github/summary POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
