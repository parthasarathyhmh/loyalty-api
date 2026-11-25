import { Module } from '@nestjs/common';
import { CmsSectionsService } from './cms-sections.service';
import { CmsSectionsController } from './cms-sections.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CMSSection } from '@/common/entities/cms-section.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CMSSection])],
  controllers: [CmsSectionsController],
  providers: [CmsSectionsService],
})
export class CmsSectionsModule {}
