import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Wallet } from './wallet.entity';

@Entity('points')
export class Point {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;

  @Column()
  walletId: number;

  @Column('numeric', { default: 0 })
  pending: number;

  @Column('numeric', { default: 0 })
  earned: number;

  @Column('numeric', { default: 0 })
  active: number;

  @Column('numeric', { default: 0 })
  blocked: number;

  @Column('numeric', { default: 0 })
  spent: number;

  @Column('timestamptz', { nullable: true })
  expiry: Date;

  @Column('boolean', { default: false })
  expired: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
