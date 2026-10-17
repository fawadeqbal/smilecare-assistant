import { Injectable, NotFoundException } from '@nestjs/common';
import type { BusinessSettings, UpdateBusinessSettingsRequest, WidgetConfig } from '@smilecare/shared';
import type { BusinessRow } from '@/infrastructure/database/schema';
import { BusinessesRepository } from './businesses.repository';

/**
 * Tenant lookup and settings. Widget-key resolution is on the hot path of every
 * chat message, so results are cached in-process for a short time.
 */
@Injectable()
export class BusinessesService {
  private readonly widgetKeyCache = new Map<string, { row: BusinessRow; expires: number }>();
  private static readonly CACHE_TTL_MS = 30_000;

  constructor(private readonly repo: BusinessesRepository) {}

  async getById(id: string): Promise<BusinessRow> {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException('Business not found');
    return row;
  }

  async getByWidgetKey(widgetKey: string): Promise<BusinessRow> {
    const cached = this.widgetKeyCache.get(widgetKey);
    if (cached && cached.expires > Date.now()) return cached.row;

    const row = await this.repo.findByWidgetKey(widgetKey);
    if (!row) throw new NotFoundException('Unknown widget key');
    this.widgetKeyCache.set(widgetKey, { row, expires: Date.now() + BusinessesService.CACHE_TTL_MS });
    return row;
  }

  async getSettings(businessId: string): Promise<BusinessSettings> {
    return toSettings(await this.getById(businessId));
  }

  async updateSettings(businessId: string, patch: UpdateBusinessSettingsRequest): Promise<BusinessSettings> {
    const { businessName, ...rest } = patch;
    const row = await this.repo.update(businessId, { ...rest, ...(businessName !== undefined ? { name: businessName } : {}) });
    this.widgetKeyCache.delete(row.widgetKey);
    return toSettings(row);
  }

  async getWidgetConfig(widgetKey: string): Promise<WidgetConfig> {
    return toWidgetConfig(await this.getByWidgetKey(widgetKey));
  }
}

function toWidgetConfig(row: BusinessRow): WidgetConfig {
  return {
    businessName: row.name,
    botName: row.botName,
    welcomeMessage: row.welcomeMessage,
    brandColor: row.brandColor,
    suggestedQuestions: row.suggestedQuestions,
  };
}

function toSettings(row: BusinessRow): BusinessSettings {
  return {
    ...toWidgetConfig(row),
    id: row.id,
    widgetKey: row.widgetKey,
    handoffEmail: row.handoffEmail,
    notificationEmail: row.notificationEmail,
    timezone: row.timezone,
  };
}
