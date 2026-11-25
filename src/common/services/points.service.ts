import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { PointTransaction } from '../../wallet/entities/point-transaction.entity';
import {
  PointState,
  PointUsage,
} from '../../wallet/entities/point-usage.entity';
import { Point } from '../../wallet/entities/point.entity';
import { numeric } from '../functions/numeric';

// perform various operations on points and usage of points
@Injectable()
export class PointService {
  constructor(
    @InjectRepository(PointUsage)
    private readonly pointUsage: Repository<PointUsage>,
  ) {}

  // transition points from one state to another
  private async transition(
    qr: QueryRunner,
    requiredPoints: [Point, number][],
    pointTransaction: PointTransaction,
    from: PointState,
    to: PointState,
  ): Promise<void> {
    const pointsToSave: Point[] = [];
    const pointUsageToSave: PointUsage[] = [];

    let diff = 0;

    for (const [point, value] of requiredPoints) {
      const pointFrom = numeric(point[from] ?? 0);
      const pointTo = numeric(point[to] ?? 0);
      if (pointFrom < value) {
        throw new BadRequestException(
          `insufficient ${from} points for point ID: ${point.id}`,
        );
      }

      // adjust values
      point[from] = pointFrom - value;
      point[to] = pointTo + value;
      pointsToSave.push(point);

      diff += value;

      // add usage record
      const usage = this.pointUsage.create({
        pointTransaction: { id: pointTransaction.id },
        point: { id: point.id },
        usage: value,
        fromState: from,
        toState: to,
      });
      pointUsageToSave.push(usage);
    }

    // save updated Points and PointUsage
    await qr.manager.save(Point, pointsToSave);
    await qr.manager.save(PointUsage, pointUsageToSave);
  }

  async calculateRequired(
    qr: QueryRunner,
    walletIds: number[],
    pointsValue: number,
    blocked = false,
  ): Promise<[Point, number][]> {
    const queryBuilder = qr.manager
      .createQueryBuilder(Point, 'point')
      .addSelect('point.walletId')
      .where(blocked ? 'point.blocked > 0' : 'point.active > 0')
      .andWhere('(point.expiry IS NULL OR point.expiry > NOW())')
      .andWhere('point.walletId IN (:...walletIds)', { walletIds })
      .orderBy(blocked ? 'point.blocked' : 'point.active', 'ASC')
      .setLock('pessimistic_write');

    const rawQuery = queryBuilder.getQuery();
    const queryParams = queryBuilder.getParameters();

    console.log('[CALCULATE_REQUIRED] Raw Query:', rawQuery);
    console.log('[CALCULATE_REQUIRED] Query Parameters:', queryParams);

    const activePoints = await queryBuilder.getMany();

    const requiredPoints: [Point, number][] = [];

    let remainingValue = pointsValue;
    for (const point of activePoints) {
      if (remainingValue === 0) break;
      if (remainingValue > 0) {
        const comparePoint = numeric(blocked ? point.blocked : point.active);
        if (remainingValue < comparePoint) {
          requiredPoints.push([point, remainingValue]);
          remainingValue = 0;
        } else {
          requiredPoints.push([point, comparePoint]);
          remainingValue = remainingValue - comparePoint;
        }
      }
    }

    if (remainingValue !== 0 && !blocked)
      throw new BadRequestException(
        `Not enough ${blocked ? 'blocked' : 'active'} points in wallets: ${walletIds.join(', ')}`,
      );

    return requiredPoints;
  }

  // consumed points that are blocked
  async consumeBlocked(
    qr: QueryRunner,
    requiredPoints: [Point, number][],
    pointTransaction: PointTransaction,
  ) {
    return this.transition(
      qr,
      requiredPoints,
      pointTransaction,
      PointState.Blocked,
      PointState.Spent,
    );
  }

  // consume active points
  async consume(
    qr: QueryRunner,
    requiredPoints: [Point, number][],
    pointTransaction: PointTransaction,
  ) {
    return this.transition(
      qr,
      requiredPoints,
      pointTransaction,
      PointState.Active,
      PointState.Spent,
    );
  }

  // block points for a transaction
  async block(
    qr: QueryRunner,
    requiredPoints: [Point, number][],
    pointTransaction: PointTransaction,
  ) {
    return this.transition(
      qr,
      requiredPoints,
      pointTransaction,
      PointState.Active,
      PointState.Blocked,
    );
  }

  // block points for a transaction
  async unblock(
    qr: QueryRunner,
    requiredPoints: [Point, number][],
    pointTransaction: PointTransaction,
  ) {
    return this.transition(
      qr,
      requiredPoints,
      pointTransaction,
      PointState.Blocked,
      PointState.Active,
    );
  }

  // get total points for a period
  async getPointSince(
    qr: QueryRunner,
    walletIds: number[],
    cycleStart: Date,
  ): Promise<{ earned: number; spent: number }> {
    const earned = await qr.manager
      .createQueryBuilder(Point, 'point')
      .select('sum(point.earned)', 'earned')
      .where('point.createdAt >= :cycleStart', { cycleStart })
      .andWhere('point.walletId IN (:...walletIds)', { walletIds })
      .getRawOne();

    const spent = await qr.manager
      .createQueryBuilder(PointTransaction, 'point')
      .select('sum(point.points)', 'spent')
      .where('(point.createdAt >= :cycleStart)', { cycleStart })
      .andWhere('point.walletId IN (:...walletIds)', { walletIds })
      .andWhere(`point.transactionType = 'debit'`)
      .getRawOne();

    return {
      earned: numeric(earned.earned ?? 0),
      spent: numeric(spent.spent ?? 0),
    };
  }

  async getEarnedSince(
    ds: DataSource,
    walletIds: number[],
    cycleStart: Date,
    cycleEnd: Date,
  ): Promise<number> {
    const earned = await ds
      .createQueryBuilder(Point, 'point')
      .select('sum(point.earned)', 'earned')
      .where('point.createdAt >= :cycleStart', { cycleStart })
      .andWhere('point.createdAt <= :cycleEnd', { cycleEnd })
      .andWhere('point.walletId IN (:...walletIds)', { walletIds })
      .getRawOne();
    return numeric(earned.earned ?? 0);
  }

  async getSpentSince(
    ds: DataSource,
    walletIds: number[],
    cycleStart: Date,
    cycleEnd: Date,
  ): Promise<number> {
    const spent = await ds
      .createQueryBuilder(PointTransaction, 'point')
      .select('sum(point.points)', 'spent')
      .where('point.createdAt >= :cycleStart', { cycleStart })
      .andWhere('point.createdAt <= :cycleEnd', { cycleEnd })
      .andWhere('point.walletId IN (:...walletIds)', { walletIds })
      .andWhere(`point.transactionType = 'debit'`)
      .getRawOne();
    return numeric(spent.spent ?? 0);
  }
}
