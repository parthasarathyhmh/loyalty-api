export class Image {
  label: string;
  url: string;
}

export class Price {
  currency?: string;
  value: number;
}

export class ProductPrices {
  regular_price: Price;
  final_price: Price;
  discount?: Price;
  discount_percent?: number;
  tax_percent?: number;
  tax?: Price;
}

export class PaymentMethod {
  code: string;
  title: string;
}

export class CartItem {
  sku: string;
  name: string;
  stock_status: string;
  stock_quantity: number;
  packaging: string;
  prices: ProductPrices;
  thumbnail: Image[];
  cart_item_quantity: number;
  cart_item_total: Price;
  cart_item_discount: Price;
  type?: string;
  categories?: string[];
  category_names?: string[];
}

export class CartTotal {
  subtotal_including_tax: Price;
  subtotal_excluding_tax: Price;
  grand_total: Price;
  total_discount: Price;
  applied_taxes: Price;
  loyalty_discount: Price;
}

export class AppliedPromotion {
  title: string;
  id: string;
}

export class AppliedCoupon {
  title: string;
  code?: string;
  id: string;
}

export class FreeItem {
  sku: string;
  quantity: number;
  name: string;
  thumbnail_url: string;
  rule_id: string;
}

export class CustomerAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
}

export class Cart {
  magentoOrderId: string;
  hsfOrderId: string;
  cart_id: string;
  total_quantity: number;
  applied_coupons: AppliedCoupon[] = [];
  delivery_date: string;
  items: CartItem[];
  selected_payment_methods: PaymentMethod[];
  shipping_address: CustomerAddress;
  billing_address: CustomerAddress;
  prices: CartTotal;
  applied_promotions: AppliedPromotion[] = [];
  free_items?: Record<string, FreeItem>;
  errors: CartError[];
  discount_qty?: number;
  loyalty_redeemed?: number;
}

enum CartErrorType {
  MOV = 'mov',
}

class CartError {
  message: string;
  type: CartErrorType;
}
