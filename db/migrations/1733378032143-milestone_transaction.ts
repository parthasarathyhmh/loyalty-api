import { MigrationInterface, QueryRunner } from 'typeorm';

export class MilestoneTransaction1733378032143 implements MigrationInterface {
  name = 'MilestoneTransaction1733378032143';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."milestoneTransactions_type_enum" AS ENUM('credit', 'debit')`,
    );
    await queryRunner.query(
      `CREATE TABLE "milestoneTransactions" ("id" SERIAL NOT NULL, "points" numeric NOT NULL, "type" "public"."milestoneTransactions_type_enum" NOT NULL DEFAULT 'credit', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "projectId" integer, "customerId" integer, "walletId" integer, CONSTRAINT "PK_10f2a56a7baf5c42255f732a922" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."pointTransactions_transactionsource_enum" RENAME TO "pointTransactions_transactionsource_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pointTransactions_transactionsource_enum" AS ENUM('bonus', 'order', 'coupon', 'voucher', 'recharge', 'reversal', 'milestone')`,
    );
    await queryRunner.query(
      `ALTER TABLE "pointTransactions" ALTER COLUMN "transactionSource" TYPE "public"."pointTransactions_transactionsource_enum" USING "transactionSource"::"text"::"public"."pointTransactions_transactionsource_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."pointTransactions_transactionsource_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestoneTransactions" ADD CONSTRAINT "FK_df442492715f72be98e2ba30b3e" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestoneTransactions" ADD CONSTRAINT "FK_d65075794289fdd66e0a2672018" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestoneTransactions" ADD CONSTRAINT "FK_ecbcd64beb79ac3a3fa11339a78" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "milestoneTransactions" DROP CONSTRAINT "FK_ecbcd64beb79ac3a3fa11339a78"`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestoneTransactions" DROP CONSTRAINT "FK_d65075794289fdd66e0a2672018"`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestoneTransactions" DROP CONSTRAINT "FK_df442492715f72be98e2ba30b3e"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pointTransactions_transactionsource_enum_old" AS ENUM('bonus', 'order', 'coupon', 'voucher', 'recharge', 'reversal')`,
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
    await queryRunner.query(`DROP TABLE "milestoneTransactions"`);
    await queryRunner.query(
      `DROP TYPE "public"."milestoneTransactions_type_enum"`,
    );
  }
}
