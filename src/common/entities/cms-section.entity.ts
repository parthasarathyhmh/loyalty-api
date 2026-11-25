import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminUser } from './admin.entity';

@Entity('cmsSections')
export class CMSSection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon: string;

  @Column({ type: 'varchar', length: 74, nullable: false })
  title: string;

  @Column({ type: 'jsonb', nullable: true })
  meta: Record<string, any>;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ type: 'boolean', default: false })
  status: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => AdminUser, (user) => user.adminId, { nullable: false })
  createdBy: AdminUser;

  @ManyToOne(() => AdminUser, (user) => user.adminId, { nullable: true })
  updatedBy: AdminUser;
}
