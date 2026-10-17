import { Module } from '@nestjs/common';
import { SettingsController, WidgetConfigController } from './businesses.controller';
import { BusinessesRepository } from './businesses.repository';
import { BusinessesService } from './businesses.service';

@Module({
  controllers: [SettingsController, WidgetConfigController],
  providers: [BusinessesRepository, BusinessesService],
  exports: [BusinessesService],
})
export class BusinessesModule {}
