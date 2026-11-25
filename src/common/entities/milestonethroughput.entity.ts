import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from './project.entity';

@Entity('milestoneThroughput')
@Unique(['name', 'project'])
export class Milestonethroughput {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Project, (project) => project.id)
  project: Project;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  soldTo: string;

  @Column({ type: 'integer', default: 0 })
  baseValue: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentageGrowth: number;

  @Column({ type: 'integer', default: 0 })
  valueToPoints: number;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ type: 'bool', default: false })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
