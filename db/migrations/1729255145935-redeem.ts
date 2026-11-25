import { MigrationInterface, QueryRunner } from 'typeorm';

export class Redeem1729255145935 implements MigrationInterface {
  name = 'Redeem1729255145935';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "customerRewards" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "customerId" integer,
                "projectId" integer,
                "walletId" integer,
                "rewardId" integer,
                CONSTRAINT "PK_109c20cfbf08fe1756875d23778" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "rewardTransactions" (
                "id" SERIAL NOT NULL,
                "points" numeric NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "customerId" integer,
                "projectId" integer,
                "walletId" integer,
                "rewardId" integer,
                CONSTRAINT "PK_1e2b1b73b5c3b8bf0b47b27fd1f" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "customerRewards"
            ADD CONSTRAINT "FK_4c36e88733881e60709e098107a" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "customerRewards"
            ADD CONSTRAINT "FK_55219caab8c3407a9725fc95006" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "customerRewards"
            ADD CONSTRAINT "FK_d4e7540aa6ae0056ea69d9f34e1" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "customerRewards"
            ADD CONSTRAINT "FK_89559a54d72056f7a970debc2b2" FOREIGN KEY ("rewardId") REFERENCES "rewardsCatalog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "rewardTransactions"
            ADD CONSTRAINT "FK_245a07e2f3390c914ef74d19172" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "rewardTransactions"
            ADD CONSTRAINT "FK_883029db7ab4716276225cec6e1" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "rewardTransactions"
            ADD CONSTRAINT "FK_46b21d472f16d542034c2b03370" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "rewardTransactions"
            ADD CONSTRAINT "FK_c8cdfccc3cd9b4b1c0df64dd4c8" FOREIGN KEY ("rewardId") REFERENCES "customerRewards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "rewardTransactions" DROP CONSTRAINT "FK_c8cdfccc3cd9b4b1c0df64dd4c8"
        `);
    await queryRunner.query(`
            ALTER TABLE "rewardTransactions" DROP CONSTRAINT "FK_46b21d472f16d542034c2b03370"
        `);
    await queryRunner.query(`
            ALTER TABLE "rewardTransactions" DROP CONSTRAINT "FK_883029db7ab4716276225cec6e1"
        `);
    await queryRunner.query(`
            ALTER TABLE "rewardTransactions" DROP CONSTRAINT "FK_245a07e2f3390c914ef74d19172"
        `);
    await queryRunner.query(`
            ALTER TABLE "customerRewards" DROP CONSTRAINT "FK_89559a54d72056f7a970debc2b2"
        `);
    await queryRunner.query(`
            ALTER TABLE "customerRewards" DROP CONSTRAINT "FK_d4e7540aa6ae0056ea69d9f34e1"
        `);
    await queryRunner.query(`
            ALTER TABLE "customerRewards" DROP CONSTRAINT "FK_55219caab8c3407a9725fc95006"
        `);
    await queryRunner.query(`
            ALTER TABLE "customerRewards" DROP CONSTRAINT "FK_4c36e88733881e60709e098107a"
        `);
    await queryRunner.query(`
            DROP TABLE "rewardTransactions"
        `);
    await queryRunner.query(`
            DROP TABLE "customerRewards"
        `);
  }
}
