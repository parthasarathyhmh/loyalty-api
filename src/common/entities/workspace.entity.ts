import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { Project } from './project.entity';

export enum WorkspaceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 64, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 16, unique: true, nullable: false })
  code: string;

  @Column({ type: 'varchar', length: 64, unique: true, nullable: true })
  slug: string;

  @Column({ type: 'jsonb', nullable: false })
  locale: Record<string, any>;

  @Column({ type: 'varchar', length: 16, nullable: false })
  defaultLocale: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  sapLandscape: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  isdCode: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  currency: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  sponser: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: WorkspaceStatus,
    default: WorkspaceStatus.ACTIVE,
  })
  status: WorkspaceStatus;

  @OneToMany(() => Project, (project) => project.workspace)
  projects: Project[];

  @OneToMany(() => Customer, (customer) => customer.workspace)
  customers: Customer[];
}
