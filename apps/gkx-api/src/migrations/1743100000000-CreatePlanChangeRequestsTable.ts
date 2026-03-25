import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlanChangeRequestsTable1743100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_change_requests_payment_method_enum') THEN
          CREATE TYPE plan_change_requests_payment_method_enum AS ENUM (
            'CARD', 'SPEI'
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_change_requests_status_enum') THEN
          CREATE TYPE plan_change_requests_status_enum AS ENUM (
            'PENDING_PAYMENT', 'PENDING_REVIEW', 'COMPLETED', 'REJECTED'
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "plan_change_requests" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" UUID NOT NULL,
        "requestedByUserId" UUID,
        "requestedPlan" "tenants_plan_enum" NOT NULL,
        "paymentMethod" "plan_change_requests_payment_method_enum" NOT NULL,
        "status" "plan_change_requests_status_enum" NOT NULL DEFAULT 'PENDING_PAYMENT',
        "stripeCheckoutSessionId" VARCHAR(200),
        "stripePaymentIntentId" VARCHAR(200),
        "reviewedByUserId" UUID,
        "reviewedAt" TIMESTAMPTZ,
        "reviewNotes" VARCHAR(500),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_plan_change_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_plan_change_requests_tenant"
          FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_plan_change_requests_tenantId"
        ON "plan_change_requests" ("tenantId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_plan_change_requests_status"
        ON "plan_change_requests" ("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "plan_change_requests";`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "plan_change_requests_status_enum";`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "plan_change_requests_payment_method_enum";`,
    );
  }
}
