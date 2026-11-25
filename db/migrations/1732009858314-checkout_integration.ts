import { MigrationInterface, QueryRunner } from 'typeorm';

export class CheckoutIntegration1732009858314 implements MigrationInterface {
  name = 'CheckoutIntegration1732009858314';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."pointUsage_fromstate_enum" AS ENUM('active', 'pending', 'blocked', 'spent')
        `);
    await queryRunner.query(`
            ALTER TABLE "pointUsage"
            ADD "fromState" "public"."pointUsage_fromstate_enum" NOT NULL DEFAULT 'active'
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."pointUsage_tostate_enum" AS ENUM('active', 'pending', 'blocked', 'spent')
        `);
    await queryRunner.query(`
            ALTER TABLE "pointUsage"
            ADD "toState" "public"."pointUsage_tostate_enum" NOT NULL DEFAULT 'spent'
        `);
    await queryRunner.query(`
            ALTER TABLE "pointUsage"
            ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()
        `);
    await queryRunner.query(`
            ALTER TABLE "pointUsage"
            ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
        `);
    await queryRunner.query(`
            ALTER TABLE "checkoutTransactions"
            ADD "pointTransactionId" integer
        `);
    await queryRunner.query(`
            ALTER TABLE "checkoutTransactions"
            ADD CONSTRAINT "UQ_7f9dd0941d6411c171760d40ca4" UNIQUE ("pointTransactionId")
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
                'reversal'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "pointTransactions"
            ALTER COLUMN "transactionSource" TYPE "public"."pointTransactions_transactionsource_enum" USING "transactionSource"::"text"::"public"."pointTransactions_transactionsource_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."pointTransactions_transactionsource_enum_old"
        `);
    await queryRunner.query(`
            ALTER TABLE "checkoutTransactions"
            ADD CONSTRAINT "FK_7f9dd0941d6411c171760d40ca4" FOREIGN KEY ("pointTransactionId") REFERENCES "pointTransactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "checkoutTransactions" DROP CONSTRAINT "FK_7f9dd0941d6411c171760d40ca4"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."pointTransactions_transactionsource_enum_old" AS ENUM(
                'bonus',
                'order',
                'coupon',
                'voucher',
                'recharge'
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
            ALTER TABLE "checkoutTransactions" DROP CONSTRAINT "UQ_7f9dd0941d6411c171760d40ca4"
        `);
    await queryRunner.query(`
            ALTER TABLE "checkoutTransactions" DROP COLUMN "pointTransactionId"
        `);
    await queryRunner.query(`
            ALTER TABLE "pointUsage" DROP COLUMN "updatedAt"
        `);
    await queryRunner.query(`
            ALTER TABLE "pointUsage" DROP COLUMN "createdAt"
        `);
    await queryRunner.query(`
            ALTER TABLE "pointUsage" DROP COLUMN "toState"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."pointUsage_tostate_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "pointUsage" DROP COLUMN "fromState"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."pointUsage_fromstate_enum"
        `);
  }
}
