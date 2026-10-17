import 'reflect-metadata';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import bcrypt from 'bcryptjs';
import { and, eq } from 'drizzle-orm';
import { AppConfig } from '@/config/app-config.service';
import { CoreModule } from '@/core.module';
import { DB, Database } from '@/infrastructure/database/database.module';
import { adminUsers, businesses, documents } from '@/infrastructure/database/schema';
import { IngestionService } from '@/modules/knowledge/ingestion.service';
import { KnowledgeModule } from '@/modules/knowledge/knowledge.module';

@Module({ imports: [CoreModule, KnowledgeModule] })
class SeedModule {}

/**
 * Creates the demo clinic, an owner account and the sample knowledge base.
 * Idempotent: re-running updates existing rows instead of duplicating them.
 */
async function main() {
  const app = await NestFactory.createApplicationContext(SeedModule, { logger: ['error', 'warn', 'log'] });
  try {
    const db = app.get<Database>(DB);
    const config = app.get(AppConfig);
    const ingestion = app.get(IngestionService);

    const widgetKey = config.get('SEED_WIDGET_KEY');
    const values = {
      name: 'SmileCare Dental Clinic',
      widgetKey,
      botName: 'Sunny',
      welcomeMessage: "Hi, I'm Sunny from SmileCare. I can answer questions about treatments, prices and hours, or request an appointment for you.",
      brandColor: '#0A66F0',
      suggestedQuestions: ['How much is teeth whitening?', 'Are you open on Saturday?', 'Do you take Delta Dental?', 'I want to book a cleaning'],
      handoffEmail: 'frontdesk@smilecare-dental.example',
      notificationEmail: 'frontdesk@smilecare-dental.example',
      timezone: 'America/New_York',
    };

    let [business] = await db.select().from(businesses).where(eq(businesses.widgetKey, widgetKey)).limit(1);
    if (business) {
      [business] = await db.update(businesses).set(values).where(eq(businesses.id, business.id)).returning();
    } else {
      [business] = await db.insert(businesses).values(values).returning();
    }
    console.log(`Business: ${business.name} (widget key: ${widgetKey})`);

    const email = config.get('SEED_ADMIN_EMAIL').toLowerCase();
    const passwordHash = await bcrypt.hash(config.get('SEED_ADMIN_PASSWORD'), 12);
    const [existingAdmin] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
    if (existingAdmin) {
      await db.update(adminUsers).set({ passwordHash, businessId: business.id }).where(eq(adminUsers.id, existingAdmin.id));
    } else {
      await db.insert(adminUsers).values({ businessId: business.id, email, passwordHash, role: 'owner' });
    }
    console.log(`Admin: ${email}`);

    const dir = join(__dirname, '..', 'seed-data');
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
      const content = readFileSync(join(dir, file), 'utf8');
      const title = /^#\s+(.+)$/m.exec(content)?.[1]?.trim() ?? file;

      let [doc] = await db
        .select()
        .from(documents)
        .where(and(eq(documents.businessId, business.id), eq(documents.title, title)))
        .limit(1);
      if (doc) {
        [doc] = await db.update(documents).set({ content, status: 'queued' }).where(eq(documents.id, doc.id)).returning();
      } else {
        [doc] = await db.insert(documents).values({ businessId: business.id, title, content, sourceType: 'markdown' }).returning();
      }
      // Ingest synchronously so the demo works right after seeding, even with no worker running.
      const result = await ingestion.ingest(doc.id);
      console.log(`Indexed: ${title} (${result?.chunks ?? 0} chunks)`);
    }
    console.log('Seed complete');
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
