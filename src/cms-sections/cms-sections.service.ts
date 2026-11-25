import { CMSSection } from '@/common/entities/cms-section.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CmsSectionsService {
  constructor(
    @InjectRepository(CMSSection)
    private readonly cmsSectionRepository: Repository<CMSSection>,
  ) {}

  async findAll(): Promise<CMSSection[]> {
    return await this.cmsSectionRepository.find({
      where: {
        status: true,
      },
      relations: ['createdBy', 'updatedBy'],
      order: {
        id: 'ASC',
      },
    });
  }

  async findOne(id: number): Promise<CMSSection> {
    return this.cmsSectionRepository.findOne({
      where: { id },
      relations: ['createdBy', 'updatedBy'],
    });
  }
}
