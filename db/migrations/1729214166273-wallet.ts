import { MigrationInterface, QueryRunner } from 'typeorm';

export class Wallet1729214166273 implements MigrationInterface {
  name = 'Wallet1729214166273';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "projectId" integer NOT NULL, "workspaceId" integer NOT NULL, CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "wallets" ("id" SERIAL NOT NULL, "workspaceId" integer NOT NULL, "projectId" integer NOT NULL, "customerId" integer NOT NULL, "earned" numeric NOT NULL DEFAULT '0', "spent" numeric NOT NULL DEFAULT '0', "active" numeric NOT NULL DEFAULT '0', "expired" numeric NOT NULL DEFAULT '0', "blocked" numeric NOT NULL DEFAULT '0', "pending" numeric NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "FK_5a994c441a4612d4a35e0927da5" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "FK_104caf95f15d3dcafb44e6956c5" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_188ce929634a2646df487d2046f" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_5f73d5701eb168dcaf052407747" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_014befecbbc1dc6f0c649e33572" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "FK_014befecbbc1dc6f0c649e33572"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "FK_5f73d5701eb168dcaf052407747"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "FK_188ce929634a2646df487d2046f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP CONSTRAINT "FK_104caf95f15d3dcafb44e6956c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP CONSTRAINT "FK_5a994c441a4612d4a35e0927da5"`,
    );
    await queryRunner.query(`DROP TABLE "wallets"`);
    await queryRunner.query(`DROP TABLE "clients"`);
  }
}
