import { pgTable, text, timestamp, uuid, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Tabel Kategori Utama (e.g. LLM, RAG, Video, AI Agent, AI Skill)
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  icon: text('icon').notNull().default('folder'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabel Sub-Kategori (e.g. LLM > Inference, Serving, Fine-Tuning)
export const subCategories = pgTable('sub_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabel Repositori GitHub
export const repositories = pgTable('repositories', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'restrict' }),
  subCategoryId: uuid('sub_category_id')
    .references(() => subCategories.id, { onDelete: 'set null' }),
  githubUrl: text('github_url').notNull().unique(),
  owner: text('owner').notNull(),
  name: text('name').notNull(),
  fullName: text('full_name').notNull(),
  description: text('description'),
  starsCount: integer('stars_count').default(0).notNull(),
  forksCount: integer('forks_count').default(0).notNull(),
  primaryLanguage: text('primary_language'),
  topics: text('topics').array(),
  homepage: text('homepage'),
  license: text('license'),
  isFeatured: boolean('is_featured').default(false).notNull(),
  aiSummary: jsonb('ai_summary'),
  readmeContent: text('readme_content'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relasi Kategori & Sub-Kategori
export const categoriesRelations = relations(categories, ({ many }) => ({
  subCategories: many(subCategories),
  repositories: many(repositories),
}));

export const subCategoriesRelations = relations(subCategories, ({ one, many }) => ({
  category: one(categories, {
    fields: [subCategories.categoryId],
    references: [categories.id],
  }),
  repositories: many(repositories),
}));

export const repositoriesRelations = relations(repositories, ({ one }) => ({
  category: one(categories, {
    fields: [repositories.categoryId],
    references: [categories.id],
  }),
  subCategory: one(subCategories, {
    fields: [repositories.subCategoryId],
    references: [subCategories.id],
  }),
}));

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type SubCategory = typeof subCategories.$inferSelect;
export type NewSubCategory = typeof subCategories.$inferInsert;
export type Repository = typeof repositories.$inferSelect;
export type NewRepository = typeof repositories.$inferInsert;

