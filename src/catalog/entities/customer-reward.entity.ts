import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RewardCatalogueEntity } from '../../common/entities/catalog.entity';
import { Coupon } from '../../common/entities/coupon.entity';
import { Customer } from '../../common/entities/customer.entity';
import { Project } from '../../common/entities/project.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';

@Entity('customerRewards')
export class CustomerReward {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Customer, (customer) => customer.id)
  customer: Customer;

  @ManyToOne(() => Project, (project) => project.id)
  project: Project;

  @ManyToOne(() => Wallet, (wallet) => wallet.id)
  wallet: Wallet;

  @ManyToOne(() => RewardCatalogueEntity, (reward) => reward.id)
  reward: RewardCatalogueEntity;

  @OneToOne(() => Coupon, (coupon) => coupon.id)
  @JoinColumn()
  coupon: Coupon;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
