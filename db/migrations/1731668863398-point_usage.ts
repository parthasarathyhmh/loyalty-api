import { MigrationInterface, QueryRunner } from "typeorm";

export class PointUsage1731668863398 implements MigrationInterface {
    name = 'PointUsage1731668863398'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "pointUsage" (
                "id" SERIAL NOT NULL,
                "usage" numeric NOT NULL,
                "pointTransactionId" integer,
                "pointId" integer,
                CONSTRAINT "PK_6991dc489665dd42b52884c39f5" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "pointUsage"
            ADD CONSTRAINT "FK_085391a7c4ae3ba53cb7dcc7f8d" FOREIGN KEY ("pointTransactionId") REFERENCES "pointTransactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "pointUsage"
            ADD CONSTRAINT "FK_f17cc238b22695bbf003fd2cd7d" FOREIGN KEY ("pointId") REFERENCES "points"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "pointUsage" DROP CONSTRAINT "FK_f17cc238b22695bbf003fd2cd7d"
        `);
        await queryRunner.query(`
            ALTER TABLE "pointUsage" DROP CONSTRAINT "FK_085391a7c4ae3ba53cb7dcc7f8d"
        `);
        await queryRunner.query(`
            DROP TABLE "pointUsage"
        `);
    }

}
