import { NextRequest, NextResponse } from 'next/server';
import { suggestCategoryForRepo } from '@/lib/ai-summarizer';
import { getCategoriesTree } from '@/app/actions';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const repo = body?.repo;
    if (!repo || !repo.name) {
      return NextResponse.json(
        { success: false, error: 'Metadata repositori tidak valid.' },
        { status: 400 }
      );
    }

    let categories = body?.categories;
    if (!Array.isArray(categories) || categories.length === 0) {
      categories = await getCategoriesTree();
    }

    const suggestion = await suggestCategoryForRepo(repo, categories);
    return NextResponse.json({
      success: true,
      suggestion,
    });
  } catch (error: any) {
    console.error('Error di /api/github/categorize:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

