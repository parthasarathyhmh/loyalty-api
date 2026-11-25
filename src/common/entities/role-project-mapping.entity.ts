import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Project } from './project.entity';
import { Roles } from './role.entity';

@Entity('roleProjectMapping')
export class RoleProjectMapping {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Roles, (role) => role.roleProjectMapping, {
    eager: false,
    nullable: false,
  })
  @JoinColumn({ name: 'roleId' })
  role: Roles;

  @ManyToOne(() => Project, (project) => project.roleProjectMapping, {
    eager: false,
    nullable: false,
  })
  @JoinColumn({ name: 'projectId' })
  project: Project;
}
