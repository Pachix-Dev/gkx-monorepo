import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixInvalidSubscriptionPeriods1777803600000
  implements MigrationInterface
{
  name = 'FixInvalidSubscriptionPeriods1777803600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "subscriptions"
       SET "currentPeriodEnd" = "currentPeriodStart" + INTERVAL '1 year'
       WHERE "plan" = 'PRO' AND "currentPeriodEnd" <= "currentPeriodStart"`,
    );

    await queryRunner.query(
      `UPDATE "subscriptions"
       SET "currentPeriodEnd" = "currentPeriodStart" + INTERVAL '1 month'
       WHERE "plan" IN ('FREE', 'BASIC') AND "currentPeriodEnd" <= "currentPeriodStart"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('SELECT 1');
  }
}
