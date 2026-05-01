import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveEnterprisePlan1777800000000 implements MigrationInterface {
  name = 'RemoveEnterprisePlan1777800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "tenants" SET "plan" = 'PRO' WHERE "plan" = 'ENTERPRISE'`,
    );
    await queryRunner.query(
      `UPDATE "subscriptions" SET "plan" = 'PRO' WHERE "plan" = 'ENTERPRISE'`,
    );
    await queryRunner.query(
      `UPDATE "plan_change_requests" SET "requestedPlan" = 'PRO' WHERE "requestedPlan" = 'ENTERPRISE'`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."tenants_plan_enum" RENAME TO "tenants_plan_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenants_plan_enum" AS ENUM('FREE', 'BASIC', 'PRO')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "plan" TYPE "public"."tenants_plan_enum" USING "plan"::text::"public"."tenants_plan_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."tenants_plan_enum_old"`);

    await queryRunner.query(
      `ALTER TYPE "public"."subscriptions_plan_enum" RENAME TO "subscriptions_plan_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_plan_enum" AS ENUM('FREE', 'BASIC', 'PRO')`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "plan" TYPE "public"."subscriptions_plan_enum" USING "plan"::text::"public"."subscriptions_plan_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."subscriptions_plan_enum_old"`);

    await queryRunner.query(
      `ALTER TYPE "public"."plan_change_requests_requestedplan_enum" RENAME TO "plan_change_requests_requestedplan_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."plan_change_requests_requestedplan_enum" AS ENUM('FREE', 'BASIC', 'PRO')`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_change_requests" ALTER COLUMN "requestedPlan" TYPE "public"."plan_change_requests_requestedplan_enum" USING "requestedPlan"::text::"public"."plan_change_requests_requestedplan_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."plan_change_requests_requestedplan_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."plan_change_requests_requestedplan_enum" RENAME TO "plan_change_requests_requestedplan_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."plan_change_requests_requestedplan_enum" AS ENUM('FREE', 'BASIC', 'PRO', 'ENTERPRISE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_change_requests" ALTER COLUMN "requestedPlan" TYPE "public"."plan_change_requests_requestedplan_enum" USING "requestedPlan"::text::"public"."plan_change_requests_requestedplan_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."plan_change_requests_requestedplan_enum_old"`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."subscriptions_plan_enum" RENAME TO "subscriptions_plan_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_plan_enum" AS ENUM('FREE', 'BASIC', 'PRO', 'ENTERPRISE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "plan" TYPE "public"."subscriptions_plan_enum" USING "plan"::text::"public"."subscriptions_plan_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."subscriptions_plan_enum_old"`);

    await queryRunner.query(
      `ALTER TYPE "public"."tenants_plan_enum" RENAME TO "tenants_plan_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenants_plan_enum" AS ENUM('FREE', 'BASIC', 'PRO', 'ENTERPRISE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "plan" TYPE "public"."tenants_plan_enum" USING "plan"::text::"public"."tenants_plan_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."tenants_plan_enum_old"`);
  }
}
