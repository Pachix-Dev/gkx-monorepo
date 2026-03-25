import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptionsTable1743000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Normalize legacy enum names from previous failed/partial schema sync runs.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenants_plan_enum_old')
           AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenants_plan_enum') THEN
          ALTER TYPE "tenants_plan_enum_old" RENAME TO "tenants_plan_enum";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'tenants'
            AND column_name = 'plan'
            AND udt_name = 'tenants_plan_enum_old'
        ) AND EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'tenants_plan_enum'
        ) THEN
          ALTER TABLE "tenants"
            ALTER COLUMN "plan" TYPE "tenants_plan_enum"
            USING "plan"::text::"tenants_plan_enum";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenants_plan_enum_old') THEN
          BEGIN
            DROP TYPE "tenants_plan_enum_old";
          EXCEPTION WHEN dependent_objects_still_exist THEN
            -- Keep it if something still depends on it; this avoids breaking migration run.
            NULL;
          END;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscriptions_status_enum') THEN
          CREATE TYPE subscriptions_status_enum AS ENUM (
            'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED'
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscriptions" (
        "id"                   UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenantId"             UUID NOT NULL,
        "plan"                 "tenants_plan_enum" NOT NULL,
        "status"               "subscriptions_status_enum" NOT NULL DEFAULT 'TRIALING',
        "currentPeriodStart"   TIMESTAMPTZ NOT NULL,
        "currentPeriodEnd"     TIMESTAMPTZ NOT NULL,
        "trialEndsAt"          TIMESTAMPTZ,
        "canceledAt"           TIMESTAMPTZ,
        "externalRef"          VARCHAR(200),
        "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscriptions_tenant"
          FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_subscriptions_tenantId"
        ON "subscriptions" ("tenantId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "subscriptions_status_enum";`);
  }
}
