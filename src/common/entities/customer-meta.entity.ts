import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity('customerMeta')
export class Customermeta {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @OneToOne(() => Customer, (customer) => customer.customerMeta)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'boolean', default: true })
  isEligibleForLoyalty: boolean;
}
