# AI Integration Architecture

## Constraints
- Adding LLM/AI features to an existing or new app
- Cost must be controlled (token usage)
- Responses must be reliable (not hallucinate critical data)
- May need document understanding or search

## Stack Decision

| Layer | Choice | Reason |
|-------|--------|--------|
| LLM Provider | OpenAI (primary) / Anthropic Claude (fallback) | Best capability/cost ratio |
| SDK | Vercel AI SDK | Streaming, multi-provider, Next.js native |
| Embeddings | OpenAI `text-embedding-3-small` | Cheapest, sufficient accuracy |
| Vector DB | Supabase pgvector (< 1M docs) / Pinecone (> 1M) | pgvector = zero extra cost |
| RAG Framework | Manual (fetch → embed → query → inject) | No framework overhead |
| Prompt Storage | Markdown files in repo | Version-controlled, reviewable |
| Caching | Upstash Redis (hash prompt + params) | Cut repeat token costs 60–80% |
| Cost Control | Token counting before send + spend limits | Never surprise bills |

## RAG Pipeline Pattern

```
User Query
    │
    ▼
1. Embed query → vector (OpenAI)
    │
    ▼
2. pgvector similarity search → top-K chunks
    │
    ▼
3. Build context window: system prompt + chunks + query
    │
    ▼
4. Send to LLM → stream response
    │
    ▼
5. Cache result keyed by query hash (Redis, TTL 1h)
```

## Implementation (Next.js + Vercel AI SDK)

```typescript
// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { getRelevantChunks } from '@/lib/rag'
import { redis } from '@/lib/redis'

export async function POST(req: Request) {
  const { messages } = await req.json()
  const lastMessage = messages[messages.length - 1].content

  // Check cache first
  const cacheKey = `ai:${Buffer.from(lastMessage).toString('base64')}`
  const cached = await redis.get(cacheKey)
  if (cached) return new Response(cached)

  // RAG: fetch relevant context
  const chunks = await getRelevantChunks(lastMessage, 5)
  const context = chunks.map(c => c.content).join('\n\n')

  const result = streamText({
    model: openai('gpt-4o-mini'),  // cheapest capable model
    system: `You are a helpful assistant. Use this context:\n\n${context}`,
    messages,
    maxTokens: 1000,  // always cap tokens
  })

  return result.toDataStreamResponse()
}
```

## Embedding + Storage Pattern

```typescript
// lib/rag/ingest.ts
import { openai } from '@ai-sdk/openai'
import { embed } from 'ai'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema'

export async function ingestDocument(content: string, metadata: object) {
  const chunks = chunkText(content, 500, 50)  // 500 tokens, 50 overlap

  for (const chunk of chunks) {
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: chunk
    })

    await db.insert(documents).values({
      content: chunk,
      embedding,  // pgvector column
      metadata
    })
  }
}

export async function getRelevantChunks(query: string, topK = 5) {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: query
  })

  // pgvector cosine similarity search
  return db.execute(sql`
    SELECT content, metadata,
           1 - (embedding <=> ${embedding}::vector) AS similarity
    FROM documents
    ORDER BY embedding <=> ${embedding}::vector
    LIMIT ${topK}
  `)
}
```

## Supabase pgvector Schema

```sql
-- Enable extension once
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  embedding vector(1536),           -- text-embedding-3-small dimensions
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- IVFFlat index for fast search (build after 1000+ rows)
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

## Prompt Engineering Pattern

```typescript
// lib/prompts/index.ts — store prompts as named constants, not inline strings
export const SYSTEM_PROMPTS = {
  codeReview: `You are a senior engineer reviewing code.
Rules:
- Flag security issues first (OWASP Top 10)
- Note performance concerns
- Suggest, don't rewrite unless asked
- Be concise — one issue per bullet`,

  documentSummary: `You are a technical writer.
Summarize the provided document in 3-5 bullet points.
Focus on: key decisions, technical constraints, action items.`
} as const
```

## Cost Control Rules

- Use `gpt-4o-mini` (not `gpt-4o`) unless complex reasoning required
- Cache identical/similar queries in Redis (60–80% cost reduction)
- Set `maxTokens` on every call — never open-ended
- Use streaming for UX, not cost (same token price)
- Batch embeddings (up to 2048 items per API call)
- Monitor spend with OpenAI usage dashboard + budget alerts

## Cost Estimate (1000 daily active users)

| Operation | Model | Cost/1K calls |
|-----------|-------|--------------|
| Chat (1K tokens avg) | gpt-4o-mini | ~$0.15 |
| Embeddings (500 tokens) | text-embedding-3-small | ~$0.01 |
| With 70% cache hit rate | — | ~$0.05 effective |

---

## Agent Reference

For complex AI integration: read `agents/ai-specialists/llm-architect.md`
For AI-powered search: read `agents/ai-specialists/search-specialist.md`
