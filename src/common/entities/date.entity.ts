import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from './project.entity';

@Entity('dates')
export class DateEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Project, (project) => project.id)
  project: Project;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'boolean' })
  isActive: boolean;

  @Column({ type: 'timestamptz' })
  fromDate: Date;

  @Column({ type: 'timestamptz' })
  toDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
