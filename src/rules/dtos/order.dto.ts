import {
  AppliedCoupon,
  AppliedPromotion,
  CartItem,
  CartTotal,
  PaymentMethod,
} from './cart.dto';
import { CustomerAddressDto } from './customer-address.dto';

export class Order {
  _id: string;

  //order no from magento (mage_order_nr)
  order_nr: string;

  status: string;

  order_created: Date;

  expected_delivery_date: string;

  total_items: number;

  payment_methods: PaymentMethod[];

  items: CartItem[];

  order_summary: CartTotal;

  applied_promotions: AppliedPromotion[];

  applied_coupons: AppliedCoupon[];

  billing_address: CustomerAddressDto;

  shipping_address: CustomerAddressDto;
}
