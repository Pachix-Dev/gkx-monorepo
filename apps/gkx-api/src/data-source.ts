import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { resolve } from 'node:path';

/**
 * TypeORM DataSource for CLI migrations.
 * Usage:
 *   npm run migration:run
 *   npm run migration:revert
 *   npm run migration:generate -- src/migrations/MigrationName
 *
 * NOTE: Loads .env from the project root automatically via typeorm-ts-node-commonjs.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'gkx_user',
  password: process.env.DB_PASSWORD ?? 'gkx_pass',
  database: process.env.DB_NAME ?? 'gkx_db',
  entities: [resolve(__dirname, '**', '*.entity.{ts,js}')],
  migrations: [resolve(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
});
