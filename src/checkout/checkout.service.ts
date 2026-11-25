import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { Customer } from '../common/entities/customer.entity';
import {
  AppliesTo,
  Direction,
  ExchangeRate,
} from '../common/entities/exchange.entity';
import { Tier } from '../common/entities/tier.entity';
import { numeric } from '../common/functions/numeric';
import { UserEntity } from '../common/interfaces/user';
import { AccountService } from '../common/services/accounts.service';
import { PointService } from '../common/services/points.service';
import { Client } from '../user/entities/client.entity';
import {
  PointTransaction,
  TransactionSource,
  TransactionType,
} from '../wallet/entities/point-transaction.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { ConvertOrder } from './dtos/convert-order.dto';
import {
  ExchangeResponse,
  RedeemExchange,
  RedeemExchangeResponse,
  RevertExchange,
} from './dtos/exchange.dto';
import { CheckoutTransaction } from './entities/checkout-transaction.entity';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(Client)
    private readonly clients: Repository<Client>,
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    @InjectRepository(ExchangeRate)
    private readonly exchanges: Repository<ExchangeRate>,
    @InjectRepository(Wallet)
    private readonly wallets: Repository<Wallet>,
    @InjectRepository(Tier)
    private readonly tiers: Repository<Tier>,
    @InjectRepository(CheckoutTransaction)
    private readonly checkoutTransactions: Repository<CheckoutTransaction>,
    @InjectRepository(PointTransaction)
    private readonly pointTransactions: Repository<PointTransaction>,
    private readonly ds: DataSource,
    private readonly ps: PointService,
    private readonly acc: AccountService,
  ) {}

  private EXCHANGE_RATES = [10, 25, 35];

  // convert currency to points for buring rate
  // points = (currency * rate.points) / rate.currency
  // for a rate of 3c/10p -> 10c = 10c * 10p / 3c points
  private exchange(currency: number, exchange: ExchangeRate): number {
    return (
      Math.round((exchange.point * currency * 1000) / exchange.currency) / 1000
    );
  }

  private async getCurrentExchangeRate(
    client: Client,
    wallet: Wallet,
    customer: Customer,
  ): Promise<ExchangeRate> {
    const exchanges = await this.exchanges.findBy({
      project: { id: client.projectId },
      direction: Direction.CURRENCY_TO_POINT,
      isActive: true,
    });

    if (!exchanges?.length) {
      throw new NotFoundException('exchange rate is not set up or inactive');
    }

    const exchangeSet = new Set(exchanges.map((ex) => ex.appliesTo));
    const hasAll = exchangeSet.size === 2 && !exchangeSet.has(AppliesTo.ALL);

    if (hasAll || exchangeSet.size > 1) {
      throw new InternalServerErrorException('exchange rates are inconsistent');
    }
    let currentExchange: ExchangeRate;

    if (exchangeSet.has(AppliesTo.CUSTOMER_TIER)) {
      const tier = await this.tiers.findOneBy({
        id: customer.tierId,
        project: { id: wallet.projectId },
      });
      currentExchange = exchanges.find((ex) => ex.value === tier.name);
    } else if (exchangeSet.has(AppliesTo.CUSTOMER_GROUP)) {
      currentExchange = exchanges.find((ex) => ex.value === customer.group);
    } else if (exchangeSet.has(AppliesTo.CUSTOMER_SEGMENT)) {
      currentExchange = exchanges.find((ex) =>
        customer.segments.includes(ex.value),
      );
    } else if (exchangeSet.has(AppliesTo.ALL)) {
      currentExchange = exchanges.find((ex) => ex.appliesTo === AppliesTo.ALL);
    }

    if (!currentExchange)
      throw new NotFoundException('exchange rate not found');

    return currentExchange;
  }

  async listExchanges(user: UserEntity): Promise<ExchangeResponse> {
    const [client, customer] = await Promise.all([
      this.clients.findOneBy({ id: user.client_id }),
      this.customers.findOneBy({
        customerId: Number.parseInt(user.user_id),
      }),
    ]);

    if (!client) throw new NotFoundException('client not found');
    if (!customer) throw new NotFoundException('user not found');

    const wallet = await this.wallets.findOneBy({
      customerId: customer.id,
    });

    if (!wallet) throw new NotFoundException('wallet not found');

    const currentExchange = await this.getCurrentExchangeRate(
      client,
      wallet,
      customer,
    );

    const maxPoints = numeric(wallet.active);

    return {
      pointsBalance: maxPoints,
      options: this.EXCHANGE_RATES.map((rate) => ({
        enabled: maxPoints >= this.exchange(rate, currentExchange),
        points: this.exchange(rate, currentExchange),
        discount: rate,
      })),
    };
  }

  async revertExchange(revertExchange: RevertExchange) {
    console.log('[REVERT_EXCHANGE] Start revertExchange', revertExchange);

    const client = await this.clients.findOneBy({
      id: revertExchange.clientId,
    });
    console.log('[REVERT_EXCHANGE] Client found:', client);
    if (!client) throw new NotFoundException('client not found');

    const { wallet, walletIds } = await this.acc.getDetails(
      revertExchange.userId,
      client.projectId,
    );
    console.log('[REVERT_EXCHANGE] Wallet details:', wallet, walletIds);

    // find last point transaction for order
    const txn = await this.checkoutTransactions.findOneBy({
      wallet: { id: wallet.id },
      cartId: revertExchange.cartId,
    });
    console.log('[REVERT_EXCHANGE] Found transaction:', txn);

    const qr = this.ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    console.log('[REVERT_EXCHANGE] Transaction started');

    try {
      const blockedPoints = numeric(txn.points);
      console.log('[REVERT_EXCHANGE] Blocked points:', blockedPoints);

      const requiredPoints = await this.ps.calculateRequired(
        qr,
        walletIds,
        blockedPoints,
        true,
      );
      console.log('[REVERT_EXCHANGE] Required points:', requiredPoints);

      const unblockTransaction: PointTransaction =
        this.pointTransactions.create({
          transactionId: txn.id,
          wallet: { id: wallet.id },
          points: numeric(txn.points),
          transactionType: TransactionType.Credit,
          transactionSource: TransactionSource.Reversal,
        });

      console.log(
        '[REVERT_EXCHANGE] Created unblock transaction:',
        unblockTransaction,
      );
      await qr.manager.save(PointTransaction, unblockTransaction);

      await this.ps.unblock(qr, requiredPoints, unblockTransaction);
      console.log('[REVERT_EXCHANGE] Unblocked points');

      await qr.commitTransaction();
      console.log('[REVERT_EXCHANGE] Transaction committed');
    } catch (e) {
      await qr.rollbackTransaction();
      console.error(
        '[REVERT_EXCHANGE] Transaction rolled back due to error:',
        e,
      );
      throw e;
    } finally {
      await qr.release();
      console.log('[REVERT_EXCHANGE] QueryRunner released');
    }
  }

  async redeemExchange(
    exchange: RedeemExchange,
  ): Promise<RedeemExchangeResponse> {
    console.log('[REDEEM_EXCHANGE] Start redeemExchange', exchange);

    const client = await this.clients.findOneBy({ id: exchange.clientId });
    if (!client) throw new NotFoundException('client not found');

    console.log('[REDEEM_EXCHANGE] Client found:', client);

    const { customer, wallet, walletIds, active, blocked } =
      await this.acc.getDetails(exchange.userId, client.projectId);
    const maxWalletBalance = active + blocked;

    console.log('[REDEEM_EXCHANGE] Wallet details:', {
      customer,
      wallet,
      maxWalletBalance,
    });

    const currentExchange = await this.getCurrentExchangeRate(
      client,
      wallet,
      customer,
    );
    console.log('[REDEEM_EXCHANGE] Current exchange rate:', currentExchange);

    const qr = this.ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      if (exchange.points > maxWalletBalance)
        throw new BadRequestException('not enough active points in wallet');

      console.log('[REDEEM_EXCHANGE] Points validation passed');

      const rate = exchange.discount;

      if (!this.EXCHANGE_RATES.includes(rate))
        throw new BadRequestException('invalid discount');

      console.log('[REDEEM_EXCHANGE] Discount validation passed');

      const exchangePoints = this.exchange(rate, currentExchange);

      if (exchangePoints !== exchange.points)
        throw new BadRequestException('invalid exchange');

      console.log(
        '[REDEEM_EXCHANGE] Exchange calculation passed',
        exchangePoints,
      );

      let transaction: CheckoutTransaction =
        await this.checkoutTransactions.findOneBy({
          cartId: exchange.cartId,
          customer: { id: customer.id },
          wallet: { id: wallet.id },
          pending: true,
        });

      console.log(
        '[REDEEM_EXCHANGE] Existing checkout transaction:',
        transaction,
      );

      // if (transaction) {
      //   console.log('[REDEEM_EXCHANGE] Updating existing transaction');
      //   const requiredPoints = await this.ps.calculateRequired(
      //     qr,
      //     walletIds,
      //     numeric(transaction.points),
      //     true,
      //   );

      //   console.log(
      //     '[REDEEM_EXCHANGE] Required points for reversal:',
      //     requiredPoints,
      //   );

      //   const unblockTransaction: PointTransaction =
      //     this.pointTransactions.create({
      //       transactionId: transaction.id,
      //       wallet: { id: wallet.id },
      //       points: numeric(transaction.points),
      //       transactionType: TransactionType.Credit,
      //       transactionSource: TransactionSource.Reversal,
      //     });

      //   await qr.manager.save(PointTransaction, unblockTransaction);

      //   await this.ps.unblock(qr, requiredPoints, unblockTransaction);
      //   transaction.points = exchange.points;
      // } else {
      if (!transaction) {
        console.log('[REDEEM_EXCHANGE] Creating new transaction');
        transaction = qr.manager.create(CheckoutTransaction, {
          customer: { id: customer.id },
          project: { id: client.projectId },
          wallet: { id: wallet.id },
          points: exchange.points,
          discount: exchange.discount,
          cartId: exchange.cartId,
          pending: true,
        });
      }

      await qr.manager.save(transaction);
      console.log('[REDEEM_EXCHANGE] Transaction saved:', transaction);

      const requiredPoints = await this.ps.calculateRequired(
        qr,
        walletIds,
        exchange.points,
      );
      console.log(
        '[REDEEM_EXCHANGE] Required points for blocking:',
        requiredPoints,
      );

      const pointTransaction: PointTransaction = this.pointTransactions.create({
        transactionId: transaction.id,
        points: exchange.points,
        wallet: { id: wallet.id },
        transactionType: TransactionType.Debit,
        transactionSource: TransactionSource.Order,
      });

      await qr.manager.save(PointTransaction, pointTransaction);
      console.log(
        '[REDEEM_EXCHANGE] Point transaction saved:',
        pointTransaction,
      );

      await this.ps.block(qr, requiredPoints, pointTransaction);
      console.log('[REDEEM_EXCHANGE] Points blocked successfully');

      await qr.commitTransaction();
    } catch (e) {
      console.error('[REDEEM_EXCHANGE] Error:', e);
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }

    const updatedWallet = await this.wallets.findOneBy({ id: wallet.id });
    console.log(
      '[REDEEM_EXCHANGE] Updated wallet balance:',
      updatedWallet.active,
    );

    return {
      pointsBalance: numeric(updatedWallet.active),
      discount: exchange.discount,
      points: exchange.points,
    };
  }

  async convertToOrder(update: ConvertOrder) {
    const client = await this.clients.findOneBy({ id: update.clientId });

    if (client) {
      const query: FindOptionsWhere<CheckoutTransaction> = {
        project: { id: client.projectId },
        pending: true,
      };

      if (update.cartId) {
        query.cartId = update.cartId;
      } else if (update.magentoOrderId) {
        query.hsfOrderId = update.orderId;
      } else {
        throw new BadRequestException(
          'Either cartId or magentoOrderId is required',
        );
      }

      const transaction = await this.checkoutTransactions.findOneBy(query);

      if (transaction) {
        if (update.magentoOrderId) {
          transaction.magentoOrderId = update.magentoOrderId;
        } else {
          transaction.hsfOrderId = update.orderId;
        }
        await this.checkoutTransactions.save(transaction);
      }
    }
  }
}
