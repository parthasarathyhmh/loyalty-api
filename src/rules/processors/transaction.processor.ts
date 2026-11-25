import { CheckoutTransaction } from '@/checkout/entities/checkout-transaction.entity';
import { Invoice } from '@/common/entities/invoice.entity';
import { PointService } from '@/common/services/points.service';
import { MessageQueue, QueueService } from '@/queue/queue.service';
import { MilestoneTransaction } from '@/rules/entities/milestone-transactions.entity';
import {
  PointTransaction,
  TransactionSource,
  TransactionType,
} from '@/wallet/entities/point-transaction.entity';
import { Point } from '@/wallet/entities/point.entity';
import { Wallet } from '@/wallet/entities/wallet.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TransactionPayload } from '../dtos/transaction.dto';
import { CartTransaction } from '../entities/cart-transactions.entity';
import { ThroughputTransaction } from '../entities/throughput-transactions.entity';
import { RuleData } from './data.processor';
import { numeric } from '@/common/functions/numeric';

@Injectable()
export class TransactionProcessor {
  private readonly queueName = process.env.QUEUE_NAME || 'message-queue';
  constructor(
    @InjectRepository(MilestoneTransaction)
    private readonly milestoneTransactions: Repository<MilestoneTransaction>,
    @InjectRepository(ThroughputTransaction)
    private readonly throughputTransactions: Repository<ThroughputTransaction>,
    @InjectRepository(CartTransaction)
    private readonly cartTransactions: Repository<CartTransaction>,
    @InjectRepository(Point)
    private readonly points: Repository<Point>,
    @InjectRepository(PointTransaction)
    private readonly pointTransactions: Repository<PointTransaction>,
    @InjectRepository(Wallet)
    private readonly wallets: Repository<Wallet>,
    @InjectRepository(CheckoutTransaction)
    private readonly checkOutTransactions: Repository<CheckoutTransaction>,

    @InjectRepository(Invoice)
    private readonly invoices: Repository<Invoice>,
    private readonly ps: PointService,
    private readonly datasource: DataSource,
    private readonly queueService: QueueService,
  ) {}

  async performTransaction(
    body: TransactionPayload,
    transactionName:
      | TransactionSource.Milestone
      | TransactionSource.Cart
      | TransactionSource.Throughput,
  ): Promise<{ success: boolean }> {
    const orders = body?.order;
    const orderId = body?.orderId;

    const qr = this.datasource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const customer = body.customer;
      let wallet = await qr.manager.findOne(Wallet, {
        where: { customerId: customer.id },
      });

      const transactionType = body.type;
      const commentValue = body.comment;

      // create wallet if it does not already exist
      if (!wallet) {
        wallet = await qr.manager.save(
          Wallet,
          this.wallets.create({
            retailerCode: customer.retailerCode,
            project: { id: body.projectId },
            workspace: { id: body.workspaceId },
            customer: { id: customer.id },
          }),
        );
      }

      // create a common transaction
      const transactionPayload: Record<string, any> = {
        project: { id: body.projectId },
        customer: { id: customer.id },
        wallet: { id: wallet.id },
        points: body.points,
        type: transactionType,
        ...((orderId || orders?._id) && {
          magentoOrderId: orderId,
          hsfOrderId: orders?._id,
        }),
      };

      let transaction:
        | MilestoneTransaction
        | CartTransaction
        | ThroughputTransaction;
      if (transactionName === TransactionSource.Cart) {
        transaction = this.cartTransactions.create(transactionPayload);
      } else if (transactionName === TransactionSource.Milestone) {
        transactionPayload.processed = true;
        transactionPayload.ruleId = body.ruleId;
        transaction = this.milestoneTransactions.create(transactionPayload);
      } else if (transactionName === TransactionSource.Throughput) {
        transactionPayload.processed = true;
        transactionPayload.throughputId = body.ruleId;
        transaction = this.throughputTransactions.create(transactionPayload);
      }

      // create points to credit
      const point = this.points.create({
        wallet: { id: wallet.id },
        earned: body.points,
        pending: body.points,
      });

      // set expiry if available
      if (body.expiry) {
        point.expiry = body.expiry;
      }

      await qr.manager.save(point);
      await qr.manager.save(transaction);

      const pointTransaction = this.pointTransactions.create({
        transactionId: transaction.id,
        points: transaction.points,
        point: { id: point.id },
        wallet,
        transactionType: TransactionType.Credit,
        transactionSource:
          transactionName === TransactionSource.Milestone
            ? TransactionSource.Milestone
            : transactionName === TransactionSource.Cart
              ? TransactionSource.Cart
              : TransactionSource.Throughput,
        comment: commentValue,
      });

      await qr.manager.save(pointTransaction);

      await qr.commitTransaction();
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
    return { success: true };
  }

  buildTransactionItem(
    { customer, wallet, order, orderId }: RuleData,
    creditPoints: number,
    transactionName:
      | TransactionSource.Cart
      | TransactionSource.Milestone
      | TransactionSource.Throughput,
    ruleId?: number,
  ): TransactionPayload {
    const payload: TransactionPayload = {
      workspaceId: Number(wallet.workspaceId),
      projectId: Number(wallet.projectId),
      points: Number.parseInt(creditPoints.toString(), 10),
      type: TransactionType.Credit,
      comment: `Transaction generated based on ${transactionName}`,
      customer,
    };

    if (ruleId) {
      payload.ruleId = ruleId;
    }

    if (order && orderId) {
      payload.orderId = orderId;
      payload.order = order;
    }

    return payload;
  }

  async isMilestoneProcessed(ruleId: number): Promise<boolean> {
    return this.milestoneTransactions.existsBy({
      ruleId: ruleId,
      processed: true,
      type: TransactionType.Credit,
    });
  }

  async isThroughputProcessed(throughputId: number): Promise<boolean> {
    return this.throughputTransactions.existsBy({
      throughputId,
      processed: true,
      type: TransactionType.Credit,
    });
  }

  async getCartById(magentoOrderId: string): Promise<CartTransaction> {
    return this.cartTransactions.findOne({
      where: { magentoOrderId },
      relations: ['customer'],
    });
  }

  async updateCartPoints(
    transactionId: number,
    points: number,
  ): Promise<PointTransaction> {
    const filter = {
      transactionId,
      transactionSource: TransactionSource.Cart,
    };

    await this.pointTransactions.update(filter, { points });

    const updatedTransaction = await this.pointTransactions.findOne({
      where: filter,
      relations: ['point', 'wallet'],
    });

    return updatedTransaction;
  }
  async updateWalletPoints(id: number, points: number): Promise<void> {
    this.points.update(
      { id },
      {
        active: Number(points),
        earned: Number(points),
        pending: 0,
      },
    );
  }

  async updateCartStatus(
    magentoOrderId: string,
    points: number,
  ): Promise<void> {
    this.cartTransactions.update(
      { magentoOrderId },
      {
        points,
        processed: true,
      },
    );
    this.checkOutTransactions.update(
      { magentoOrderId },

      { pending: false },
    );
  }
  async markInvoiceAsProcessed(purchaseOrderNumber: string): Promise<void> {
    this.invoices.update(
      { purchaseOrderNumber },
      {
        isProcessed: true,
      },
    );
  }
  async performInvoiceTransaction({
    points,
    orderId,
    phone,
    walletIds,
    wallet,
  }: {
    points: number;
    orderId: string;
    phone: string;
    walletIds: number[];
    wallet: Wallet;
  }): Promise<{ success: boolean }> {
    const qr = this.datasource.createQueryRunner();
    console.log('Starting performInvoiceTransaction with inputs:', {
      points,
      orderId,
    }); // Initial log
    await qr.connect();
    await qr.startTransaction();

    try {
      const cart = await this.getCartById(orderId);
      const updatedPoints = await this.updateCartPoints(cart.id, points);

      console.log('Cart and points updated:', {
        cartId: cart.id,
        updatedPoints,
      });

      await this.updateWalletPoints(updatedPoints.point.id, points);
      await this.updateCartStatus(orderId, points);

      const requiredPoints = await this.ps.calculateRequired(
        qr,
        walletIds,
        points,
        true,
      );
      if (points > 0) {
        await this.ps.consumeBlocked(qr, requiredPoints, updatedPoints);
      } else {
        const { points: blockedPoints, id } =
          await this.checkOutTransactions.findOne({
            where: { magentoOrderId: orderId },
          });

        const rp = await this.ps.calculateRequired(
          qr,
          walletIds,
          blockedPoints,
          true,
        );
        console.log(
          '[INVOICE_REVERT_EXCHANGE] Required points:',
          requiredPoints,
        );

        const unblockTransaction: PointTransaction =
          this.pointTransactions.create({
            transactionId: id,
            wallet: { id: wallet.id },
            points: numeric(blockedPoints),
            transactionType: TransactionType.Credit,
            transactionSource: TransactionSource.Reversal,
          });

        console.log(
          '[INVOICE_REVERT_EXCHANGE] Created unblock transaction:',
          unblockTransaction,
        );
        await qr.manager.save(PointTransaction, unblockTransaction);
        await this.checkOutTransactions.update(
          { magentoOrderId: orderId },
          { pending: false, points },
        );
        await this.ps.unblock(qr, rp, updatedPoints);
        await this.ps.unblock(qr, requiredPoints, updatedPoints);
      }

      await this.markInvoiceAsProcessed(orderId);
      console.log('Invoice processed successfully:', { orderId });
      await this.sendLoyaltyDetails(orderId, points, `52${phone}`);

      await qr.commitTransaction();

      return { success: true };
    } catch (error) {
      console.error('Transaction failed for orderId:', orderId, error);
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
      console.log('QueryRunner released for orderId:', orderId);
    }
  }

  async sendLoyaltyDetails(
    orderId: string,
    actualPointsEarned: number,
    phone: string,
  ): Promise<void> {
    try {
      const message = {
        type: MessageQueue.Invoice,
        data: {
          phone,
          orderId,
          actualPointsEarned,
        },
      };
      await this.queueService.addMessage(this.queueName, message);

      console.log(
        `Loyalty details added to queue successfully for order ID: ${orderId}`,
      );
    } catch (error) {
      console.error(
        `Failed to send loyalty details for order ID: ${orderId}. Error: ${error.message}`,
      );
    }
  }
}
