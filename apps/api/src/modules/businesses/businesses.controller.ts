import { Body, Controller, Get, Header, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { BusinessSettings, WidgetConfig } from '@smilecare/shared';
import { BusinessId, Public, Roles } from '@/common/decorators';
import { BusinessesService } from './businesses.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly businesses: BusinessesService) {}

  @Get()
  get(@BusinessId() businessId: string): Promise<BusinessSettings> {
    return this.businesses.getSettings(businessId);
  }

  @Patch()
  @Roles('owner')
  update(@BusinessId() businessId: string, @Body() dto: UpdateSettingsDto): Promise<BusinessSettings> {
    return this.businesses.updateSettings(businessId, dto);
  }
}

@ApiTags('widget')
@Controller('widget')
export class WidgetConfigController {
  constructor(private readonly businesses: BusinessesService) {}

  @Public()
  @SkipThrottle()
  @Get(':widgetKey/config')
  @Header('Cache-Control', 'public, max-age=60')
  config(@Param('widgetKey') widgetKey: string): Promise<WidgetConfig> {
    return this.businesses.getWidgetConfig(widgetKey);
  }
}
