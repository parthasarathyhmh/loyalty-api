import { MigrationInterface, QueryRunner } from 'typeorm';

export class RulesSnapshotTable1733471849568 implements MigrationInterface {
  name = 'RulesSnapshotTable1733471849568';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "rulesSnapshots" ("id" SERIAL NOT NULL, "orderId" character varying NOT NULL, "order" json NOT NULL, "wallet" json NOT NULL, "customer" json NOT NULL, "tier" json NOT NULL, "client" json NOT NULL, "usage" json, "exchange" json, "rules" json, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a376a8eb543cd436a3290e1086b" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "rulesSnapshots"`);
  }
}
