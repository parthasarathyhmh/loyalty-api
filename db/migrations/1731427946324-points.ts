import { MigrationInterface, QueryRunner } from "typeorm";

export class Points1731427946324 implements MigrationInterface {
    name = 'Points1731427946324'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "points" (
                "id" SERIAL NOT NULL,
                "pending" numeric NOT NULL DEFAULT '0',
                "earned" numeric NOT NULL DEFAULT '0',
                "active" numeric NOT NULL DEFAULT '0',
                "blocked" numeric NOT NULL DEFAULT '0',
                "spent" numeric NOT NULL DEFAULT '0',
                "expiry" TIMESTAMP WITH TIME ZONE,
                "expired" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "walletId" integer,
                CONSTRAINT "PK_57a558e5e1e17668324b165dadf" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."pointTransactions_transactiontype_enum" AS ENUM('credit', 'debit')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."pointTransactions_transactionsource_enum" AS ENUM(
                'bonus',
                'order',
                'coupon',
                'voucher',
                'recharge'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "pointTransactions" (
                "id" SERIAL NOT NULL,
                "transactionId" numeric NOT NULL,
                "points" numeric NOT NULL,
                "transactionType" "public"."pointTransactions_transactiontype_enum" NOT NULL,
                "transactionSource" "public"."pointTransactions_transactionsource_enum" NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "pointId" integer,
                CONSTRAINT "PK_af059c5b6c5c302f725becef411" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "points"
            ADD CONSTRAINT "FK_1ecdfdc80ccdd29055ef2adb01e" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "pointTransactions"
            ADD CONSTRAINT "FK_f0eda8a9d5d4b162d096754cf60" FOREIGN KEY ("pointId") REFERENCES "points"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "pointTransactions" DROP CONSTRAINT "FK_f0eda8a9d5d4b162d096754cf60"
        `);
        await queryRunner.query(`
            ALTER TABLE "points" DROP CONSTRAINT "FK_1ecdfdc80ccdd29055ef2adb01e"
        `);
        await queryRunner.query(`
            DROP TABLE "pointTransactions"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."pointTransactions_transactionsource_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."pointTransactions_transactiontype_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "points"
        `);
    }

}
