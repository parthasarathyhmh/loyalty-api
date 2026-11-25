import {
  AppliesTo,
  Direction,
  ExchangeRate,
} from '@/common/entities/exchange.entity';
import { TierConfig } from '@/common/entities/tier-config.entity';
import { PointService } from '@/common/services/points.service';
import { TierProcessor } from '@/rules/processors/tier.processor';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Customer } from '../common/entities/customer.entity';
import {
  ConditionOperator,
  Tier,
  TierConditionAttributes,
  TierConditon,
} from '../common/entities/tier.entity';
import { UserEntity } from '../common/interfaces/user';
import { AccountService } from '../common/services/accounts.service';
import HttpService from '../common/services/http.service';
import { Wallet } from '../wallet/entities/wallet.entity';
import { AuthResponse } from './dtos/auth.dto';
import { ProfileResponse } from './dtos/profile.dto';
import { TierResponse } from './dtos/tier-response.dto';
import { Client } from './entities/client.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly http: HttpService,
    @InjectRepository(Client)
    private readonly clients: Repository<Client>,
    @InjectRepository(Wallet)
    private readonly wallets: Repository<Wallet>,
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    @InjectRepository(Tier)
    private readonly tiers: Repository<Tier>,
    @InjectRepository(ExchangeRate)
    private readonly exchangeRates: Repository<ExchangeRate>,
    private readonly acc: AccountService,
    @InjectRepository(TierConfig)
    private readonly tierConfig: Repository<TierConfig>,
    private readonly tierProcessor: TierProcessor,
    private readonly ps: PointService,
    private readonly ds: DataSource,
  ) {}

  private readonly hsfUrl = this.config.get<string>('HSF_API_URL');
  private readonly hsfToken = this.config.get<string>('HSF_TOKEN');
  private readonly loyaltySecret =
    this.config.get<string>('LOYALTY_JWT_SECRET');
  private readonly loyaltyExpiry =
    this.config.get<string>('LOYALTY_JWT_EXPIRY');

  private async createWalletIfMissing({
    customer,
    client,
  }: {
    customer: Customer;
    client: Client;
  }) {
    const userWallet = this.wallets.create({
      customer: { id: customer.id },
      project: { id: client.projectId },
      workspace: { id: client.workspaceId },
      retailerCode: customer.retailerCode,
    });

    await this.wallets.save(userWallet);
  }

  async authenticate(token: string, clientId: string): Promise<AuthResponse> {
    // validate hsf auth token
    const response = await this.http.rest({
      method: 'POST',
      url: `${this.hsfUrl}/auth/validate`,
      data: { token },
      headers: { Authorization: `Bearer ${this.hsfToken}` },
      path: 'hsf/auth/validate',
    });

    if (!response?.valid) throw new UnauthorizedException();

    const hasClient = await this.clients.existsBy({ id: clientId });

    if (!hasClient) throw new UnauthorizedException();

    const tokenData = this.jwt.decode(token);
    const userId = tokenData.id;
    const customer = await this.customers.findOne({
      where: { customerId: Number.parseInt(userId) },
      relations: { customerMeta: true },
    });

    const [wallet, client] = await Promise.all([
      this.wallets.findOneBy({
        customerId: customer.id,
      }),
      this.clients.findOneBy({ id: clientId }),
    ]);

    if (!wallet) {
      console.log('[PROFILE] Wallet missing, creating...');
      await this.createWalletIfMissing({ customer, client });
    }

    const isLoyal = customer?.customerMeta?.isEligibleForLoyalty === true;

    // now that we have clientId and userId, let's generate
    // loyalty jwt for further authorization
    const newToken = await this.jwt.signAsync(
      {
        cId: clientId,
        uId: userId,
        rId: customer.retailerCode,
        sId: crypto.randomUUID(),
      },
      { expiresIn: this.loyaltyExpiry, secret: this.loyaltySecret },
    );
    console.log('Sending API Request:', {
      method: 'POST',
      url: `${this.hsfUrl}/customer/isfeedback`,
      data: { customerId: tokenData.id.toString() },
      headers: { Authorization: `Bearer ${this.hsfToken}` },
      path: 'hsf/customer/isfeedback',
    });
    const npsResponse = await this.http.rest({
      method: 'POST',
      url: `${this.hsfUrl}/customer/isfeedback`,
      data: { customerId: tokenData.id.toString() },
      headers: { Authorization: `Bearer ${this.hsfToken}` },
      path: 'hsf/customer/isfeedback',
    });
    console.log('API Response:', npsResponse);
    return { token: newToken, isLoyal, isFeedback: npsResponse?.isFeedback };
  }

  async profile(user: UserEntity): Promise<ProfileResponse> {
    console.log('[PROFILE] Fetching profile for user:', user.user_id);

    const client = await this.clients.findOneBy({ id: user.client_id });
    if (!client) throw new NotFoundException('Client not found');

    const { customer, wallet, walletIds, active } = await this.acc.getDetails(
      user.user_id,
      client.projectId,
      {
        supressWalletError: true,
      },
    );

    const projectId = client.projectId;

    const [tierConfig, tiers, tier] = await Promise.all([
      this.tierConfig.findOne({
        relations: ['project'],
        where: { project: { id: projectId } },
      }),
      this.tiers.find({
        where: { project: { id: projectId }, isActive: true },
      }),
      this.tiers
        .createQueryBuilder('tier')
        .innerJoin(Customer, 'customer', 'customer.tierId = tier.id')
        .where('customer.id = :customerId', { customerId: customer.id })
        .getOne(),
    ]);

    if (!tierConfig) {
      console.warn('[PROFILE] No tierConfig found, exiting.');
      return;
    }

    if (!tier) throw new NotFoundException('Tier not found');

    if (!wallet) {
      console.log('[PROFILE] Wallet missing, creating...');
      await this.createWalletIfMissing({ customer, client });
    }

    const currentCycleStart = this.tierProcessor.getCycleStartDate(
      tierConfig.cycle,
    );
    console.log('[PROFILE] Current cycle start date:', currentCycleStart);

    const qr = this.ds.createQueryRunner();
    let totalPoints = { earned: 0, spent: 0 };
    try {
      totalPoints = await this.ps.getPointSince(
        qr,
        walletIds,
        currentCycleStart,
      );
    } catch (error) {
      console.error('[PROFILE] Error fetching points:', error.message);
      throw new InternalServerErrorException('Failed to fetch points');
    } finally {
      await qr.release();
    }

    const eligibleTier = this.tierProcessor.getNextTier(tiers, totalPoints);

    const minPoints = this.calculateMinPoints(eligibleTier);

    const tierEarnedPoints = Math.max(0, totalPoints.earned - minPoints);

    const maxPoints = this.calculateMaxPoints(tier);

    console.log(
      '[PROFILE] User Tier:',
      tier.name,
      '| Max Points:',
      maxPoints,
      '| Active Points:',
      active,
    );

    return {
      tier: tier.name,
      maxPoints,
      points: active,
      tierEarnedPoints,
    };
  }
  private calculateMinPoints(eligibleTier: Tier | undefined): number {
    if (!eligibleTier || eligibleTier.conditions.length === 0) return 0;

    if (eligibleTier.conditions.length === 1) {
      const condition = eligibleTier.conditions[0];
      if (
        [
          ConditionOperator.lessthan,
          ConditionOperator.lessthanorequal,
        ].includes(condition.operator)
      ) {
        return 0;
      } else if (
        [
          ConditionOperator.greaterthan,
          ConditionOperator.greaterthanorequal,
        ].includes(condition.operator)
      ) {
        return condition.value;
      }
    }

    const leastOne = eligibleTier.conditions.find((condition) =>
      [
        ConditionOperator.greaterthan,
        ConditionOperator.greaterthanorequal,
      ].includes(condition.operator),
    );

    return leastOne ? leastOne.value : 0;
  }
  private calculateMaxPoints(tier: Tier | undefined): number {
    if (!tier?.conditions?.length) return 0;

    const earnedConditions = tier.conditions.filter(
      (cond) => cond.attribute === TierConditionAttributes.TotalPointsEarned,
    );

    return earnedConditions.length
      ? Math.max(...earnedConditions.map((c) => c.value))
      : 0;
  }

  async getTierInfo(user: UserEntity): Promise<TierResponse> {
    const client = await this.clients.findOneBy({ id: user.client_id });
    if (!client) throw new NotFoundException('client not found');

    const customer = await this.customers.findOne({
      where: { customerId: Number.parseInt(user.user_id) },
      relations: ['project'], // Include the project relation
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const tier = await this.tiers
      .createQueryBuilder('tier')
      .innerJoin(Customer, 'customer', 'customer.tierId = tier.id')
      .where('customer.id = :customerId', { customerId: customer.id })
      .getOne();

    if (!tier) throw new NotFoundException('Tier not found');

    // Retrieve all tiers to get exchange rates and calculate points required for each tier
    const allTiers = await this.tiers.find({
      where: { project: { id: customer.project.id } },
    });

    const tierInfo = await Promise.all(
      allTiers.map(async (t) => {
        const conditions: TierConditon[] = t.conditions;

        // Calculate points required for this tier based on conditions
        let pointsRequired = [];

        if (conditions?.length) {
          const earnedConditions = conditions.filter(
            (cond) =>
              cond.attribute === TierConditionAttributes.TotalPointsEarned,
          );

          if (earnedConditions?.length) {
            // If there is only one condition and its operator is '<=', set pointsRequired to 0
            if (
              earnedConditions.length === 1 &&
              earnedConditions[0].operator === '<='
            ) {
              pointsRequired = [0, earnedConditions[0].value]; // Show 0 and the value in the condition
            } else {
              // Otherwise, collect all the points values into an array
              pointsRequired = earnedConditions.map((cond) => cond.value);
            }
          }
        }

        // Retrieve exchange rate for the specific tier
        const exchangeRate = await this.exchangeRates.findOne({
          where: {
            project: { id: customer.project.id },
            isActive: true,
            appliesTo: AppliesTo.CUSTOMER_TIER,
            direction: Direction.CURRENCY_TO_POINT,
            value: t.name,
          },
        });

        // Calculate exchange points for the tier
        const exchangePoints = exchangeRate ? exchangeRate.point : 0;

        return {
          tierName: t.name,
          pointsRequired,
          exchangeRate: exchangePoints,
          isCurrent: t.id === tier.id,
        };
      }),
    );

    return {
      currentTier: tier.name,
      tierInfo,
    };
  }

  async getTierData(retailerCode: string) {
    const customers = await this.customers.find({
      where: { retailerCode: retailerCode },
      relations: ['project'],
    });

    if (!customers || customers.length === 0) {
      throw new NotFoundException(
        'No customers found for the given retailer code',
      );
    }

    // Fetch all tiers associated with the customers
    const customerData = await Promise.all(
      customers.map(async (customer) => {
        const tier = await this.tiers
          .createQueryBuilder('tier')
          .innerJoin(Customer, 'customer', 'customer.tierId = tier.id')
          .where('customer.id = :customerId', { customerId: customer.id })
          .getOne();

        // Exclude the `conditions` field from the tier response
        const { conditions, ...remainingTierData } = tier || {};

        return {
          loyalCustomerId: customer.id,
          mageCustomerId: customer.customerId,
          projectId: customer.project?.id,
          tierData: remainingTierData,
        };
      }),
    );

    return {
      retailerCode: retailerCode,
      data: customerData,
    };
  }
}
