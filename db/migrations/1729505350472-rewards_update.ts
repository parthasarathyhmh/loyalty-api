import { MigrationInterface, QueryRunner } from 'typeorm';

export class RewardsUpdate1729505350472 implements MigrationInterface {
  name = 'RewardsUpdate1729505350472';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "customerRewards"
            ADD "couponId" integer
        `);
    await queryRunner.query(`
            ALTER TABLE "customerRewards"
            ADD CONSTRAINT "UQ_215ed6a4528e313d1e5d7164745" UNIQUE ("couponId")
        `);
    await queryRunner.query(`
            ALTER TABLE "customerRewards"
            ADD CONSTRAINT "FK_215ed6a4528e313d1e5d7164745" FOREIGN KEY ("couponId") REFERENCES "rewardsCoupons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "customerRewards" DROP CONSTRAINT "FK_215ed6a4528e313d1e5d7164745"
        `);
    await queryRunner.query(`
            ALTER TABLE "customerRewards" DROP CONSTRAINT "UQ_215ed6a4528e313d1e5d7164745"
        `);
    await queryRunner.query(`
            ALTER TABLE "customerRewards" DROP COLUMN "couponId"
        `);
  }
}
