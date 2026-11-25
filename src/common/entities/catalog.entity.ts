import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { RewardsCategory } from './category.entity'; // adjust import path as needed
import { Coupon } from './coupon.entity';
import { Project } from './project.entity';
import { ThirdpartyPlatform } from './thirdparty-platform.entity'; // adjust import path as needed
import { Tier } from './tier.entity';

@Entity('rewardsCatalog')
@Unique(['code'])
export class RewardCatalogueEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Project, (project) => project.id)
  project: Project;

  @Column({ type: 'varchar', length: 64, nullable: true })
  code: string;

  @Column({ type: 'int', nullable: false })
  pointsValue: number;

  @ManyToOne(() => ThirdpartyPlatform, (platform) => platform.id, {
    nullable: false,
  })
  thirdPartyPlatform: ThirdpartyPlatform;

  @ManyToOne(() => RewardsCategory, (category) => category.id, {
    nullable: false,
  })
  category: RewardsCategory;

  @ManyToMany(() => Tier, (tier) => tier.id, { nullable: true })
  @JoinTable({
    name: 'rewardsTiers',
    joinColumn: { name: 'rewardsId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tierId', referencedColumnName: 'id' },
  })
  tiers: Tier[];

  @Column({ type: 'text', nullable: true })
  name: string;

  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  validity: Date;

  @Column({ type: 'decimal', nullable: false })
  price: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  tnC: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  link: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Coupon, (Coupon) => Coupon.rewards)
  couponCodes: Coupon[];

  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;

  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  updatedAt: Date;
}
