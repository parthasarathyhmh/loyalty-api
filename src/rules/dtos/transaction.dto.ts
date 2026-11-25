import { TransactionType } from '@/wallet/entities/point-transaction.entity';
import { Customer } from '../../common/entities/customer.entity';
import { Cart } from './cart.dto';
import { Order } from './order.dto';

export class TransactionPayload {
  workspaceId: number;
  projectId: number;
  customer: Customer;
  cart?: Cart;
  order?: Order;
  orderId?: string;
  points: number;
  expiry?: Date;
  type: TransactionType;
  comment: string;
  ruleId?: number;
}
