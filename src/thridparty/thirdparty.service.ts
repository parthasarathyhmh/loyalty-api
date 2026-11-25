import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Point } from '../wallet/entities/point.entity';
import { Wallet } from '../wallet/entities/wallet.entity';

@Injectable()
export class ThirdPartyService {
  private readonly projectId: number;

  constructor(
    @InjectRepository(Point)
    private readonly points: Repository<Point>,
    @InjectRepository(Wallet)
    private readonly wallets: Repository<Wallet>,
    private readonly config: ConfigService,
  ) {
    this.projectId = Number.parseInt(
      this.config.get<string>('YALO_PROJECT_ID'),
    );
  }

  async balance(retailerCode: string): Promise<{ activePoints: number }> {
    if (!this.projectId) {
      throw new NotFoundException('invalid configuration');
    }

    const wallets = await this.wallets.find({
      where: { projectId: this.projectId, retailerCode: ILike(`%${retailerCode}%`) },
      select: ['id'],
    });

    if (!wallets.length) {
      throw new NotFoundException('wallet not found');
    }
    const walletIds = wallets.map((wallet) => wallet.id);

    const { active } = (await this.points
      .createQueryBuilder('point')
      .select('coalesce(sum(point.active), 0)', 'active')
      .where('(point.expiry IS NULL OR point.expiry > NOW())')
      .andWhere('point.walletId IN (:...walletIds)', { walletIds })
      .getRawOne()) || { active: 0 };

    return { activePoints: Math.round(Number(active)) };
  }
}
