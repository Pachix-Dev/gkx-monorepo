import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorAttendanceToRecords1742739600000 implements MigrationInterface {
  name = 'RefactorAttendanceToRecords1742739600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'attendance'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'attendance_records'
  ) THEN
    ALTER TABLE "attendance" RENAME TO "attendance_records";
  END IF;
END $$;
    `);

    await queryRunner.query(`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_records' AND column_name = 'sessionId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_records' AND column_name = 'trainingSessionId'
  ) THEN
    ALTER TABLE "attendance_records" RENAME COLUMN "sessionId" TO "trainingSessionId";
  END IF;
END $$;
    `);

    await queryRunner.query(`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_records' AND column_name = 'comment'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_records' AND column_name = 'notes'
  ) THEN
    ALTER TABLE "attendance_records" RENAME COLUMN "comment" TO "notes";
  END IF;
END $$;
    `);

    await queryRunner.query(
      `ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "recordedByUserId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "recordedAt" TIMESTAMPTZ`,
    );

    await queryRunner.query(
      `UPDATE "attendance_records" SET "recordedAt" = COALESCE("recordedAt", "createdAt")`,
    );

    await queryRunner.query(`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'FK_attendance_records_recordedByUserId'
      AND table_name = 'attendance_records'
  ) THEN
    ALTER TABLE "attendance_records"
      ADD CONSTRAINT "FK_attendance_records_recordedByUserId"
      FOREIGN KEY ("recordedByUserId") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
END $$;
    `);

    await queryRunner.query(`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'UQ_attendance_records_tenant_session_goalkeeper'
      AND table_name = 'attendance_records'
  ) THEN
    ALTER TABLE "attendance_records"
      ADD CONSTRAINT "UQ_attendance_records_tenant_session_goalkeeper"
      UNIQUE ("tenantId", "trainingSessionId", "goalkeeperId");
  END IF;
END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attendance_records" DROP CONSTRAINT IF EXISTS "UQ_attendance_records_tenant_session_goalkeeper"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_records" DROP CONSTRAINT IF EXISTS "FK_attendance_records_recordedByUserId"`,
    );

    await queryRunner.query(
      `ALTER TABLE "attendance_records" DROP COLUMN IF EXISTS "recordedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_records" DROP COLUMN IF EXISTS "recordedByUserId"`,
    );

    await queryRunner.query(`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_records' AND column_name = 'notes'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_records' AND column_name = 'comment'
  ) THEN
    ALTER TABLE "attendance_records" RENAME COLUMN "notes" TO "comment";
  END IF;
END $$;
    `);

    await queryRunner.query(`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_records' AND column_name = 'trainingSessionId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_records' AND column_name = 'sessionId'
  ) THEN
    ALTER TABLE "attendance_records" RENAME COLUMN "trainingSessionId" TO "sessionId";
  END IF;
END $$;
    `);

    await queryRunner.query(`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'attendance_records'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'attendance'
  ) THEN
    ALTER TABLE "attendance_records" RENAME TO "attendance";
  END IF;
END $$;
    `);
  }
}
