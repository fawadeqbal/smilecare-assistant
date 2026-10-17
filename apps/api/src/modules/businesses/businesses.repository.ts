import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Database, InjectDb } from '@/infrastructure/database/database.module';
import { businesses, BusinessRow } from '@/infrastructure/database/schema';

export type BusinessUpdate = Partial<
  Pick<
    BusinessRow,
    | 'name'
    | 'botName'
    | 'welcomeMessage'
    | 'brandColor'
    | 'suggestedQuestions'
    | 'handoffEmail'
    | 'notificationEmail'
    | 'timezone'
  >
>;

@Injectable()
export class BusinessesRepository {
  constructor(@InjectDb() private readonly db: Database) {}

  async findById(id: string): Promise<BusinessRow | undefined> {
    const [row] = await this.db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
    return row;
  }

  async findByWidgetKey(widgetKey: string): Promise<BusinessRow | undefined> {
    const [row] = await this.db.select().from(businesses).where(eq(businesses.widgetKey, widgetKey)).limit(1);
    return row;
  }

  async update(id: string, patch: BusinessUpdate): Promise<BusinessRow> {
    const [row] = await this.db.update(businesses).set(patch).where(eq(businesses.id, id)).returning();
    return row;
  }
}
