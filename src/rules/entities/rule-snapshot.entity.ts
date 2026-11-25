import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('rulesSnapshots')
export class RulesSnapshot {
  @PrimaryGeneratedColumn()
  id: number;

  //this is magentoOrderId as in cartTransaction
  @Column({ type: 'varchar', nullable: false })
  orderId: string;

  @Column({ type: 'json', nullable: false })
  order: Record<string, any>;

  @Column({ type: 'json', nullable: false })
  updatedOrder: Record<string, any>;

  @Column({ type: 'json', nullable: false })
  wallet: Record<string, any>;

  @Column({ type: 'json', nullable: false })
  customer: Record<string, any>;

  @Column({ type: 'json', nullable: false })
  tier: Record<string, any>;

  @Column({ type: 'json', nullable: false })
  client: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  usage: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  exchange: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  rules: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  preview: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
