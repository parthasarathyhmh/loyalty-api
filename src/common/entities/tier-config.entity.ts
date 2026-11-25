import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from './project.entity';

export enum TierCycle {
  Never = 'Never',
  Monthly = 'Monthly',
  Quarterly = 'Quarterly',
  HalfYearly = 'HalfYearly',
  Yearly = 'Yearly',
}

@Entity('tiersConfig')
export class TierConfig {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Project, (project) => project.id)
  project: Project;

  @Column({ type: 'enum', enum: TierCycle })
  cycle: TierCycle;

  @Column({ type: 'boolean' })
  useRegistrationDate: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
