# SmileCare Assistant — AI Customer-Support Chatbot

> This is the original planning spec. A few choices were refined during the build: Claude is the only LLM, embeddings run on a free self-hosted model (so vectors are 384-dimensional), the ORM is Drizzle, ingestion and emails run on BullMQ workers, and handoff is decided by Claude through a tool rather than by a score threshold alone. See the [README](../README.md) and [architecture notes](architecture.md) for the system as built.

An AI chatbot for a (fictional) dental clinic that answers patient questions from the clinic's own documents, books appointments, and hands off to staff when it can't help. Built as an Upwork portfolio project that can be re-skinned for any small business.

---

## 1. Goals

- Answer patient questions **only from the clinic's knowledge base** (prices, services, timings, insurance), not generic AI answers.
- Capture **appointment requests** (name, phone, service, preferred time) through conversation.
- **Hand off to a human** when the bot isn't confident, and notify staff by email.
- Install on **any website with one script tag** (embeddable chat widget).
- Give the clinic an **admin dashboard** to manage documents, see conversations and bookings.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend (admin dashboard + demo site) | Next.js (App Router, TypeScript, Tailwind) |
| Chat widget | Standalone JS bundle (built from the Next.js repo or a small Vite package) |
| API / server | NestJS (TypeScript) |
| Database | PostgreSQL + pgvector |
| ORM | Drizzle ORM (native pgvector support, SQL migrations) |
| LLM | Claude API (behind a provider interface) |
| Embeddings | Free self-hosted model via Transformers.js (behind a provider interface) |
| Email | Nodemailer (SMTP), sent from a queue worker |
| Queue | BullMQ on Redis (document ingestion, notifications) |
| Hosting | Own server (Docker Compose: web, api, postgres, nginx) |

---

## 3. Architecture

```
┌──────────────────┐        ┌────────────────────────────┐
│  Client website  │        │   Next.js Admin Dashboard  │
│  + chat widget   │        │  (docs, chats, bookings)   │
└────────┬─────────┘        └─────────────┬──────────────┘
         │  REST / SSE                    │  REST (JWT)
         ▼                                ▼
┌─────────────────────────────────────────────────────────┐
│                      NestJS API                         │
│  ChatModule · KnowledgeModule · BookingModule           │
│  AuthModule · NotificationModule · WidgetModule         │
└────────┬───────────────────────┬────────────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌──────────────────────┐
│ Postgres +      │     │ LLM + Embedding APIs │
│ pgvector        │     └──────────────────────┘
└─────────────────┘
```

### How a chat message is answered (RAG flow)

1. Widget sends the message to `POST /chat/:sessionId/messages`.
2. API embeds the message and runs a **vector similarity search** on `document_chunks` (top 5).
3. If the best match score is below a threshold → **handoff** (see §7).
4. Otherwise, build a prompt: system rules + retrieved chunks + last ~10 messages + user message.
5. LLM replies. If it detects booking intent, it calls the `create_booking` tool (function calling).
6. Response is **streamed** back to the widget (SSE) and saved to `messages`.

---

## 4. Repository Structure

```
smilecare-assistant/
├── apps/
│   ├── web/                 # Next.js — admin dashboard + demo clinic site
│   │   ├── app/
│   │   │   ├── (marketing)/ # demo clinic landing page with widget installed
│   │   │   ├── admin/
│   │   │   │   ├── documents/
│   │   │   │   ├── conversations/
│   │   │   │   ├── bookings/
│   │   │   │   └── settings/
│   │   │   └── login/
│   │   └── components/
│   ├── widget/              # embeddable chat bubble (outputs widget.js)
│   └── api/                 # NestJS
│       └── src/
│           ├── auth/
│           ├── chat/
│           ├── knowledge/   # upload, chunk, embed, search
│           ├── booking/
│           ├── notification/
│           ├── llm/         # provider interface: Claude / OpenAI
│           ├── embeddings/  # provider interface
│           └── widget/      # public config endpoint for the widget
├── docker/
│   ├── docker-compose.yml
│   └── nginx.conf
└── README.md
```

A monorepo (pnpm workspaces or Turborepo) keeps shared types between `web`, `widget`, and `api`.

---

## 5. Database Schema

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- Multi-tenant ready: one row per business using the bot
CREATE TABLE businesses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  widget_key    TEXT UNIQUE NOT NULL,      -- public key used in the embed script
  bot_name      TEXT DEFAULT 'SmileCare Assistant',
  welcome_msg   TEXT,
  brand_color   TEXT DEFAULT '#0EA5E9',
  handoff_email TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID REFERENCES businesses(id) ON DELETE CASCADE,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID REFERENCES businesses(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  source_type   TEXT NOT NULL,             -- 'pdf' | 'text' | 'faq' | 'url'
  status        TEXT DEFAULT 'processing', -- 'processing' | 'ready' | 'failed'
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Set the vector size to match your embedding model
-- (e.g. 1024 for voyage-3, 1536 for text-embedding-3-small)
CREATE TABLE document_chunks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID REFERENCES documents(id) ON DELETE CASCADE,
  business_id   UUID REFERENCES businesses(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  embedding     vector(1536) NOT NULL,
  chunk_index   INT NOT NULL
);

CREATE INDEX ON document_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX ON document_chunks (business_id);

CREATE TABLE conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID REFERENCES businesses(id) ON DELETE CASCADE,
  visitor_id    TEXT NOT NULL,             -- anonymous id stored in the widget
  status        TEXT DEFAULT 'open',       -- 'open' | 'handed_off' | 'closed'
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,           -- 'user' | 'assistant' | 'system'
  content         TEXT NOT NULL,
  sources         JSONB,                   -- chunk ids used for the answer
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID REFERENCES businesses(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  patient_name    TEXT NOT NULL,
  phone           TEXT NOT NULL,
  service         TEXT,
  preferred_time  TEXT,
  status          TEXT DEFAULT 'pending',  -- 'pending' | 'confirmed' | 'cancelled'
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### Similarity search query

```sql
SELECT id, content, 1 - (embedding <=> $1) AS score
FROM document_chunks
WHERE business_id = $2
ORDER BY embedding <=> $1
LIMIT 5;
```

---

## 6. API Endpoints (NestJS)

### Public (used by the widget, identified by `widget_key`)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/widget/:widgetKey/config` | Bot name, color, welcome message |
| POST | `/chat/sessions` | Start a conversation → returns `sessionId` |
| POST | `/chat/:sessionId/messages` | Send message, streams reply (SSE) |
| GET | `/chat/:sessionId/messages` | Load history when widget reopens |

### Admin (JWT protected)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/login` | Admin login |
| GET / POST | `/knowledge/documents` | List / upload documents (PDF, text, FAQ) |
| DELETE | `/knowledge/documents/:id` | Remove document and its chunks |
| POST | `/knowledge/search` | Test a query against the knowledge base |
| GET | `/conversations` | List conversations (filter by status) |
| GET | `/conversations/:id` | Full transcript |
| GET / PATCH | `/bookings` · `/bookings/:id` | View / confirm / cancel bookings |
| GET / PATCH | `/settings` | Bot name, color, welcome message, handoff email |

Add rate limiting on public routes (`@nestjs/throttler`) and validate all input with `class-validator`.

---

## 7. Core Logic

### Document ingestion
1. Admin uploads a PDF/text/FAQ.
2. Extract text (`pdf-parse` for PDFs).
3. Split into chunks of ~500–800 tokens with ~100 token overlap.
4. Embed each chunk and insert into `document_chunks`.
5. Mark the document `ready` (run as a background job with BullMQ or a simple queue).

### System prompt (starting point)
```
You are {bot_name}, the assistant for {business_name}.
Answer ONLY using the context below. If the answer is not in the context,
say you're not sure and offer to connect the patient with staff.
Be friendly and brief (2–4 sentences). Never give medical diagnoses.
If the user wants an appointment, collect name, phone, service and
preferred time, then call the create_booking tool.

Context:
{retrieved_chunks}
```

### Booking via tool calling
Define a `create_booking` tool with fields `patient_name`, `phone`, `service`, `preferred_time`. When the LLM calls it, the API saves the booking, emails the clinic, and returns a confirmation for the bot to show.

### Human handoff
Trigger when:
- best similarity score < threshold (start at ~0.75 and tune), or
- user asks for a human ("talk to someone", "call me"), or
- the LLM says it doesn't know twice in a row.

Action: set conversation `status = 'handed_off'`, email the transcript to `handoff_email`, show "Our team will contact you shortly" in the widget.

---

## 8. Chat Widget

Install snippet the client pastes into their site:

```html
<script
  src="https://your-domain.com/widget.js"
  data-widget-key="pk_live_xxxxxxxx"
  defer>
</script>
```

Widget requirements:
- Floating bubble bottom-right, opens a chat panel.
- Uses Shadow DOM so the host site's CSS can't break it.
- Fetches branding from `/widget/:widgetKey/config`.
- Stores `visitor_id` and `sessionId` in `localStorage` so the chat survives page reloads.
- Streams replies token by token, shows a typing indicator.
- Mobile-friendly (full screen on small widths).

---

## 9. Admin Dashboard (Next.js)

- **Login** page.
- **Overview:** today's conversations, bookings, handoffs (simple cards + chart).
- **Documents:** upload, list with status, delete, "test a question" box.
- **Conversations:** list with status filter, transcript view showing which sources were used.
- **Bookings:** table with confirm/cancel actions, export to CSV.
- **Settings:** bot name, welcome message, brand color (live widget preview), handoff email, copy-paste install snippet.

---

## 10. Environment Variables

```env
# api
DATABASE_URL=postgresql://user:pass@postgres:5432/smilecare
JWT_SECRET=change-me
LLM_PROVIDER=claude            # claude | openai
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
EMBEDDING_PROVIDER=openai      # openai | voyage
VOYAGE_API_KEY=
EMBEDDING_DIMENSIONS=1536
SIMILARITY_THRESHOLD=0.75
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
CORS_ORIGINS=*                 # widget runs on client domains

# web
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

---

## 11. Deployment (own server)

`docker-compose.yml` services:
- `postgres` — image `pgvector/pgvector:pg16`, persistent volume
- `api` — NestJS build
- `web` — Next.js build (standalone output)
- `nginx` — reverse proxy + SSL (Let's Encrypt / Certbot), serves `widget.js` with caching

Seed script: creates the demo clinic, an admin user, and loads sample documents (services & prices, opening hours, insurance FAQ, aftercare tips) so the live demo works out of the box.

---

## 12. Build Milestones

| # | Milestone | Done when |
|---|---|---|
| 1 | Setup | Monorepo, Docker Compose, Postgres + pgvector running, NestJS & Next.js skeletons |
| 2 | Knowledge base | Upload → chunk → embed → search works via `/knowledge/search` |
| 3 | Chat API | RAG answers with streaming, messages saved |
| 4 | Widget | Embeddable bubble chatting with the API on a test page |
| 5 | Bookings | Tool calling creates bookings, email sent |
| 6 | Handoff | Low-confidence detection, status change, email transcript |
| 7 | Admin dashboard | Documents, conversations, bookings, settings pages |
| 8 | Demo site & deploy | Demo clinic landing page live on own server with seed data |
| 9 | Portfolio assets | Screenshots, Loom video, Upwork case study written |

---

## 13. Sample Knowledge Base Content (for the demo)

Create 4–5 short documents for the fictional clinic:
- **Services & prices** — checkup, cleaning, whitening, fillings, root canal, braces consultation.
- **Opening hours & location** — weekday/weekend hours, address, parking.
- **Insurance & payment** — accepted plans, installment options.
- **Aftercare** — what to do after extraction, whitening, fillings.
- **Policies** — cancellations, late arrivals, emergencies.

---

## 14. Demo Script (for the Loom video, ~60–90 sec)

1. Show the clinic website with the chat bubble.
2. Ask: "How much is teeth whitening?" → accurate answer from the docs.
3. Ask: "Are you open on Sunday?" → answer from opening hours.
4. Say: "I'd like to book a cleaning next Tuesday afternoon" → bot collects details, confirms.
5. Switch to admin → the booking appears; open the conversation transcript with sources.
6. Ask something off-topic/unknown → bot hands off; show the handoff email.
7. Show Settings → change brand color, copy the one-line install snippet.

---

## 15. Upwork Portfolio Listing

**Title:**
AI Chatbot That Answers Customer Questions & Books Appointments 24/7

**Description:**
> **Problem:** A dental clinic was missing patient calls after hours and staff spent hours answering the same questions.
>
> **Solution:** I built an AI assistant trained on the clinic's own documents. It answers questions about services, prices and timings, books appointments through conversation, and hands off to staff when needed. It installs on any website with one line of code.
>
> **Tech:** Next.js, NestJS, PostgreSQL + pgvector (RAG), Claude/OpenAI API, Docker.
>
> **Adaptable for:** restaurants, real estate, gyms, law firms, e-commerce support, SaaS help desks.

**Attach:** live demo link, Loom video, 3–4 screenshots (widget chat, booking confirmation, admin conversations, settings with install snippet).

**Skills tags:** AI Chatbot, OpenAI API, Claude API, RAG, LangChain alternative, Next.js, NestJS, PostgreSQL, Vector Database, Chatbot Development.

---

## 16. Nice-to-Have Extras (after v1)

- Multilingual replies (English + Urdu) — strong selling point.
- WhatsApp channel using the same API.
- Google Calendar sync for real appointment slots.
- Website URL crawler to auto-build the knowledge base.
- Analytics: top questions, unanswered questions (shows clients what to add to docs).
