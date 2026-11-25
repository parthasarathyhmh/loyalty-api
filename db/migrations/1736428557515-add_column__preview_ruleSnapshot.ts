import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColumn_previewRuleSnapshot1736428557515
  implements MigrationInterface
{
  name = 'AddColumn_previewRuleSnapshot1736428557515';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "rulesSnapshots" ADD "preview" json`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "rulesSnapshots" DROP COLUMN "preview"`,
    );
  }
}
