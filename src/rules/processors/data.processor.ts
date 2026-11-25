import { Milestonethroughput } from '@/common/entities/milestonethroughput.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { Between, DataSource, FindOperator, In, Repository } from 'typeorm';
import { Customer } from '../../common/entities/customer.entity';
import { DateEntity } from '../../common/entities/date.entity';
import { ExchangeRate } from '../../common/entities/exchange.entity';
import {
  Invoice,
  NetInvoiceItem,
  NetInvoiceResponse,
} from '../../common/entities/invoice.entity';
import { Rule, RuleType } from '../../common/entities/rules.entity';
import { Tier } from '../../common/entities/tier.entity';
import { numeric } from '../../common/functions/numeric';
import HttpService from '../../common/services/http.service';
import { Client } from '../../user/entities/client.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { Cart } from '../dtos/cart.dto';
import { Order } from '../dtos/order.dto';
import { Preview } from '../dtos/preview.dto';
import { RulesSnapshot } from '../entities/rule-snapshot.entity';

export interface RuleData {
  cart?: Cart;
  order?: Order;
  orderId?: string;
  wallet: Wallet;
  customer: Customer;
  tier?: Tier;
  client?: Client;
  usage?: UsageData;
  exchange?: ExchangeRate;
  rules?: Rule[];
  preview?: Preview;
}

export interface UsageData {
  products: {
    count: Record<string, number>;
    sales: Record<string, number>;
    salesWithTax: Record<string, number>;
    categoryCount: Record<string, number>;
    categorySales: Record<string, number>;
    categorySalesWithTax: Record<string, number>;
  };
  orders: {
    count: number;
    sales: number;
  };
}

@Injectable()
export class DataProcessor {
  constructor(
    @InjectRepository(Client)
    private readonly clients: Repository<Client>,
    @InjectRepository(Wallet)
    private readonly wallets: Repository<Wallet>,
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    @InjectRepository(Tier)
    private readonly tiers: Repository<Tier>,
    @InjectRepository(Rule)
    private readonly rules: Repository<Rule>,
    @InjectRepository(RulesSnapshot)
    private readonly rulesSnapshot: Repository<RulesSnapshot>,
    @InjectRepository(DateEntity)
    private readonly dates: Repository<DateEntity>,
    @InjectRepository(Milestonethroughput)
    private readonly throughputs: Repository<Milestonethroughput>,
    @InjectRepository(Invoice)
    private readonly invoices: Repository<Invoice>,
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  private readonly hsfUrl = this.config.get<string>('HSF_API_URL');
  private readonly hsfToken = this.config.get<string>('HSF_TOKEN');

  async buildWithCart(
    clientId: string,
    userId: string,
    cart: Cart,
  ): Promise<RuleData> {
    return {
      ...(await this.build(clientId, userId)),
      cart,
    };
  }

  private betweenDate(start: Date, end: Date): FindOperator<string> {
    return Between(
      DateTime.fromJSDate(start).toFormat('yyyy-MM-dd'),
      DateTime.fromJSDate(end).toFormat('yyyy-MM-dd'),
    );
  }

  async buildOrderRuleEvaluation(
    rulesSnapshot: RulesSnapshot,
    invoice: NetInvoiceItem[],
  ): Promise<RuleData> {
    const {
      id,
      orderId,
      order,
      wallet,
      rules,
      customer,
      tier,
      client,
      usage,
      exchange,
    } = rulesSnapshot;

    const lineOrder = structuredClone(order);
    const skuMap = new Map(
      invoice.map(({ skuCode, netQuantity }) => [skuCode, Number(netQuantity)]),
    );

    let subtotalExcludingTax = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    for (const item of lineOrder.items) {
      const netQuantity = skuMap.get(item.sku) || 0;
      item.cart_item_quantity = netQuantity;

      const { final_price, tax } = item.prices;
      const { cart_item_discount } = item;

      const itemTotal = netQuantity * Number(final_price.value);
      subtotalExcludingTax += itemTotal;
      totalDiscount += Number(cart_item_discount.value) || 0;

      // If no items are there, no tax should be applied
      if (itemTotal > 0) {
        totalTax += netQuantity * Number(tax.value);
      }
    }

    const subtotalIncludingTax = subtotalExcludingTax + totalTax;

    // in case of subtotal being 0, discount will be ignored
    if (subtotalIncludingTax === 0) {
      totalDiscount = 0;
    }

    const grandTotal = subtotalIncludingTax - totalDiscount;

    Object.assign(lineOrder.order_summary, {
      subtotal_excluding_tax: { value: subtotalExcludingTax },
      subtotal_including_tax: { value: subtotalIncludingTax },
      total_discount: { value: totalDiscount },
      applied_taxes: { value: totalTax },
      grand_total: { value: grandTotal },
    });
    await this.rulesSnapshot.update({ id }, { updatedOrder: lineOrder });

    return {
      orderId,
      order: lineOrder as Order,
      wallet: wallet as Wallet,
      rules: rules as Rule[],
      customer: customer as Customer,
      tier: tier as Tier,
      client: client as Client,
      usage: usage as UsageData,
      exchange: exchange as ExchangeRate,
    };
  }

  async buildWithOrder(
    clientId: string,
    userId: string,
    order: Order,
    orderId: string,
  ): Promise<RuleData> {
    return {
      ...(await this.build(clientId, userId)),
      order,
      orderId,
    };
  }

  async findActiveWallet(): Promise<Wallet[]> {
    return await this.wallets.find();
  }

  async findTimePeriod(timePeriod: string): Promise<DateEntity> {
    return await this.dates.findOneBy({
      name: In([timePeriod, timePeriod.toLowerCase()]),
      isActive: true,
    });
  }

  async findActiveCartRules(projectId: number): Promise<Rule[]> {
    return this.rules.find({
      where: {
        project: { id: projectId },
        ruleType: RuleType.Cart,
        isActive: true,
      },
    });
  }
  async findActiveMilestoneRules(): Promise<Rule[]> {
    return this.rules.find({
      where: {
        ruleType: RuleType.Milestone,
        isActive: true,
      },
    });
  }
  async findActiveThroughputRules(): Promise<Milestonethroughput[]> {
    return this.throughputs.find({
      where: {
        isActive: true,
      },
    });
  }

  async getNetInvoices(): Promise<NetInvoiceResponse[]> {
    let query = `
      SELECT i.*
      FROM public.invoices i
      LEFT JOIN public.orders o ON  o."orderNo" = i."purchaseOrderNumber"
      WHERE i."isProcessed" = FALSE
     --AND o."deliveryDate" < CURRENT_DATE - INTERVAL '7 days'
      ORDER BY i.id DESC
    `;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const invoices: any[] = await queryRunner.query(query);
      const unprocessedZA10Orders = new Set(
        invoices.map((inv) => inv.purchaseOrderNumber),
      );

      const relevantInvoices = invoices.filter((inv) =>
        unprocessedZA10Orders.has(inv.purchaseOrderNumber),
      );

      const groupedInvoices: Record<
        string,
        {
          purchaseOrderNumber: string;
          skuCode: string;
          grossInvoiceValue: number;
          netInvoiceValue: number;
          netQuantity: number;
        }
      > = {};

      relevantInvoices.forEach((invoice) => {
        const key = `${invoice.purchaseOrderNumber}_${invoice.skuCode}`;

        if (!groupedInvoices[key]) {
          groupedInvoices[key] = {
            purchaseOrderNumber: invoice.purchaseOrderNumber,
            skuCode: invoice.skuCode,
            grossInvoiceValue: 0,
            netInvoiceValue: 0,
            netQuantity: 0,
          };
        }

        groupedInvoices[key].grossInvoiceValue += invoice.grossSalesValue;
        groupedInvoices[key].netInvoiceValue += invoice.netSalesValue;
        groupedInvoices[key].netQuantity += invoice.quantity;
      });

      const result: NetInvoiceResponse[] = Object.values(
        groupedInvoices,
      ).reduce<NetInvoiceResponse[]>((acc, item) => {
        let purchaseOrder = acc.find(
          (po) => po.purchaseOrderNumber === item.purchaseOrderNumber,
        );

        if (!purchaseOrder) {
          purchaseOrder = {
            purchaseOrderNumber: item.purchaseOrderNumber,
            items: [],
          };
          acc.push(purchaseOrder);
        }

        purchaseOrder.items.push({
          skuCode: item.skuCode,
          grossInvoiceValue: item.grossInvoiceValue.toString(),
          netInvoiceValue: item.netInvoiceValue.toString(),
          netQuantity: item.netQuantity.toString(),
        });

        return acc;
      }, []);

      return result;
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getSalesForRetailer(
    retailerCode: string,
    startDate: Date,
    endDate: Date,
  ) {
    const result = await this.invoices
      .createQueryBuilder('invoice')
      .select('SUM(invoice.netSalesValue)', 'totalOrderValue')
      .where({ orderCreationDate: this.betweenDate(startDate, endDate) })
      .andWhere('invoice.retailerCode = :retailerCode', {
        retailerCode: retailerCode.replace(/^0+/, ''),
      })
      .andWhere('invoice.isProcessed = true')
      .getRawOne();

    return Number.parseFloat(result.totalOrderValue) || 0;
  }

  async getUsageFromInvoice(
    startDate: Date,
    endDate: Date,
    retailerCode: string,
  ): Promise<UsageData> {
    // product category data: count, sales, sales with tax

    const productData = await this.invoices
      .createQueryBuilder('invoice')
      .leftJoin('products', 'product', 'invoice.skuCode = product.sku')
      .select('invoice.skuCode', 'skuCode')
      .addSelect('SUM(invoice.quantity)', 'productCount')
      .addSelect('SUM(invoice.netSalesValue)', 'productSales')
      .addSelect('SUM(invoice.grossSalesValue)', 'productSalesWithTax')
      .addSelect('product.categoryNames', 'categoryNames')
      .where({ orderCreationDate: this.betweenDate(startDate, endDate) })
      .andWhere('invoice.retailerCode = :retailerCode', {
        retailerCode: retailerCode.replace(/^0+/, ''),
      })
      .andWhere('invoice.isProcessed = true')
      .groupBy('invoice.skuCode, product.categoryNames')
      .getRawMany();

    // order data: count, total sales
    const orderData = await this.invoices
      .createQueryBuilder('invoice')
      .select('COUNT(DISTINCT invoice.billingNumber)', 'orderCount')
      .addSelect('SUM(invoice.netSalesValue)', 'totalSales')
      .where({ orderCreationDate: this.betweenDate(startDate, endDate) })
      .andWhere('invoice.retailerCode = :retailerCode', {
        retailerCode: retailerCode.replace(/^0+/, ''),
      })
      .andWhere('invoice.isProcessed = true')
      .getRawOne();

    const productCount: Record<string, number> = Object.fromEntries(
      productData.map((p) => [p.skuCode, numeric(p.productCount)]),
    );

    const productSales: Record<string, number> = Object.fromEntries(
      productData.map((p) => [p.skuCode, numeric(p.productSales)]),
    );

    const productSalesWithTax: Record<string, number> = Object.fromEntries(
      productData.map((p) => [p.skuCode, numeric(p.productSalesWithTax)]),
    );

    const categoryCount: Record<string, number> = {};
    const categorySales: Record<string, number> = {};
    const categorySalesWithTax: Record<string, number> = {};

    for (const entry of productData) {
      const categories = [
        ...new Set(entry.categoryNames || []),
      ] as unknown as string[]; // Handle null or empty
      if (categories.length > 0) {
        for (const category of categories) {
          categoryCount[category] =
            (categoryCount[category] || 0) + Number(entry.productCount);
          categorySales[category] =
            (categorySales[category] || 0) + Number(entry.productSales);
          categorySalesWithTax[category] =
            (categorySalesWithTax[category] || 0) +
            Number(entry.productSalesWithTax);
        }
      } else {
        const defaultCategory = 'Uncategorized';
        categoryCount[defaultCategory] =
          (categoryCount[defaultCategory] || 0) + Number(entry.productCount);
        categorySales[defaultCategory] =
          (categorySales[defaultCategory] || 0) + Number(entry.productSales);
        categorySalesWithTax[defaultCategory] =
          (categorySalesWithTax[defaultCategory] || 0) +
          Number(entry.productSalesWithTax);
      }
    }

    const usageData = {
      products: {
        count: productCount,
        sales: productSales,
        salesWithTax: productSalesWithTax,
        categoryCount,
        categorySales,
        categorySalesWithTax,
      },
      orders: {
        count: numeric(orderData.orderCount),
        sales: numeric(orderData.totalSales ?? 0),
      },
    };

    return usageData;
  }

  async build(
    clientId: string,
    userId: string,
  ): Promise<Omit<RuleData, 'cart'>> {
    const client = await this.clients.findOneBy({ id: clientId });
    if (!client) throw new NotFoundException('Client not found');

    const parsedUserId = Number.parseInt(userId);

    const customer = await this.customers.findOne({
      where: { customerId: parsedUserId },
      relations: ['customerMeta'],
    });

    const wallet = await this.wallets.findOneBy({
      customer: { customerId: parsedUserId },
      project: { id: client.projectId },
    });

    if (!customer) throw new NotFoundException('User not found');
    if (!wallet) throw new NotFoundException('Wallet not found');

    const tier = await this.tiers.findOneBy({
      id: customer.tierId,
      project: { id: client.projectId },
    });
    if (!tier) throw new NotFoundException('Tier not found');

    const usage = await this.getUsageByCustomer(customer.retailerCode);

    return { wallet, customer, tier, client, usage };
  }
  async saveRuleSnapshot(data: RuleData): Promise<RulesSnapshot> {
    return this.rulesSnapshot.save(data);
  }
  async findRuleSnapshotByMgtOrderId(orderId: string): Promise<RulesSnapshot> {
    if (!orderId) {
      throw new Error('Order ID is required to find rule snapshots.');
    }
    return this.rulesSnapshot.findOneBy({ orderId });
  }

  async buildByWallet(wallet: Wallet): Promise<RuleData> {
    const customer = await this.customers.findOneBy({ id: wallet.customerId });

    if (!customer) throw new NotFoundException('User not found');

    const tier = await this.tiers.findOneBy({
      id: customer.tierId,
    });
    if (!tier) throw new NotFoundException('Tier not found');

    return { wallet, customer, tier };
  }

  async buildByThroughput(throughput: Milestonethroughput): Promise<RuleData> {
    const retailerCode = throughput.soldTo;
    const customer = await this.customers.findOneBy({ retailerCode });

    if (!customer) {
      console.log(`Customer with retailerCode ${retailerCode} not found`);
      return; // Simply return undefined if customer is not found
    }

    const wallet = await this.wallets.findOneBy({
      customerId: customer.id,
    });

    // Instead of throwing an error, we'll handle the case where the wallet is not found
    if (!wallet) {
      console.log(
        `No wallet found for customer with ID ${customer.id}. Creating a new wallet.`,
      );
    }

    const start = DateTime.fromJSDate(throughput.startDate)
      .startOf('day')
      .toJSDate();
    const end = DateTime.fromJSDate(throughput.endDate).endOf('day').toJSDate();
    const usage = await this.getUsageFromInvoice(start, end, retailerCode);

    return { wallet, customer, usage };
  }

  async getUsageByCustomer(
    retailerCode: string,
    dateRange?: { start: Date; end: Date },
  ): Promise<UsageData | undefined> {
    const data =
      dateRange?.start && dateRange?.end
        ? { retailerCode, dateRange }
        : { retailerCode };

    const response: UsageData = await this.http.rest({
      method: 'POST',
      url: `${this.hsfUrl}/customer/usage`,
      data,
      headers: { Authorization: `Bearer ${this.hsfToken}` },
      path: 'hsf/customer/usage',
    });

    return response?.products ? response : undefined;
  }
}
