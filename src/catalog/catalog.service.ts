import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { PageDto } from '../common/dtos/pagination.dto';
import { RewardCatalogueEntity } from '../common/entities/catalog.entity';
import { RewardsCategory } from '../common/entities/category.entity';
import { Coupon } from '../common/entities/coupon.entity';
import { Customer } from '../common/entities/customer.entity';
import { UserEntity } from '../common/interfaces/user';
import { pageData } from '../common/listing/pagination';
import { AccountService } from '../common/services/accounts.service';
import { PointService } from '../common/services/points.service';
import { Client } from '../user/entities/client.entity';
import {
  PointTransaction,
  TransactionSource,
  TransactionType,
} from '../wallet/entities/point-transaction.entity';
import { CategoryResponse } from './dtos/category.dto';
import { RedeemResponse } from './dtos/redeem.dto';
import { RewardItem, SummaryResponse } from './dtos/summary.dto';
import { CustomerReward } from './entities/customer-reward.entity';
import { RewardTransaction } from './entities/reward-transaction.entity';
import { numeric } from '@/common/functions/numeric';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Client)
    private readonly clients: Repository<Client>,
    @InjectRepository(RewardCatalogueEntity)
    private readonly rewards: Repository<RewardCatalogueEntity>,
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    @InjectRepository(RewardsCategory)
    private readonly categories: Repository<RewardsCategory>,
    @InjectRepository(CustomerReward)
    private readonly customerRewards: Repository<CustomerReward>,
    @InjectRepository(RewardTransaction)
    private readonly rewardTransactions: Repository<RewardTransaction>,
    @InjectRepository(Coupon)
    private readonly coupons: Repository<Coupon>,
    @InjectRepository(PointTransaction)
    private readonly pointTransactions: Repository<PointTransaction>,
    private readonly datasource: DataSource,
    private readonly ps: PointService,
    private readonly acc: AccountService,
  ) {}

  private mapRewardItem(
    item: RewardCatalogueEntity,
    available: boolean,
  ): RewardItem {
    return {
      id: item.id,
      title: item.name,
      description: item.description,
      icon: item.thirdPartyPlatform.icon,
      points: item.pointsValue,
      expiry: new Date(item.validity),
      price: item.price,
      available: available,
      terms: item.tnC,
      link: item.link,
    };
  }

  async summary(user: UserEntity): Promise<SummaryResponse> {
    const client = await this.clients.findOneBy({ id: user.client_id });
    if (!client) throw new NotFoundException('Client not found');

    const customer = await this.customers.findOneBy({
      customerId: Number.parseInt(user.user_id),
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const rewards = await this.rewards.find({
      relations: { thirdPartyPlatform: true, category: true },
      where: {
        tiers: { id: customer.tierId },
        category: { isActive: true },
        isActive: true,
      },
    });

    if (!rewards.length) throw new NotFoundException('No rewards found');

    const coupons = await this.coupons.find({
      where: {
        isRedeemed: false,
        isActive: true,
        rewards: { id: In(rewards.map((reward) => reward.id)) },
      },
      relations: { rewards: true },
    });

    const hasCoupons = coupons.reduce<Record<number, boolean>>(
      (acc, coupon) => {
        if (coupon.rewards.id) acc[coupon.rewards.id] = true;
        return acc;
      },
      {},
    );
    const groupedRewards: SummaryResponse = Object.values(
      await rewards.reduce(
        async (categoriesPromise, reward) => {
          const categories = await categoriesPromise;

          const categoryId = reward.category.id;
          if (!categories[categoryId]) {
            categories[categoryId] = {
              id: categoryId,
              name: reward.category.name,
              icons: reward.category.icon,
              items: [],
              totalCount: 0,
            };
          }

          const couponByRewardQuery = `
            SELECT DISTINCT
              ON (rc."rewardsId") rc.id,
              rc.code,
              rc."rewardsId"
            FROM
              "rewardsCoupons" rc
            WHERE
              rc."isRedeemed" = FALSE
              AND rc."isActive" = TRUE
            ORDER BY
              rc."rewardsId",
              rc.id
          `;

          const countQuery = `
            SELECT count(*)
            FROM
              "rewardsCatalog" r
              LEFT JOIN "thirdpartyPlatform" t on r."thirdPartyPlatformId" = t.id
              LEFT JOIN "rewardsTiers" rt on r.id = rt."rewardsId"
              LEFT JOIN (
                ${couponByRewardQuery}
              ) c ON r.id = c."rewardsId"
            WHERE
              rt."tierId" = ${customer.tierId}
              AND r."categoryId" = ${categoryId}
              AND c.id IS NOT NULL
          `;

          const [{ count }] = await this.datasource.query(countQuery);
          console.log(count, 'count');

          if (hasCoupons[reward.id]) {
            categories[categoryId].items.push(
              this.mapRewardItem(reward, !!hasCoupons[reward.id]),
            );
            categories[categoryId].totalCount = numeric(count);
          }

          return categories;
        },
        Promise.resolve(
          {} as Record<
            number,
            {
              id: number;
              name: string;
              icons: string;
              items: any[];
              totalCount: number;
            }
          >,
        ),
      ),
    );

    const sortedCategories = groupedRewards.map((category) => ({
      ...category,
      items: category.items.sort((a, b) => {
        if (a.available !== b.available)
          return Number(b.available) - Number(a.available);
        return a.points - b.points;
      }),
    }));

    return sortedCategories;
  }

  async byCategory(
    user: UserEntity,
    query: PageDto,
    id: number,
  ): Promise<CategoryResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const client = await this.clients.findOneBy({ id: user.client_id });

    if (!client) throw new NotFoundException('client not found');

    const [customer, category] = await Promise.all([
      this.customers.findOneBy({
        customerId: Number.parseInt(user.user_id),
      }),
      this.categories.findOneBy({ id: id }),
    ]);

    if (!customer) throw new NotFoundException('customer not found');
    if (!category) throw new NotFoundException('category not found');

    if (!category.isActive)
      throw new BadRequestException('category is not active');

    const couponByRewardQuery = `
    SELECT DISTINCT
      ON (rc."rewardsId") rc.id,
      rc.code,
      rc."rewardsId"
    FROM
      "rewardsCoupons" rc
    WHERE
      rc."isRedeemed" = FALSE
      AND rc."isActive" = TRUE
    ORDER BY
      rc."rewardsId",
      rc.id
`;

    const countQuery = `
SELECT count(*)
FROM
  "rewardsCatalog" r
  LEFT JOIN "thirdpartyPlatform" t on r."thirdPartyPlatformId" = t.id
  LEFT JOIN "rewardsTiers" rt on r.id = rt."rewardsId"
  LEFT JOIN (
    ${couponByRewardQuery}
  ) c ON r.id = c."rewardsId"
WHERE
  rt."tierId" = ${customer.tierId}
  AND r."categoryId" = ${id}
  AND c.id IS NOT NULL
`;

    const items = await this.datasource.query(`
SELECT
  r.id AS reward_id,
  r."pointsValue" AS points,
  c.id AS coupon_id,
  c.code AS coupon_code,
  rt."tierId" as tier_id,
  t.icon as icon,
  r.name,
  r.description,
  r.validity,
  r."tnC" as terms,
  r.link,
  r.price,
  CASE
    WHEN c.id IS NULL THEN false
    ELSE true
  END as available
FROM
  "rewardsCatalog" r
  LEFT JOIN "thirdpartyPlatform" t on r."thirdPartyPlatformId" = t.id
  LEFT JOIN "rewardsTiers" rt on r.id = rt."rewardsId"
  LEFT JOIN (
    ${couponByRewardQuery}
  ) c ON r.id = c."rewardsId"
WHERE
  rt."tierId" = ${customer.tierId}
  AND r."categoryId" = ${id}
  AND c.id IS NOT NULL
ORDER BY
  available DESC,
  r."pointsValue" ASC LIMIT ${limit} OFFSET ${offset};
`);

    const [{ count }] = await this.datasource.query(countQuery);

    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
      items: items.map(
        (item): RewardItem => ({
          id: item.reward_id,
          available: item.available,
          icon: item.icon,
          points: item.points,
          title: item.name,
          description: item.description,
          terms: item.terms,
          link: item.link,
          expiry: item.validity,
          price: item.price,
        }),
      ),
      pages: pageData(page, Number.parseInt(count), limit),
    };
  }

  async redeem(user: UserEntity, itemId: number): Promise<RedeemResponse> {
    const client = await this.clients.findOneBy({ id: user.client_id });
    if (!client) throw new NotFoundException('client not found');

    const { active, wallet, customer, walletIds } = await this.acc.getDetails(
      user.user_id,
      client.projectId,
    );

    if (!wallet) throw new NotFoundException('wallet not found');

    const reward = await this.rewards.findOne({
      where: {
        id: itemId,
        tiers: { id: customer.tierId },
        isActive: true,
      },
      relations: { thirdPartyPlatform: true },
    });

    if (!reward)
      throw new NotFoundException('reward not found for this customer');

    if (active >= reward.pointsValue) {
      const qr = this.datasource.createQueryRunner();
      await qr.connect();
      await qr.startTransaction();

      try {
        // 1. get the first available coupon
        const coupon = await qr.manager
          .getRepository(Coupon)
          .createQueryBuilder('coupon')
          .setLock('pessimistic_write')
          .where('coupon.rewardsId = :itemId AND coupon.isRedeemed = false', {
            itemId,
          })
          .getOne();
        if (!coupon)
          throw new BadRequestException('reward is no longer available');

        // 2. calculate points required for the transaction
        const requiredPoints = await this.ps.calculateRequired(
          qr,
          walletIds,
          reward.pointsValue,
        );

        // 3. create a customer specific reward
        const customerReward = this.customerRewards.create({
          customer: { id: customer.id },
          project: { id: client.projectId },
          wallet: { id: wallet.id },
          reward: { id: reward.id },
          coupon: { id: coupon.id },
        });

        await qr.manager.save(CustomerReward, customerReward);

        // 4. record a reward transaction
        const rewardTransaction = this.rewardTransactions.create({
          customer: { id: customer.id },
          project: { id: client.projectId },
          wallet: { id: wallet.id },
          reward: { id: customerReward.id },
          points: reward.pointsValue,
        });

        await qr.manager.save(RewardTransaction, rewardTransaction);

        // 5. record a point transaction for current transaction
        const pointTransaction: PointTransaction =
          this.pointTransactions.create({
            transactionId: rewardTransaction.id,
            wallet: { id: wallet.id },
            points: reward.pointsValue,
            transactionType: TransactionType.Debit,
            transactionSource: TransactionSource.Coupon,
          });

        await qr.manager.save(PointTransaction, pointTransaction);

        // 6. consume points from wallet
        await this.ps.consume(qr, requiredPoints, pointTransaction);

        // 7. update coupon to mark as used by current customer
        await qr.manager.update(
          Coupon,
          { id: coupon.id },
          {
            customerId: customer.id.toString(),
            retailerCode: customer.retailerCode,
            isRedeemed: true,
            redeemedAt: new Date(),
          },
        );

        await qr.commitTransaction();

        return {
          id: customerReward.id,
          icon: reward.thirdPartyPlatform.icon,
          title: reward.name,
          description: reward.description,
          code: coupon.code,
          price: reward.price,
          expiry: new Date(reward.validity),
        };
      } catch (e) {
        await qr.rollbackTransaction();
        throw e;
      } finally {
        await qr.release();
      }
    }
    throw new BadRequestException('not enough balance to redeem');
  }
}
