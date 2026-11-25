import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProcessed1733487317349 implements MigrationInterface {
  name = 'AddProcessed1733487317349';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "milestoneTransactions"
            ADD "processed" boolean NOT NULL DEFAULT false
        `);
    await queryRunner.query(`
            ALTER TABLE "milestoneTransactions"
            ADD "ruleId" numeric NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "cartTransactions"
            ADD "processed" boolean NOT NULL DEFAULT false
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."pointTransactions_transactionsource_enum"
            RENAME TO "pointTransactions_transactionsource_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."pointTransactions_transactionsource_enum" AS ENUM(
                'bonus',
                'order',
                'coupon',
                'voucher',
                'recharge',
                'reversal',
                'milestone',
                'cart'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "pointTransactions"
            ALTER COLUMN "transactionSource" TYPE "public"."pointTransactions_transactionsource_enum" USING "transactionSource"::"text"::"public"."pointTransactions_transactionsource_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."pointTransactions_transactionsource_enum_old"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."pointTransactions_transactionsource_enum_old" AS ENUM(
                'bonus',
                'order',
                'coupon',
                'voucher',
                'recharge',
                'reversal',
                'milestone'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "pointTransactions"
            ALTER COLUMN "transactionSource" TYPE "public"."pointTransactions_transactionsource_enum_old" USING "transactionSource"::"text"::"public"."pointTransactions_transactionsource_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."pointTransactions_transactionsource_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."pointTransactions_transactionsource_enum_old"
            RENAME TO "pointTransactions_transactionsource_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "cartTransactions" DROP COLUMN "processed"
        `);
    await queryRunner.query(`
            ALTER TABLE "milestoneTransactions" DROP COLUMN "ruleId"
        `);
    await queryRunner.query(`
            ALTER TABLE "milestoneTransactions" DROP COLUMN "processed"
        `);
  }
}
