import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as dotenv from 'dotenv';
import * as schema from './schema.js';

dotenv.config();

const connectionString = process.env.DATABASE_URL || '';

export const isDbConfigured = Boolean(connectionString && connectionString.startsWith('postgres'));

export const db = isDbConfigured ? drizzle(neon(connectionString), { schema }) : null;
