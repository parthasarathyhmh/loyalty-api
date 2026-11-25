import { Project, ProjectStatus } from '@/common/entities/project.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Customer } from '../common/entities/customer.entity';
import { TierConfig } from '../common/entities/tier-config.entity';
import {
  Tier,
} from '../common/entities/tier.entity';
import { AccountService } from '../common/services/accounts.service';
import { PointService } from '../common/services/points.service';
import { Customermeta } from '@/common/entities/customer-meta.entity';
import { TierProcessor } from './processors/tier.processor';

/**
 * Service for processing and upgrading customer tiers based on points and conditions.
 */
@Injectable()
export class TierService {
  constructor(
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    @InjectRepository(Customermeta)
    private readonly customerMeta: Repository<Customermeta>,
    @InjectRepository(Tier)
    private readonly tiers: Repository<Tier>,
    @InjectRepository(TierConfig)
    private readonly tierConfig: Repository<TierConfig>,
    @InjectRepository(Project)
    private readonly project: Repository<Project>,
    private readonly ps: PointService,
    private readonly ds: DataSource,
    private readonly acc: AccountService,
    private readonly tierProcessor: TierProcessor,
  ) {}

  async processActiveProjects(): Promise<void> {
    try {
      // Fetch active projects
      const projects = await this.project.find({
        where: {
          status: ProjectStatus.ACTIVE,
        },
      });

      if (projects.length === 0) {
        return;
      }

      // Process each project in parallel
      await Promise.all(projects.map((p) => this.processTierChanges(p.id)));
    } catch (err) {}
  }

  // Processes tier upgrades for all customers based on their eligibility and conditions.
  async processTierChanges(projectId: number): Promise<void> {
    console.log('[TIER_UPDATE] Start - projectId:', projectId);

    const [customerMeta, tierConfig] = await Promise.all([
      this.customerMeta.find({
        relations: ['customer'],
        where: { isEligibleForLoyalty: true },
      }),
      this.tierConfig.findOne({
        relations: ['project'],
        where: { project: { id: projectId } },
      }),
    ]);

    if (!tierConfig) {
      console.log('[TIER_UPDATE] No tierConfig found, exiting.');
      return;
    }

    console.log(
      '[TIER_UPDATE] Customers Meta:',
      customerMeta.length,
      'Tiers: Fetching...',
    );

    const tiers = await this.tiers.find({
      where: { project: { id: projectId }, isActive: true },
    });

    console.log('[TIER_UPDATE] Active tiers:', tiers.length);

    const qr = this.ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      for (const meta of customerMeta) {
        const customer = await this.customers.findOne({
          where: { id: meta.customer.id },
        });

        if (!customer) {
          console.warn(
            '[TIER_UPDATE] Customer not found, skipping:',
            meta.customer.id,
          );
          continue;
        }

        console.log('[TIER_UPDATE] Processing customer:', customer.id);

        const walletIds = await this.acc.getWalletIds(
          projectId,
          customer,
          true,
        );

        if (!walletIds || walletIds.length === 0) {
          console.log(
            '[TIER_UPDATE] No wallet found for customer:',
            customer.id,
          );
          continue;
        }

        console.log(
          '[TIER_UPDATE] Wallet IDs for customer:',
          customer.id,
          walletIds,
        );

        const currentCycleStart = this.tierProcessor.getCycleStartDate(tierConfig.cycle);
        console.log(
          '[TIER_UPDATE] Current cycle start date:',
          currentCycleStart,
        );
        const totalPoints = await this.ps.getPointSince(
          qr,
          walletIds,
          currentCycleStart,
        );
        const eligibleTier = this.tierProcessor.getNextTier(tiers, totalPoints);

        console.log(
          '[TIER_UPDATE] Customer:',
          customer.id,
          '| Points:',
          totalPoints,
          '| Current Tier:',
          customer.tierId,
          '| Eligible Tier:',
          eligibleTier?.id ?? 'None',
        );

        if (eligibleTier && customer.tierId !== eligibleTier.id) {
          customer.tierId = eligibleTier.id;
          await qr.manager.save(Customer, customer);
          console.log('[TIER_UPDATE] Tier updated for customer:', customer.id);
        }
      }

      await qr.commitTransaction();
      console.log('[TIER_UPDATE] Transaction committed.');
    } catch (error) {
      console.error('[TIER_UPDATE] Error:', error);
      await qr.rollbackTransaction();
      console.log('[TIER_UPDATE] Transaction rolled back.');
    } finally {
      await qr.release();
      console.log('[TIER_UPDATE] Query runner released.');
    }
  }


}
