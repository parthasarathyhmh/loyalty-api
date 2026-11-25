import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColumnIntoCheckoutTxn1736168456030
  implements MigrationInterface
{
  name = 'AddColumnIntoCheckoutTxn1736168456030';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "checkoutTransactions" ADD "magentoOrderId" character varying(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkoutTransactions" ADD "hsfOrderId" character varying(64)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "checkoutTransactions" DROP COLUMN "hsfOrderId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkoutTransactions" DROP COLUMN "magentoOrderId"`,
    );
  }
}
