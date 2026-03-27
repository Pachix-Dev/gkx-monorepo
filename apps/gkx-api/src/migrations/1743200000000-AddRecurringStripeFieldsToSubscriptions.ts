import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecurringStripeFieldsToSubscriptions1743200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD COLUMN IF NOT EXISTS "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "stripeCustomerId" VARCHAR(200),
      ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" VARCHAR(200),
      ADD COLUMN IF NOT EXISTS "stripeSubscriptionItemId" VARCHAR(200),
      ADD COLUMN IF NOT EXISTS "stripePriceId" VARCHAR(200);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_subscriptions_stripeSubscriptionId"
      ON "subscriptions" ("stripeSubscriptionId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_subscriptions_stripeCustomerId"
      ON "subscriptions" ("stripeCustomerId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_subscriptions_stripeCustomerId";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_subscriptions_stripeSubscriptionId";
    `);
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      DROP COLUMN IF EXISTS "stripePriceId",
      DROP COLUMN IF EXISTS "stripeSubscriptionItemId",
      DROP COLUMN IF EXISTS "stripeSubscriptionId",
      DROP COLUMN IF EXISTS "stripeCustomerId",
      DROP COLUMN IF EXISTS "cancelAtPeriodEnd";
    `);
  }
}
