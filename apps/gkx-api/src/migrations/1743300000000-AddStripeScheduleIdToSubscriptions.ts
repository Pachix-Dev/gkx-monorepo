import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStripeScheduleIdToSubscriptions1743300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD COLUMN IF NOT EXISTS "stripeScheduleId" VARCHAR(200);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_subscriptions_stripeScheduleId"
      ON "subscriptions" ("stripeScheduleId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_subscriptions_stripeScheduleId";
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      DROP COLUMN IF EXISTS "stripeScheduleId";
    `);
  }
}
