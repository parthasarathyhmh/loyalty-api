import { BadRequestException, Injectable } from '@nestjs/common';
import { CartItem } from './dtos/cart.dto';
import { RuleData, UsageData } from './processors/data.processor';

@Injectable()
export class AttributeService {
  round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private getAmountByPercent(price: number, percent = 0) {
    return price * (percent / 100);
  }

  isSelection(attribute: string): boolean {
    return ['SKU', 'Brand', 'Category'].includes(attribute);
  }

  isCartSelection(attribute: string): boolean {
    return [
      'Price in cart',
      'Row total in cart (incl. taxes and discounts)',
      'Quantity in cart',
    ].includes(attribute);
  }

  isCustomerSelection(attribute: string): boolean {
    return [
      'Total sales (excl. tax)',
      'Total quantity',
      'Total sales (incl. tax)',
    ].includes(attribute);
  }

  private getValueFromCart(attribute: string, items: CartItem[]) {
    switch (attribute) {
      case 'Price in cart': {
        //  Cart Item Total
        return items.reduce(
          (total, item) => total + item.cart_item_total.value,
          0,
        );
      }

      case 'Row total in cart (incl. taxes and discounts)': {
        // Cart Item Total + Tax - Discount
        const rowTotal = items.reduce((total, item) => {
          const itemValue = this.round(
            item.cart_item_total.value - item.cart_item_discount.value,
          );

          const taxTotal = this.getAmountByPercent(
            itemValue,
            item.prices.tax_percent,
          );

          return total + itemValue + taxTotal;
        }, 0);

        return this.round(rowTotal);
      }

      case 'Quantity in cart':
        return items.reduce(
          (total, item) => total + item.cart_item_quantity,
          0,
        );
    }
  }

  private getValueFromUsage(
    attribute: string,
    value: string,
    usage: UsageData,
    type: 'sku' | 'category',
  ) {
    const values = value.includes(',') ? value.split(',') : [value];

    switch (attribute) {
      case 'Total sales (excl. tax)': {
        const property = type === 'sku' ? 'sales' : 'categorySales';
        return values.reduce(
          (total, value) => total + (usage?.products[property][value] ?? 0),
          0,
        );
      }
      case 'Total quantity': {
        const property = type === 'sku' ? 'count' : 'categoryCount';
        return values.reduce(
          (total, value) => total + (usage?.products[property][value] ?? 0),
          0,
        );
      }

      case 'Total sales (incl. tax)': {
        const property =
          type === 'sku' ? 'salesWithTax' : 'categorySalesWithTax';
        return values.reduce(
          (total, value) => total + (usage?.products[property][value] ?? 0),
          0,
        );
      }
    }
  }

  getValueForMilestone(
    attribute: string,
    selectionAttribute: string,
    selectionValue: string,
    usage: UsageData,
  ) {
    if (selectionAttribute === 'SKU') {
      return this.getValueFromUsage(attribute, selectionValue, usage, 'sku');
    }
    if (selectionAttribute === 'Category') {
      return this.getValueFromUsage(
        attribute,
        selectionValue,
        usage,
        'category',
      );
    }
  }

  getValueSelection(
    attribute: string,
    selectionAttribute: string,
    selectionValue: string,
    { cart, order, usage }: RuleData,
  ) {
    if (this.isCartSelection(attribute)) {
      if (selectionAttribute === 'SKU') {
        const items = (cart || order).items.filter((item) =>
          selectionValue.includes(',')
            ? selectionValue.split(',').includes(item.sku)
            : selectionValue === item.sku,
        );
        return this.getValueFromCart(attribute, items);
      }

      if (selectionAttribute === 'Category') {
        const items = (cart || order).items.filter((item) =>
          selectionValue.includes(',')
            ? selectionValue
                .split(',')
                .some((cat) => item?.category_names?.includes(cat))
            : item?.category_names?.includes(selectionValue),
        );
        return this.getValueFromCart(attribute, items);
      }
    }

    if (this.isCustomerSelection(attribute)) {
      return this.getValueForMilestone(
        attribute,
        selectionAttribute,
        selectionValue,
        usage,
      );
    }

    throw new BadRequestException(
      `Unsupported subselection: ${attribute} with ${selectionAttribute}`,
    );
  }

  getValue(
    attribute: string,
    { cart, customer, tier, wallet, usage, order }: RuleData,
    // biome-ignore lint/suspicious/noExplicitAny: this can return any value
  ): any {
    const isCart = !!cart; // Check if cart exists
    const isOrder = !!order; // check if order exists

    switch (attribute) {
      // Product

      case 'SKU': {
        if (isCart) return cart.items?.map((item) => item.sku);
        if (isOrder) return order?.items?.map((item) => item.sku);
        return Object.keys(usage.products.count);
      }

      case 'Category': {
        if (isCart) return cart.items?.flatMap((item) => item.category_names);
        if (isOrder)
          return order?.items?.flatMap((item) => item.category_names);
        return Object.keys(usage.products.categoryCount);
      }

      // Customer
      case 'Lifetime sales':
        return usage?.orders?.sales;
      case 'Customer group':
        return customer?.group;
      case 'Retailer code':
        return customer?.retailerCode;
      case 'Lifetime points earned':
        return wallet?.earned;
      case 'Customer tier':
        return tier?.name;
      case 'Lifetime points spent':
        return wallet?.spent;
      case 'Number of orders':
        return usage?.orders?.count;
      case 'Order subtotal':
        return isCart
          ? cart.prices?.subtotal_excluding_tax?.value
          : order?.order_summary?.subtotal_excluding_tax?.value;
      case 'Total sales':
        return usage?.orders?.sales;
      case 'Total points earned':
        return wallet?.earned;
      case 'Total points spent':
        return wallet?.spent;
      case 'Customer segment':
        return customer?.segments;

      // Cart or Order
      case 'Total items':
        return isCart ? cart.total_quantity : order?.total_items;
      case 'Coupon used':
        return isCart
          ? cart.applied_coupons?.length > 0
          : order?.applied_coupons?.length > 0;
      case 'Coupon code used':
        return isCart
          ? cart.applied_coupons?.map((coupon) => coupon.code)
          : order?.applied_coupons?.map((coupon) => coupon.code);
      case 'Subtotal (incl. taxes and discounts)':
        return isCart
          ? cart.prices?.grand_total?.value
          : order?.order_summary?.grand_total?.value;
      case 'Payment method':
        return isCart
          ? cart.selected_payment_methods?.map((method) => method.title)
          : order?.payment_methods?.map((method) => method.title);
      case 'Subtotal (excl. taxes and discounts)':
        return isCart
          ? cart.prices?.subtotal_excluding_tax?.value
          : order?.order_summary?.subtotal_excluding_tax?.value;

      default:
        throw new BadRequestException(`Unsupported attribute: ${attribute}`);
    }
  }
}
