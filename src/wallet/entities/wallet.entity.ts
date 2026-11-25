import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../../common/entities/customer.entity';
import { Project } from '../../common/entities/project.entity';
import { Workspace } from '../../common/entities/workspace.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  workspaceId: number;

  @Column()
  projectId: number;

  @Column()
  customerId: number;

  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column('varchar')
  retailerCode: string;

  @Column('numeric', { default: 0 })
  earned: number;

  @Column('numeric', { default: 0 })
  spent: number;

  @Column('numeric', { default: 0 })
  active: number;

  @Column('numeric', { default: 0 })
  expired: number;

  @Column('numeric', { default: 0 })
  blocked: number;

  @Column('numeric', { default: 0 })
  pending: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
