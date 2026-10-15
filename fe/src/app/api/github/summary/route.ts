import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repoParam = searchParams.get('repo')?.toLowerCase();

    // Lokasi data/ai-summaries.json di root monorepo
    const summariesPath = path.resolve(process.cwd(), '../data/ai-summaries.json');

    if (!fs.existsSync(summariesPath)) {
      return NextResponse.json({ success: false, message: 'Belum ada AI summary yang digenerate.' }, { status: 404 });
    }

    const raw = fs.readFileSync(summariesPath, 'utf-8');
    const summaries = JSON.parse(raw);

    if (repoParam) {
      const found = summaries[repoParam];
      if (found) {
        return NextResponse.json({
          success: true,
          isAiGenerated: true,
          repo: repoParam,
          summary: found,
        });
      }
      return NextResponse.json({ success: false, message: `Summary belum tersedia untuk ${repoParam}` }, { status: 404 });
    }

    return NextResponse.json({ success: true, count: Object.keys(summaries).length, summaries });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
