import { MigrationInterface, QueryRunner } from "typeorm";

export class CartTransaction1733395910774 implements MigrationInterface {
    name = 'CartTransaction1733395910774'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."cartTransactions_type_enum" AS ENUM('credit', 'debit')`);
        await queryRunner.query(`CREATE TABLE "cartTransactions" ("id" SERIAL NOT NULL, "points" numeric NOT NULL, "magentoOrderId" character varying(64) NOT NULL, "hsfOrderId" character varying(64) NOT NULL, "type" "public"."cartTransactions_type_enum" NOT NULL DEFAULT 'credit', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "projectId" integer, "customerId" integer, "walletId" integer, CONSTRAINT "PK_2c0becd571fc2dd740e0e1c2f75" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "cartTransactions" ADD CONSTRAINT "FK_ae77751e4f1e7a7f13fdf872627" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cartTransactions" ADD CONSTRAINT "FK_07c7a660889461e75d557dcee8e" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cartTransactions" ADD CONSTRAINT "FK_22a61aea9f469f61f1803142247" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cartTransactions" DROP CONSTRAINT "FK_22a61aea9f469f61f1803142247"`);
        await queryRunner.query(`ALTER TABLE "cartTransactions" DROP CONSTRAINT "FK_07c7a660889461e75d557dcee8e"`);
        await queryRunner.query(`ALTER TABLE "cartTransactions" DROP CONSTRAINT "FK_ae77751e4f1e7a7f13fdf872627"`);
        await queryRunner.query(`DROP TABLE "cartTransactions"`);
        await queryRunner.query(`DROP TYPE "public"."cartTransactions_type_enum"`);
    }

}
