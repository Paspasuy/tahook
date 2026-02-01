import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1706800000000 implements MigrationInterface {
  name = "InitialMigration1706800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension for uuid_generate_v4
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);

    // Create question_type enum
    await queryRunner.query(`
      CREATE TYPE "question_type_enum" AS ENUM ('singlechoice', 'multichoice')
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(255) NOT NULL,
        "passwordHash" varchar(255) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_name" UNIQUE ("name"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create quizzes table
    await queryRunner.query(`
      CREATE TABLE "quizzes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" varchar(255) NOT NULL,
        "ownerId" uuid NOT NULL,
        "isPublished" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quizzes" PRIMARY KEY ("id")
      )
    `);

    // Create questions table
    await queryRunner.query(`
      CREATE TABLE "questions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "quizId" uuid NOT NULL,
        "index" integer NOT NULL,
        "text" text NOT NULL,
        "type" "question_type_enum" NOT NULL DEFAULT 'singlechoice',
        "options" jsonb NOT NULL,
        "timeLimitSeconds" integer NOT NULL DEFAULT 30,
        "points" integer NOT NULL DEFAULT 1000,
        CONSTRAINT "PK_questions" PRIMARY KEY ("id")
      )
    `);

    // Create results table with composite primary key
    await queryRunner.query(`
      CREATE TABLE "results" (
        "userId" uuid NOT NULL,
        "quizId" uuid NOT NULL,
        "score" integer NOT NULL DEFAULT 0,
        "place" integer,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_results" PRIMARY KEY ("userId", "quizId")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "quizzes"
      ADD CONSTRAINT "FK_quizzes_owner"
      FOREIGN KEY ("ownerId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "questions"
      ADD CONSTRAINT "FK_questions_quiz"
      FOREIGN KEY ("quizId") REFERENCES "quizzes"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "results"
      ADD CONSTRAINT "FK_results_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "results"
      ADD CONSTRAINT "FK_results_quiz"
      FOREIGN KEY ("quizId") REFERENCES "quizzes"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_quizzes_ownerId" ON "quizzes" ("ownerId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_quizzes_isPublished" ON "quizzes" ("isPublished")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_questions_quizId" ON "questions" ("quizId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_questions_quizId_index" ON "questions" ("quizId", "index")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_results_quizId" ON "results" ("quizId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_results_userId" ON "results" ("userId")
    `);

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_results_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_results_quizId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_questions_quizId_index"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_questions_quizId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_quizzes_isPublished"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_quizzes_ownerId"`);

    // Drop foreign keys and tables
    await queryRunner.query(`DROP TABLE IF EXISTS "results"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "questions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "quizzes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    // Drop enum
    await queryRunner.query(`DROP TYPE IF EXISTS "question_type_enum"`);
  }
}
