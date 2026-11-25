import { MigrationInterface, QueryRunner } from "typeorm";

export class CheckoutRedeem1731324523924 implements MigrationInterface {
    name = 'CheckoutRedeem1731324523924'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "checkoutTransactions" (
                "id" SERIAL NOT NULL,
                "points" numeric NOT NULL,
                "discount" numeric NOT NULL,
                "cartId" character varying NOT NULL,
                "pending" boolean NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "customerId" integer,
                "projectId" integer,
                "walletId" integer,
                CONSTRAINT "PK_246c09f0114359ec2ebf0f2d763" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "checkoutTransactions"
            ADD CONSTRAINT "FK_8d761110b73ed4614d5773ff63f" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "checkoutTransactions"
            ADD CONSTRAINT "FK_df3be3a63676e20fc0cf84df0a3" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "checkoutTransactions"
            ADD CONSTRAINT "FK_90baff585631933e3d616d1b05a" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "checkoutTransactions" DROP CONSTRAINT "FK_90baff585631933e3d616d1b05a"
        `);
        await queryRunner.query(`
            ALTER TABLE "checkoutTransactions" DROP CONSTRAINT "FK_df3be3a63676e20fc0cf84df0a3"
        `);
        await queryRunner.query(`
            ALTER TABLE "checkoutTransactions" DROP CONSTRAINT "FK_8d761110b73ed4614d5773ff63f"
        `);
        await queryRunner.query(`
            DROP TABLE "checkoutTransactions"
        `);
    }

}
