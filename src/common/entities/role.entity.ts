import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RoleProjectMapping } from './role-project-mapping.entity';
import { UserRoleMapping } from './user-role-mapping.entity';

@Entity('roles')
export class Roles {
  @PrimaryGeneratedColumn('increment')
  roleId: number;

  @Column({ name: 'roleName', type: 'varchar', length: 255, nullable: false })
  roleName: string;

  @Column({ type: 'jsonb', nullable: false })
  permissions: Record<string, string[]>;

  @OneToMany(() => RoleProjectMapping, (roleproject) => roleproject.role)
  roleProjectMapping: RoleProjectMapping[];

  @OneToMany(() => UserRoleMapping, (userRole) => userRole.role)
  userRoleMapping: UserRoleMapping[];
}
