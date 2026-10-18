import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { db, isDbConfigured } from '../db/index.js';
import { categories, subCategories, repositories } from '../db/schema.js';

dotenv.config();

interface SemanticBridge {
  targetSubCategoryId: string;
  targetSubCategoryName: string;
  confidence: number;
  reason: string;
}

async function callLlm(prompt: string): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (groqKey) {
    for (const model of ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b']) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: 'You are the Antigravity Lead Architect AI. Analyze repository cross-domain connections and reply ONLY with a valid JSON object matching the requested schema. No extra text or markdown.',
              },
              { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (res.ok) {
          const json = await res.json();
          const content = json.choices?.[0]?.message?.content;
          if (content && content.trim()) return content;
        }
      } catch (err: any) {
        console.warn(`Groq ${model} error:`, err.message);
      }
    }
  }

  if (geminiKey) {
    for (const model of ['gemini-2.5-flash', 'gemini-1.5-flash']) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (res.ok) {
          const json = await res.json();
          const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content && content.trim()) return content;
        }
      } catch (err: any) {
        console.warn(`Gemini ${model} error:`, err.message);
      }
    }
  }

  return null;
}

async function main() {
  if (!db || !isDbConfigured) {
    console.error('Database is not configured!');
    process.exit(1);
  }

  console.log('Fetching categories and repositories from Neon PostgreSQL...');
  const allCategories = await db.query.categories.findMany({
    with: { subCategories: true },
  });

  const subCatList: { id: string; name: string; categoryName: string; categoryId: string }[] = [];
  allCategories.forEach(cat => {
    (cat.subCategories || []).forEach(sub => {
      subCatList.push({
        id: sub.id,
        name: sub.name,
        categoryName: cat.name,
        categoryId: cat.id,
      });
    });
  });

  console.log(`Found ${allCategories.length} categories and ${subCatList.length} sub-categories.`);

  const catalogContext = subCatList
    .map(s => `- ID: "${s.id}" | Nama: "${s.name}" (Kategori: "${s.categoryName}")`)
    .join('\n');

  const allRepos = await db.query.repositories.findMany({
    with: { category: true, subCategory: true },
  });

  console.log(`Analyzing semantic bridges for ${allRepos.length} repositories with LLM...`);

  let updatedCount = 0;
  let bridgedCount = 0;

  for (let i = 0; i < allRepos.length; i++) {
    const repo = allRepos[i];
    const aiSummary = (repo.aiSummary as any) || {};

    // Cek jika sudah memiliki semanticBridges valid, lewati jika tidak dipaksa ulang
    if (aiSummary.semanticBridges && Array.isArray(aiSummary.semanticBridges) && aiSummary.semanticBridges.length > 0) {
      console.log(`[${i + 1}/${allRepos.length}] SKIP (Already bridged): ${repo.fullName} -> ${aiSummary.semanticBridges.map((b: any) => b.targetSubCategoryName).join(', ')}`);
      bridgedCount++;
      continue;
    }

    const corePurpose = aiSummary.corePurpose || (aiSummary.problemsSolved?.[0]?.description) || '';
    const topicsStr = (repo.topics || []).join(', ');

    const prompt = `Kamu adalah Chief AI Architect untuk GitHub Library Hub.
Tugas: Analisis repositori berikut dan tentukan apakah memiliki keterkaitan fungsional sekunder (cross-subgroup semantic bridge) yang KUAT dengan 1 atau maksimal 2 sub-grup lain di luar sub-kategori utamanya.

DAFTAR SUB-KATEGORI DI SISTEM:
${catalogContext}

DATA REPOSITORI:
- Full Name: ${repo.fullName}
- Kategori Utama: ${repo.category?.name || '-'}
- Sub-Kategori Utama: ${repo.subCategory?.name || '-'} (ID: "${repo.subCategoryId || '-'}")
- Deskripsi: ${repo.description || '-'}
- Topik GitHub: ${topicsStr || '-'}
- Intisari & Fungsi Utama: ${corePurpose || '-'}

ATURAN EVALUASI:
1. DILARANG memilih sub-kategori utamanya sendiri ("${repo.subCategoryId}").
2. Hubungkan HANYA jika ada keterkaitan fungsional sekunder yang nyata (confidence >= 0.8). Contoh:
   - Tool MCP/CLI indexing code knowledge graph yang berada di sub-kategori "MCP & Protocols" -> sangat relevan dengan sub-kategori "Memory & Knowledge".
   - Framework browser automation yang berada di "Browser Agents" -> sangat relevan dengan "Web & Browser Agent".
   - Framework RAG dokumen yang membuat knowledge graph/wiki -> sangat relevan dengan "Memory & Knowledge".
   - Tool video rendering kode yang menggunakan motion/threejs -> sangat relevan dengan "UI/UX & Frontend".
3. Jika repo hanya fokus murni pada sub-kategori aslinya dan tidak memiliki irisan fungsional yang signifikan ke sub-grup lain, kembalikan "bridges": [].
4. Berikan 'reason' padat (1 kalimat dalam Bahasa Indonesia) yang menjelaskan alasan teknis keterkaitannya.

FORMAT OUTPUT WAJIB (JSON ONLY):
{
  "bridges": [
    {
      "targetSubCategoryId": "sub-xxx",
      "targetSubCategoryName": "Nama Sub-Kategori Target",
      "confidence": 0.95,
      "reason": "Penjelasan keterkaitan teknis dalam Bahasa Indonesia."
    }
  ]
}`;

    const rawResponse = await callLlm(prompt);
    let validBridges: SemanticBridge[] = [];

    if (rawResponse) {
      try {
        const parsed = JSON.parse(rawResponse);
        if (Array.isArray(parsed.bridges)) {
          validBridges = parsed.bridges
            .filter((b: any) => {
              if (!b.targetSubCategoryId) return false;
              if (b.targetSubCategoryId === repo.subCategoryId) return false;
              return subCatList.some(s => s.id === b.targetSubCategoryId);
            })
            .slice(0, 2)
            .map((b: any) => {
              const matched = subCatList.find(s => s.id === b.targetSubCategoryId);
              return {
                targetSubCategoryId: b.targetSubCategoryId,
                targetSubCategoryName: matched?.name || b.targetSubCategoryName,
                confidence: typeof b.confidence === 'number' ? b.confidence : 0.85,
                reason: b.reason || `Keterkaitan fungsional dengan ${matched?.name}.`,
              };
            });
        }
      } catch (err: any) {
        console.warn(`Failed to parse LLM response for ${repo.fullName}:`, err.message);
      }
    }

    // Simpan ke PostgreSQL Neon via Drizzle
    const updatedSummary = {
      ...aiSummary,
      semanticBridges: validBridges,
    };

    await db
      .update(repositories)
      .set({
        aiSummary: updatedSummary,
        updatedAt: new Date(),
      })
      .where(eq(repositories.id, repo.id));

    updatedCount++;
    if (validBridges.length > 0) {
      bridgedCount++;
      console.log(`[${i + 1}/${allRepos.length}] BRIDGED: ${repo.fullName} -> ${validBridges.map(b => `${b.targetSubCategoryName} (${b.reason})`).join(' | ')}`);
    } else {
      console.log(`[${i + 1}/${allRepos.length}] SINGLE DOMAIN: ${repo.fullName}`);
    }

    // Jeda 200ms untuk stabilitas API rate limit
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nFinished! Evaluated: ${updatedCount} repos, Total with semantic bridges: ${bridgedCount}/${allRepos.length}`);
}

main().catch(console.error);
