import { db, isDbConfigured } from './index.js';
import { categories, subCategories, repositories } from './schema.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.resolve(__dirname, '../../../data/library-store.json');

async function seed() {
  if (!db || !isDbConfigured) {
    console.error('DATABASE_URL belum dikonfigurasi!');
    process.exit(1);
  }

  console.log('Membaca data seed dari:', storePath);
  const raw = fs.readFileSync(storePath, 'utf-8');
  const data = JSON.parse(raw);

  const existingCats = await db.select().from(categories);
  if (existingCats.length > 0) {
    console.log(`Database sudah memiliki ${existingCats.length} kategori. Melewati seed.`);
    process.exit(0);
  }

  const catMap = new Map<string, string>(); // oldId -> newUuid
  const subMap = new Map<string, string>(); // oldId -> newUuid

  console.log(`Menyisipkan ${data.categories.length} kategori...`);
  for (const cat of data.categories) {
    const catUuid = randomUUID();
    catMap.set(cat.id, catUuid);
    await db.insert(categories).values({
      id: catUuid,
      name: cat.name,
      slug: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      icon: cat.icon || 'folder',
      description: cat.description || '',
    });

    if (Array.isArray(cat.subCategories)) {
      for (const sub of cat.subCategories) {
        const subUuid = randomUUID();
        subMap.set(sub.id, subUuid);
        await db.insert(subCategories).values({
          id: subUuid,
          categoryId: catUuid,
          name: sub.name,
          slug: sub.slug || sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: sub.description || '',
        });
      }
    }
  }

  console.log(`Menyisipkan ${data.repositories.length} repositori...`);
  for (const repo of data.repositories) {
    const mappedCatId = catMap.get(repo.categoryId);
    const mappedSubId = repo.subCategoryId ? subMap.get(repo.subCategoryId) : null;

    if (!mappedCatId) {
      console.warn(`Kategori tidak ditemukan untuk repo ${repo.name}, dilewati.`);
      continue;
    }

    try {
      await db.insert(repositories).values({
        id: randomUUID(),
        categoryId: mappedCatId,
        subCategoryId: mappedSubId || null,
        githubUrl: repo.githubUrl,
        owner: repo.owner,
        name: repo.name,
        fullName: repo.fullName || `${repo.owner}/${repo.name}`,
        description: repo.description || '',
        starsCount: repo.starsCount || 0,
        forksCount: repo.forksCount || 0,
        primaryLanguage: repo.primaryLanguage || 'Unknown',
        topics: Array.isArray(repo.topics) ? repo.topics : [],
        homepage: repo.homepage || '',
        license: typeof repo.license === 'object' ? repo.license?.name || repo.license?.spdx_id : repo.license || null,
        isFeatured: Boolean(repo.isFeatured),
      });
    } catch (err: any) {
      console.warn(`Gagal insert repo ${repo.name}:`, err.message);
    }
  }

  console.log('Seed database Neon selesai dengan sukses!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed gagal:', err);
  process.exit(1);
});

