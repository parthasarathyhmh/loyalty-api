import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWalletToPointTransactions1732269609420
  implements MigrationInterface
{
  name = 'AddWalletToPointTransactions1732269609420';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "pointTransactions"
            ADD "walletId" integer
        `);
    await queryRunner.query(`
            ALTER TABLE "pointTransactions"
            ADD CONSTRAINT "FK_8da98490d331fd998057ea3dcbd" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "pointTransactions" DROP CONSTRAINT "FK_8da98490d331fd998057ea3dcbd"
        `);
    await queryRunner.query(`
            ALTER TABLE "pointTransactions" DROP COLUMN "walletId"
        `);
  }
}
