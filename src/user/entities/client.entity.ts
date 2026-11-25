import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from '../../common/entities/project.entity';
import { Workspace } from '../../common/entities/workspace.entity';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  code: string;

  @Column()
  projectId: number;

  @Column()
  workspaceId: number;

  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;
}
