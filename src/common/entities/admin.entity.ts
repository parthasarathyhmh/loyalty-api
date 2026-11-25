import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserRoleMapping } from './user-role-mapping.entity';

@Entity('adminUser')
export class AdminUser {
  @PrimaryGeneratedColumn('increment')
  adminId: number;

  @Column({ type: 'varchar', length: 64, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 128, nullable: false })
  password: string;

  @OneToMany(() => UserRoleMapping, (userRole) => userRole.adminUser)
  userRoleMapping: UserRoleMapping[];

  @Column({ type: 'bool', nullable: false }) // nullable: false to be
  status: boolean;

  @Column({ type: 'varchar', length: 100, nullable: false, default: '' })
  passwordResetHash: string;

  @Column({ type: 'boolean', default: false })
  passwordResetSend: boolean;

  @Column({ type: 'boolean', default: false })
  firstNotificationSend: boolean;

  @Column({ type: 'boolean', default: false })
  secondNotificationSend: boolean;

  @Column({
    type: 'timestamptz',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  passwordUpdatedAt: Date;
}
