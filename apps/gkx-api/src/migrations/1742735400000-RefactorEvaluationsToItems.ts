import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorEvaluationsToItems1742735400000 implements MigrationInterface {
  name = 'RefactorEvaluationsToItems1742735400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "evaluations" ADD COLUMN IF NOT EXISTS "trainingSessionId" uuid`,
    );

    await queryRunner.query(`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evaluations' AND column_name = 'coachId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evaluations' AND column_name = 'evaluatedByUserId'
  ) THEN
    ALTER TABLE "evaluations" RENAME COLUMN "coachId" TO "evaluatedByUserId";
  END IF;
END $$;
    `);

    await queryRunner.query(`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evaluations' AND column_name = 'date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evaluations' AND column_name = 'evaluationDate'
  ) THEN
    ALTER TABLE "evaluations" RENAME COLUMN "date" TO "evaluationDate";
  END IF;
END $$;
    `);

    await queryRunner.query(`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evaluations' AND column_name = 'comments'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evaluations' AND column_name = 'generalComment'
  ) THEN
    ALTER TABLE "evaluations" RENAME COLUMN "comments" TO "generalComment";
  END IF;
END $$;
    `);

    await queryRunner.query(`
CREATE TABLE IF NOT EXISTS "evaluation_items" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "evaluationId" uuid NOT NULL,
  "criterionCode" character varying(80) NOT NULL,
  "criterionLabel" character varying(160) NOT NULL,
  "score" integer NOT NULL,
  "comment" text,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_evaluation_items_id" PRIMARY KEY ("id")
)
    `);

    await queryRunner.query(`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'FK_evaluation_items_evaluationId'
      AND table_name = 'evaluation_items'
  ) THEN
    ALTER TABLE "evaluation_items"
      ADD CONSTRAINT "FK_evaluation_items_evaluationId"
      FOREIGN KEY ("evaluationId") REFERENCES "evaluations"("id") ON DELETE CASCADE;
  END IF;
END $$;
    `);

    await queryRunner.query(`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'FK_evaluations_trainingSessionId'
      AND table_name = 'evaluations'
  ) THEN
    ALTER TABLE "evaluations"
      ADD CONSTRAINT "FK_evaluations_trainingSessionId"
      FOREIGN KEY ("trainingSessionId") REFERENCES "training_sessions"("id") ON DELETE SET NULL;
  END IF;
END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "evaluations" DROP CONSTRAINT IF EXISTS "FK_evaluations_trainingSessionId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluation_items" DROP CONSTRAINT IF EXISTS "FK_evaluation_items_evaluationId"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "evaluation_items"`);

    await queryRunner.query(`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evaluations' AND column_name = 'generalComment'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evaluations' AND column_name = 'comments'
  ) THEN
    ALTER TABLE "evaluations" RENAME COLUMN "generalComment" TO "comments";
  END IF;
END $$;
    `);

    await queryRunner.query(`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evaluations' AND column_name = 'evaluationDate'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evaluations' AND column_name = 'date'
  ) THEN
    ALTER TABLE "evaluations" RENAME COLUMN "evaluationDate" TO "date";
  END IF;
END $$;
    `);

    await queryRunner.query(`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evaluations' AND column_name = 'evaluatedByUserId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evaluations' AND column_name = 'coachId'
  ) THEN
    ALTER TABLE "evaluations" RENAME COLUMN "evaluatedByUserId" TO "coachId";
  END IF;
END $$;
    `);

    await queryRunner.query(
      `ALTER TABLE "evaluations" DROP COLUMN IF EXISTS "trainingSessionId"`,
    );
  }
}
