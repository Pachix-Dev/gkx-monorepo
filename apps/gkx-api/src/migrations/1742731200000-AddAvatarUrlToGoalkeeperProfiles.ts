import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvatarUrlToGoalkeeperProfiles1742731200000 implements MigrationInterface {
  name = 'AddAvatarUrlToGoalkeeperProfiles1742731200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "goalkeeper_profiles" ADD COLUMN IF NOT EXISTS "avatarUrl" character varying(500)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "goalkeeper_profiles" DROP COLUMN IF EXISTS "avatarUrl"`,
    );
  }
}
