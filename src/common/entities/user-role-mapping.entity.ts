import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AdminUser } from './admin.entity';
import { Roles } from './role.entity';

@Entity('userRoleMapping')
export class UserRoleMapping {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => AdminUser, (user) => user.userRoleMapping, {
    eager: false,
    nullable: false,
  })
  @JoinColumn({ name: 'adminUserId' })
  adminUser: AdminUser;

  @ManyToOne(() => Roles, (role) => role.userRoleMapping, {
    eager: false,
    nullable: false,
  })
  @JoinColumn({ name: 'roleId' })
  role: Roles;
}
