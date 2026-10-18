process.env.NODE_ENV = 'test';
process.env.EMBEDDING_PROVIDER = 'hash';
process.env.RETRIEVAL_MIN_SCORE = '0';
process.env.LOG_LEVEL = 'warn';
process.env.JWT_SECRET ??= 'e2e-test-secret-at-least-16-chars';
process.env.DATABASE_URL ??= 'postgresql://smilecare:smilecare@localhost:5432/smilecare';

import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { ChatStreamEvent } from '@smilecare/shared';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { AppModule } from '@/app.module';
import { LLM_PORT } from '@/infrastructure/ai/llm/llm.port';
import { DB, Database } from '@/infrastructure/database/database.module';
import { adminUsers, businesses } from '@/infrastructure/database/schema';
import { IngestionService } from '@/modules/knowledge/ingestion.service';
import { KnowledgeRepository } from '@/modules/knowledge/knowledge.repository';
import { configureApp } from '@/main';
import bcrypt from 'bcryptjs';
import { ScriptedLlm } from './fakes/scripted-llm';

function parseSse(body: string): ChatStreamEvent[] {
  return body
    .split('\n\n')
    .map((frame) => frame.split('\n').find((l) => l.startsWith('data: ')))
    .filter((l): l is string => !!l)
    .map((l) => JSON.parse(l.slice(6)) as ChatStreamEvent);
}

describe('Chat (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  const llm = new ScriptedLlm();
  const suffix = randomUUID().slice(0, 8);
  const widgetKey = `pk_test_${suffix}`;
  const visitorId = `visitor_${suffix}`;
  const adminEmail = `owner_${suffix}@test.dev`;
  let businessId: string;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(LLM_PORT)
      .useValue(llm)
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ bufferLogs: true });
    configureApp(app);
    await app.init();

    db = app.get(DB);
    const [business] = await db
      .insert(businesses)
      .values({ name: 'Test Clinic', widgetKey, handoffEmail: 'staff@test.dev' })
      .returning();
    businessId = business.id;
    await db.insert(adminUsers).values({ businessId, email: adminEmail, passwordHash: await bcrypt.hash('Password123!', 4) });

    const doc = await app.get(KnowledgeRepository).createDocument({
      businessId,
      title: 'Prices',
      content: '# Prices\n\nTeeth whitening costs $449 per session.',
      sourceType: 'markdown',
    });
    await app.get(IngestionService).ingest(doc.id);

    const login = await request(app.getHttpServer()).post('/v1/auth/login').send({ email: adminEmail, password: 'Password123!' }).expect(200);
    token = login.body.accessToken;
  });

  afterAll(async () => {
    if (db && businessId) await db.delete(businesses).where(eq(businesses.id, businessId));
    await app?.close();
  });

  async function startSession(): Promise<string> {
    const res = await request(app.getHttpServer()).post('/v1/chat/sessions').send({ widgetKey, visitorId }).expect(201);
    return res.body.sessionId;
  }

  async function send(sessionId: string, message: string): Promise<ChatStreamEvent[]> {
    const res = await request(app.getHttpServer())
      .post(`/v1/chat/sessions/${sessionId}/messages`)
      .send({ widgetKey, visitorId, message })
      .expect(200)
      .expect('Content-Type', /text\/event-stream/);
    return parseSse(res.text);
  }

  it('answers from the knowledge base and streams deltas', async () => {
    const sessionId = await startSession();
    const events = await send(sessionId, 'How much is teeth whitening?');

    const text = events.filter((e) => e.type === 'delta').map((e) => (e as { text: string }).text).join('');
    expect(text).toBe('It costs $449.');
    const done = events.at(-1);
    expect(done).toMatchObject({ type: 'done', conversationStatus: 'open' });
    expect((done as Extract<ChatStreamEvent, { type: 'done' }>).sources[0].documentTitle).toBe('Prices');

    // The retrieved chunk was put in Claude's system prompt.
    expect(llm.requests.at(-1)?.system).toContain('Teeth whitening costs $449');

    const history = await request(app.getHttpServer())
      .get(`/v1/chat/sessions/${sessionId}/messages`)
      .query({ widgetKey, visitorId })
      .expect(200);
    expect(history.body.messages.map((m: { role: string }) => m.role)).toEqual(['user', 'assistant']);
  });

  it('creates a booking through the create_booking tool', async () => {
    const sessionId = await startSession();
    const events = await send(sessionId, 'I want to book a cleaning');

    expect(events).toContainEqual({ type: 'tool', name: 'create_booking', status: 'started' });
    expect(events).toContainEqual({ type: 'tool', name: 'create_booking', status: 'completed' });
    const booking = events.find((e) => e.type === 'booking') as Extract<ChatStreamEvent, { type: 'booking' }>;
    expect(booking.booking).toMatchObject({ patientName: 'Jane Doe', service: 'cleaning', status: 'pending' });

    const text = events.filter((e) => e.type === 'delta').map((e) => (e as { text: string }).text).join('');
    expect(text).toBe('Let me save that for you.\n\nAll done! The team will call you to confirm.');

    const list = await request(app.getHttpServer()).get('/v1/bookings').set('Authorization', `Bearer ${token}`).expect(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0]).toMatchObject({ patientName: 'Jane Doe', conversationId: sessionId });

    await request(app.getHttpServer())
      .patch(`/v1/bookings/${list.body.items[0].id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'confirmed' })
      .expect(200)
      .expect((r) => expect(r.body.status).toBe('confirmed'));
  });

  it('hands off to a human and marks the conversation', async () => {
    const sessionId = await startSession();
    const events = await send(sessionId, 'Can I talk to a human please?');

    expect(events.find((e) => e.type === 'handoff')).toBeDefined();
    expect(events.at(-1)).toMatchObject({ type: 'done', conversationStatus: 'handed_off' });

    const detail = await request(app.getHttpServer())
      .get(`/v1/conversations/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(detail.body.status).toBe('handed_off');
  });

  it('isolates tenants and visitors', async () => {
    const sessionId = await startSession();
    await request(app.getHttpServer())
      .post(`/v1/chat/sessions/${sessionId}/messages`)
      .send({ widgetKey, visitorId: 'someone_else_123', message: 'hi' })
      .expect(403);
    await request(app.getHttpServer())
      .post(`/v1/chat/sessions/${sessionId}/messages`)
      .send({ widgetKey: 'pk_demo_does_not_exist', visitorId, message: 'hi' })
      .expect(404);
  });

  it('rejects blank messages and accepts large text documents', async () => {
    const sessionId = await startSession();
    await request(app.getHttpServer())
      .post(`/v1/chat/sessions/${sessionId}/messages`)
      .send({ widgetKey, visitorId, message: '   \n ' })
      .expect(400);

    // ~150 KB, above Express's default 100 KB JSON limit.
    const content = '# Big document\n\n' + 'The clinic offers many services. '.repeat(4_700);
    await request(app.getHttpServer())
      .post('/v1/knowledge/documents')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Big document', content })
      .expect(201);
  });

  it('protects admin endpoints and validates input', async () => {
    await request(app.getHttpServer()).get('/v1/bookings').expect(401);
    await request(app.getHttpServer())
      .patch('/v1/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ brandColor: 'not-a-color' })
      .expect(400);
    const updated = await request(app.getHttpServer())
      .patch('/v1/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ brandColor: '#123ABC', botName: 'Molar Bot' })
      .expect(200);
    expect(updated.body).toMatchObject({ brandColor: '#123ABC', botName: 'Molar Bot', widgetKey });

    const list = await request(app.getHttpServer()).get('/v1/conversations').set('Authorization', `Bearer ${token}`).expect(200);
    const withMessages = list.body.items.filter((c: { messageCount: number }) => c.messageCount > 0);
    expect(withMessages.length).toBeGreaterThanOrEqual(3);
    expect(withMessages[0].lastMessage).toEqual(expect.any(String));

    const overview = await request(app.getHttpServer()).get('/v1/analytics/overview').set('Authorization', `Bearer ${token}`).expect(200);
    expect(overview.body.week.conversations).toBeGreaterThanOrEqual(3);
    expect(overview.body.daily).toHaveLength(14);
    expect(overview.body.sparks.conversations).toHaveLength(14);
    expect(overview.body.waiting.count).toBe(1);
    expect(overview.body.waiting.longestSince).toEqual(expect.any(String));
    expect(overview.body.topTopics[0]).toMatchObject({ label: 'Prices' });

    const month = await request(app.getHttpServer())
      .get('/v1/analytics/overview?days=30')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(month.body.daily).toHaveLength(30);
    await request(app.getHttpServer()).get('/v1/analytics/overview?days=9').set('Authorization', `Bearer ${token}`).expect(400);

    const waiting = await request(app.getHttpServer())
      .get('/v1/conversations?status=handed_off')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(waiting.body.items[0]).toMatchObject({
      handoffReason: 'asked for a human',
      lastVisitorMessage: 'Can I talk to a human please?',
    });
  });
  it('accepts appointment requests from the clinic website form', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/public/bookings')
      .send({ widgetKey, patientName: 'Sam Lee', phone: '(555) 123-4567', service: 'Whitening', preferredTime: 'Saturday' })
      .expect(201);
    expect(res.body).toMatchObject({ patientName: 'Sam Lee', service: 'Whitening', preferredTime: 'Saturday', status: 'pending' });

    const list = await request(app.getHttpServer()).get('/v1/bookings').set('Authorization', `Bearer ${token}`).expect(200);
    expect(list.body.items[0]).toMatchObject({ id: res.body.id, conversationId: null, notes: 'From the website form' });

    await request(app.getHttpServer())
      .post('/v1/public/bookings')
      .send({ widgetKey, patientName: 'Sam Lee', phone: 'call me maybe', preferredTime: 'Saturday' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/v1/public/bookings')
      .send({ widgetKey: 'pk_demo_does_not_exist', patientName: 'Sam Lee', phone: '5551234567', preferredTime: 'Saturday' })
      .expect(404);
  });
});
