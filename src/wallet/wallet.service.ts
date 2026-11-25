import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime, Duration } from 'luxon';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { CustomerReward } from '../catalog/entities/customer-reward.entity';
import { PageDto } from '../common/dtos/pagination.dto';
import { UserEntity } from '../common/interfaces/user';
import { pageData } from '../common/listing/pagination';
import { AccountService } from '../common/services/accounts.service';
import { ProjectConfig } from '../common/services/project-config.service';
import { Client } from '../user/entities/client.entity';
import { WalletRewardItem, WalletRewardResponse } from './dtos/reward.dto';
import {
  TransactionFilterDto,
  TransactionItem,
  TransactionRange,
  TransactionStatus,
  TransactionsResponse,
} from './dtos/transaction.dto';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Client)
    private readonly clients: Repository<Client>,
    @InjectRepository(CustomerReward)
    private readonly customerRewards: Repository<CustomerReward>,
    private readonly datasouce: DataSource,
    private readonly projectConfig: ProjectConfig,
    private readonly acc: AccountService,
  ) {}

  private filtersByStatus = {
    [TransactionStatus.All]: ['converted', 'credited', 'pending', 'redeemed'],
    [TransactionStatus.Credited]: ['credited'],
    [TransactionStatus.Pending]: ['pending'],
    [TransactionStatus.Redeemed]: ['redeemed'],
    [TransactionStatus.Converted]: ['converted'],
  };

  private mapRewardItem(item: CustomerReward): WalletRewardItem {
    return {
      id: item.id,
      title: item.reward.name,
      description: item.reward.description,
      icon: item.reward.thirdPartyPlatform.icon,
      expiry: new Date(item.reward.validity),
      price: item.reward.price,
      code: item.coupon.code,
      createdAt: item.createdAt,
      link: item.reward.link,
    };
  }

  private buildDateRange(range: TransactionRange): {
    createdAt?: string;
  } {
    let months: number;
    switch (range) {
      case TransactionRange.Month:
        months = 1;
        break;
      case TransactionRange.Quarter:
        months = 3;
        break;
      case TransactionRange.HalfYear:
        months = 6;
        break;
    }
    return months
      ? {
          createdAt: DateTime.now()
            .minus(Duration.fromObject({ months }))
            .toFormat('yyyy-MM-dd'),
        }
      : {};
  }

  async walletRewards(user: UserEntity): Promise<WalletRewardResponse> {
    const client = await this.clients.findOneBy({ id: user.client_id });
    if (!client) throw new NotFoundException('client not found');

    const managedByCustomer = await this.projectConfig.managedByCustomer(
      client.projectId,
    );

    const whereConditions: FindOptionsWhere<CustomerReward> = managedByCustomer
      ? { wallet: { retailerCode: user.retailer_code } }
      : { customer: { id: Number.parseInt(user.user_id) } };

    const items = await this.customerRewards.find({
      where: whereConditions,
      relations: { reward: { thirdPartyPlatform: true }, coupon: true },
      order: { createdAt: 'DESC' }, // Sort by createdAt in descending order
    });

    return items.reduce(
      (result, item) => {
        if (
          item.reward.validity &&
          new Date(item.reward.validity) < new Date()
        ) {
          result.expired.push(this.mapRewardItem(item));
        } else {
          result.available.push(this.mapRewardItem(item));
        }
        return result;
      },
      { available: [], expired: [] },
    );
  }

  async transactions(
    user: UserEntity,
    filter: TransactionFilterDto,
    query: PageDto,
  ): Promise<TransactionsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 15; // Default limit to 15 if not provided
    const offset = (page - 1) * limit;

    // Fetch client
    const client = await this.clients.findOneBy({ id: user.client_id });
    if (!client) {
      throw new NotFoundException('client not found');
    }

    const walletIds = await this.acc.getWalletIds(client.projectId, user);

    const transactions: TransactionItem[] = [];
    let month: string;

    // Build date range for filtering
    const dateRange = this.buildDateRange(filter.range ?? TransactionRange.All);
    // Construct inner query based on date range and status filter
    const filterStatus = this.filtersByStatus[
      filter.status ?? TransactionStatus.All
    ]
      .map((v) => `'${v}'`)
      .join(',');

    const filterWalletIds = walletIds.join(',');

    const innerQuery = dateRange.createdAt
      ? `
        SELECT 
          txns.*, 
          "customer"."mobile" AS "customerName"
        FROM txns
        LEFT JOIN "customers" AS "customer" 
          ON "customer"."id" = txns."customerId"
        WHERE txns."createdAt" > '${dateRange.createdAt}'
          AND txns.type IN (${filterStatus})
      `
      : `
        SELECT 
          txns.*, 
          "customer"."mobile" AS "customerName"
        FROM txns
        LEFT JOIN "customers" AS "customer" 
          ON "customer"."id" = txns."customerId"
        WHERE txns.type IN (${filterStatus})
      `;

    const outerQuery = `
      WITH txns AS (
        SELECT 
          rt.points, 
          rt."createdAt", 
          NULL AS "reasonCode", 
          'converted' AS type, 
          'coupon' AS source, 
          rt."customerId", 
          rt."projectId", 
          ' ' AS "orderId",
          rcs."code" AS "couponCode",
          tp."name" AS "thirdPartyPlatformName",
          ' ' AS "ruleName"
        FROM "rewardTransactions" AS rt
        LEFT JOIN "customerRewards" AS cr 
          ON cr.id = rt."rewardId"
        LEFT JOIN "rewardsCoupons" AS rcs 
          ON rcs.id = cr."couponId"
        LEFT JOIN "rewardsCatalog" AS rc 
          ON rc.id = cr."rewardId"   
        LEFT JOIN "thirdpartyPlatform" AS tp 
          ON tp.id = rc."thirdPartyPlatformId" 
        WHERE rt."walletId" IN (${filterWalletIds})
        
        UNION ALL
        
        SELECT 
          points, 
          "createdAt", 
          "reasonCode", 
          'credited' AS type, 
          'bonus' AS source, 
          "customerId", 
          "projectId", 
          ' ' AS "orderId",
          ' ' AS "couponCode",
          ' ' AS "thirdPartyPlatformName",
          ' ' AS "ruleName"
        FROM "manualTransactions"
        WHERE type = 'credit' AND "walletId" IN (${filterWalletIds})
        
        UNION ALL
        
        SELECT 
          points, 
          "createdAt", 
          "reasonCode", 
          'redeemed' AS type, 
          'bonus' AS source, 
          "customerId", 
          "projectId", 
          ' ' AS "orderId",
          ' ' AS "couponCode",
          ' ' AS "thirdPartyPlatformName",
          ' ' AS "ruleName"
        FROM "manualTransactions"
        WHERE type = 'debit' AND "walletId" IN (${filterWalletIds})
        
        UNION ALL
        
        SELECT 
          points, 
          "createdAt", 
          NULL AS "reasonCode", 
          'redeemed' AS type, 
          'order' AS source, 
          "customerId", 
          "projectId", 
          COALESCE("magentoOrderId", ' ') AS "orderId",
          ' ' AS "couponCode",
          ' ' AS "thirdPartyPlatformName",
          ' ' AS "ruleName"
        FROM "checkoutTransactions"
        WHERE "walletId" IN (${filterWalletIds})
        
        UNION ALL
        
        SELECT 
          points, 
          "createdAt", 
          NULL AS "reasonCode", 
          'pending' AS type, 
          'order' AS source, 
          "customerId", 
          "projectId", 
          COALESCE("magentoOrderId", ' ') AS "orderId",
          ' ' AS "couponCode",
          ' ' AS "thirdPartyPlatformName",
          ' ' AS "ruleName"
        FROM "cartTransactions"
        WHERE processed = false AND "walletId" IN (${filterWalletIds})
      
        UNION ALL
      
        SELECT 
          points, 
          "createdAt", 
          NULL AS "reasonCode", 
          'credited' AS type, 
          'order' AS source, 
          "customerId", 
          "projectId", 
          COALESCE("magentoOrderId", ' ') AS "orderId",
          ' ' AS "couponCode",
          ' ' AS "thirdPartyPlatformName",
          ' ' AS "ruleName"
        FROM "cartTransactions"
        WHERE processed = true AND "walletId" IN (${filterWalletIds})
      
        UNION ALL
      
        SELECT 
          mt.points, 
          mt."createdAt", 
          NULL AS "reasonCode", 
          'credited' AS type, 
          'milestone' AS source, 
          mt."customerId", 
          mt."projectId", 
          ' ' AS "orderId",
          ' ' AS "couponCode",
          ' ' AS "thirdPartyPlatformName",
          rule."ruleName" AS "ruleName"
        FROM "milestoneTransactions" AS mt
        LEFT JOIN "rules" AS rule 
          ON rule.id = mt."ruleId"
        WHERE "walletId" IN (${filterWalletIds})

        UNION ALL

          SELECT 
          tt.points, 
          tt."createdAt", 
          NULL AS "reasonCode", 
          'credited' AS type, 
          'throughput' AS source, 
          tt."customerId", 
          tt."projectId", 
          ' ' AS "orderId",
          ' ' AS "couponCode",
          ' ' AS "thirdPartyPlatformName",
          rule."name" AS "ruleName"
        FROM "throughputTransactions" AS tt
        LEFT JOIN "milestoneThroughput" AS rule 
          ON rule.id = tt."throughputId"
        WHERE "walletId" IN (${filterWalletIds})
      )
      ${innerQuery}
    `;

    console.log(outerQuery, 'outerQuery');
    // Execute query and process results
    const txns = await this.datasouce
      .query(`${outerQuery}     ORDER BY "createdAt" DESC
    LIMIT ${limit} OFFSET ${offset}`);

    for (const txn of txns) {
      const currentMonth = DateTime.fromJSDate(txn.createdAt).monthLong;
      const isFirst = !month;
      if (isFirst) {
        month = currentMonth;
      }

      transactions.push({
        date: txn.createdAt,
        isHeader: isFirst || month !== currentMonth,
        month: currentMonth,
        points: txn.points,
        type: txn.type,
        source: txn.source,
        orderId: txn.orderId,
        customerName: txn.customerName,
        couponCode: txn.couponCode,
        thirdPartyPlatformName: txn.thirdPartyPlatformName,
        ruleName: txn.ruleName,
      });
    }
    const countQuery = `
    SELECT COUNT(*) 
    FROM (
     ${outerQuery}
    ) AS filtered_txns
  `;

    const totalCountResult = await this.datasouce.query(countQuery);
    const count = Number.parseInt(totalCountResult[0]?.count || '0', 10);
    // Return paginated results
    return {
      items: transactions,
      pages: pageData(page, count, limit),
    };
  }
}
