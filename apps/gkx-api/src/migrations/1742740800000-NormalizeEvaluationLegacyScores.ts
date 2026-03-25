import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeEvaluationLegacyScores1742740800000 implements MigrationInterface {
  name = 'NormalizeEvaluationLegacyScores1742740800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
DO $$
DECLARE
  has_handling boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'evaluations' AND column_name = 'handling'
  ) INTO has_handling;

  IF has_handling THEN
    INSERT INTO "evaluation_items" (
      "evaluationId",
      "criterionCode",
      "criterionLabel",
      "score",
      "comment",
      "createdAt",
      "updatedAt"
    )
    SELECT
      e."id",
      s."criterionCode",
      s."criterionLabel",
      s."score",
      NULL,
      NOW(),
      NOW()
    FROM "evaluations" e
    CROSS JOIN LATERAL (
      VALUES
        ('handling', 'Handling', e."handling"),
        ('diving', 'Diving', e."diving"),
        ('positioning', 'Positioning', e."positioning"),
        ('reflexes', 'Reflexes', e."reflexes"),
        ('communication', 'Communication', e."communication"),
        ('footwork', 'Footwork', e."footwork"),
        ('distribution', 'Distribution', e."distribution"),
        ('aerial_play', 'Aerial Play', e."aerialPlay"),
        ('one_vs_one', 'One vs One', e."oneVsOne"),
        ('mentality', 'Mentality', e."mentality")
    ) AS s("criterionCode", "criterionLabel", "score")
    WHERE s."score" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM "evaluation_items" ei
        WHERE ei."evaluationId" = e."id"
      );
  END IF;
END $$;
    `);

    await queryRunner.query(
      `ALTER TABLE "evaluations" DROP COLUMN IF EXISTS "handling"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" DROP COLUMN IF EXISTS "diving"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" DROP COLUMN IF EXISTS "positioning"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" DROP COLUMN IF EXISTS "reflexes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" DROP COLUMN IF EXISTS "communication"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" DROP COLUMN IF EXISTS "footwork"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" DROP COLUMN IF EXISTS "distribution"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" DROP COLUMN IF EXISTS "aerialPlay"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" DROP COLUMN IF EXISTS "oneVsOne"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" DROP COLUMN IF EXISTS "mentality"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "evaluations" ADD COLUMN IF NOT EXISTS "handling" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" ADD COLUMN IF NOT EXISTS "diving" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" ADD COLUMN IF NOT EXISTS "positioning" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" ADD COLUMN IF NOT EXISTS "reflexes" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" ADD COLUMN IF NOT EXISTS "communication" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" ADD COLUMN IF NOT EXISTS "footwork" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" ADD COLUMN IF NOT EXISTS "distribution" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" ADD COLUMN IF NOT EXISTS "aerialPlay" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" ADD COLUMN IF NOT EXISTS "oneVsOne" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" ADD COLUMN IF NOT EXISTS "mentality" integer`,
    );

    await queryRunner.query(`
UPDATE "evaluations" e
SET
  "handling" = src."handling",
  "diving" = src."diving",
  "positioning" = src."positioning",
  "reflexes" = src."reflexes",
  "communication" = src."communication",
  "footwork" = src."footwork",
  "distribution" = src."distribution",
  "aerialPlay" = src."aerial_play",
  "oneVsOne" = src."one_vs_one",
  "mentality" = src."mentality"
FROM (
  SELECT
    ei."evaluationId",
    MAX(CASE WHEN ei."criterionCode" = 'handling' THEN ei."score" END) AS "handling",
    MAX(CASE WHEN ei."criterionCode" = 'diving' THEN ei."score" END) AS "diving",
    MAX(CASE WHEN ei."criterionCode" = 'positioning' THEN ei."score" END) AS "positioning",
    MAX(CASE WHEN ei."criterionCode" = 'reflexes' THEN ei."score" END) AS "reflexes",
    MAX(CASE WHEN ei."criterionCode" = 'communication' THEN ei."score" END) AS "communication",
    MAX(CASE WHEN ei."criterionCode" = 'footwork' THEN ei."score" END) AS "footwork",
    MAX(CASE WHEN ei."criterionCode" = 'distribution' THEN ei."score" END) AS "distribution",
    MAX(CASE WHEN ei."criterionCode" = 'aerial_play' THEN ei."score" END) AS "aerial_play",
    MAX(CASE WHEN ei."criterionCode" = 'one_vs_one' THEN ei."score" END) AS "one_vs_one",
    MAX(CASE WHEN ei."criterionCode" = 'mentality' THEN ei."score" END) AS "mentality"
  FROM "evaluation_items" ei
  GROUP BY ei."evaluationId"
) src
WHERE src."evaluationId" = e."id";
    `);
  }
}
