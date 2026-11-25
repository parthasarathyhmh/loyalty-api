import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RewardCatalogueEntity } from './catalog.entity';

@Entity('rewardsCoupons')
export class Coupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64, nullable: false })
  code: string;

  @ManyToOne(
    () => RewardCatalogueEntity,
    (RewardCatalogueEntity) => RewardCatalogueEntity.couponCodes,
    { nullable: true },
  )
  @JoinColumn({ name: 'rewardsId' })
  rewards: RewardCatalogueEntity;

  @Column({ type: 'boolean', default: false })
  isRedeemed: boolean;

  @Column({ type: 'varchar', length: 64, nullable: true })
  customerId: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  retailerCode: string;

  @Column({ type: 'timestamptz', nullable: true })
  redeemedAt: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
