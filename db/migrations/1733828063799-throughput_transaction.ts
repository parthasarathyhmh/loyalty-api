import { MigrationInterface, QueryRunner } from 'typeorm';

export class ThroughputTransaction1733828063799 implements MigrationInterface {
  name = 'ThroughputTransaction1733828063799';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."throughputTransactions_type_enum" AS ENUM('credit', 'debit')`,
    );
    await queryRunner.query(
      `CREATE TABLE "throughputTransactions" ("id" SERIAL NOT NULL, "points" numeric NOT NULL, "type" "public"."throughputTransactions_type_enum" NOT NULL DEFAULT 'credit', "processed" boolean NOT NULL DEFAULT false, "throughputId" numeric NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "projectId" integer, "customerId" integer, "walletId" integer, CONSTRAINT "PK_003487ef61ac2e0acb5d5b5b03e" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."pointTransactions_transactionsource_enum" RENAME TO "pointTransactions_transactionsource_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pointTransactions_transactionsource_enum" AS ENUM('bonus', 'order', 'coupon', 'voucher', 'recharge', 'reversal', 'milestone', 'cart', 'throughput')`,
    );
    await queryRunner.query(
      `ALTER TABLE "pointTransactions" ALTER COLUMN "transactionSource" TYPE "public"."pointTransactions_transactionsource_enum" USING "transactionSource"::"text"::"public"."pointTransactions_transactionsource_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."pointTransactions_transactionsource_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "throughputTransactions" ADD CONSTRAINT "FK_1f5f326302ee82f3be5b6dd5e70" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "throughputTransactions" ADD CONSTRAINT "FK_4565bf55711ad05ea696c800912" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "throughputTransactions" ADD CONSTRAINT "FK_4407661af47fe45a7c6bfcd7aac" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "throughputTransactions" DROP CONSTRAINT "FK_4407661af47fe45a7c6bfcd7aac"`,
    );
    await queryRunner.query(
      `ALTER TABLE "throughputTransactions" DROP CONSTRAINT "FK_4565bf55711ad05ea696c800912"`,
    );
    await queryRunner.query(
      `ALTER TABLE "throughputTransactions" DROP CONSTRAINT "FK_1f5f326302ee82f3be5b6dd5e70"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pointTransactions_transactionsource_enum_old" AS ENUM('bonus', 'order', 'coupon', 'voucher', 'recharge', 'reversal', 'milestone', 'cart')`,
    );
    await queryRunner.query(
      `ALTER TABLE "pointTransactions" ALTER COLUMN "transactionSource" TYPE "public"."pointTransactions_transactionsource_enum_old" USING "transactionSource"::"text"::"public"."pointTransactions_transactionsource_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."pointTransactions_transactionsource_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."pointTransactions_transactionsource_enum_old" RENAME TO "pointTransactions_transactionsource_enum"`,
    );
    await queryRunner.query(`DROP TABLE "throughputTransactions"`);
    await queryRunner.query(
      `DROP TYPE "public"."throughputTransactions_type_enum"`,
    );
  }
}
