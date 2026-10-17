'use client';

import type { KnowledgeDocument, KnowledgeSearchHit, Paginated } from '@smilecare/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Button, DocumentBadge, EmptyState, ErrorNote, PageHeader, Panel, Skeleton } from '@/components/admin/ui';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/format';

export default function KnowledgePage() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState<'none' | 'text' | 'file'>('none');

  const docs = useQuery({
    queryKey: ['documents'],
    queryFn: () => api<Paginated<KnowledgeDocument>>('/knowledge/documents?pageSize=100'),
    // Poll while anything is still being indexed by the worker.
    refetchInterval: (query) => (query.state.data?.items.some((d) => d.status === 'queued' || d.status === 'processing') ? 2000 : false),
  });

  const refresh = () => void qc.invalidateQueries({ queryKey: ['documents'] });
  const remove = useMutation({ mutationFn: (id: string) => api(`/knowledge/documents/${id}`, { method: 'DELETE' }), onSuccess: refresh });
  const reindex = useMutation({ mutationFn: (id: string) => api(`/knowledge/documents/${id}/reindex`, { method: 'POST' }), onSuccess: refresh });

  return (
    <>
      <PageHeader
        title="Knowledge"
        description="The assistant only answers from these documents. Keep prices, hours and policies here up to date."
        actions={
          <>
            <Button variant="secondary" onClick={() => setAdding(adding === 'file' ? 'none' : 'file')}>
              Upload a file
            </Button>
            <Button onClick={() => setAdding(adding === 'text' ? 'none' : 'text')}>Write a document</Button>
          </>
        }
      />

      {adding === 'text' && <TextForm onDone={() => (setAdding('none'), refresh())} onCancel={() => setAdding('none')} />}
      {adding === 'file' && <UploadForm onDone={() => (setAdding('none'), refresh())} onCancel={() => setAdding('none')} />}

      {(docs.error || remove.error || reindex.error) && <ErrorNote error={docs.error ?? remove.error ?? reindex.error} />}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Panel>
          {docs.isLoading ? (
            <Skeleton rows={5} />
          ) : docs.data?.items.length ? (
            <ul className="divide-y divide-line">
              {docs.data.items.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{d.title}</p>
                    <p className="text-sm text-slate">
                      {d.sourceType.toUpperCase()} · {d.chunkCount} sections · updated {timeAgo(d.updatedAt)}
                    </p>
                    {d.error && <p className="mt-1 text-sm text-danger">{d.error}</p>}
                  </div>
                  <DocumentBadge status={d.status} />
                  <div className="flex gap-1">
                    <Button variant="ghost" disabled={reindex.isPending} onClick={() => reindex.mutate(d.id)}>
                      Re-index
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={remove.isPending}
                      onClick={() => confirm(`Delete “${d.title}”? The assistant will stop using it immediately.`) && remove.mutate(d.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No documents yet">Add your price list, opening hours and FAQs so the assistant can answer questions.</EmptyState>
          )}
        </Panel>

        <SearchTester />
      </div>
    </>
  );
}

function TextForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const create = useMutation({
    mutationFn: (body: { title: string; content: string }) =>
      api<KnowledgeDocument>('/knowledge/documents', { method: 'POST', json: { ...body, sourceType: 'markdown' } }),
    onSuccess: onDone,
  });
  return (
    <Panel className="mb-6 p-5">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          create.mutate({ title: String(f.get('title')), content: String(f.get('content')) });
        }}
      >
        <label className="block">
          <span className="text-sm font-bold">Title</span>
          <input name="title" required minLength={2} maxLength={200} placeholder="Holiday opening hours" className="mt-1 w-full rounded-xl border border-line px-4 py-2.5 outline-none focus:border-brand" />
        </label>
        <label className="block">
          <span className="text-sm font-bold">Content</span>
          <textarea
            name="content"
            required
            rows={8}
            placeholder={'# Holiday hours\n\nWe are closed on December 25 and January 1.'}
            className="mt-1 w-full rounded-xl border border-line px-4 py-3 font-mono text-sm outline-none focus:border-brand"
          />
          <span className="mt-1 block text-sm text-slate">Markdown headings (# Heading) help the assistant find the right section.</span>
        </label>
        {create.error && <ErrorNote error={create.error} />}
        <div className="flex gap-2">
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Saving…' : 'Save and index'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function UploadForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useMutation({
    mutationFn: (form: FormData) => api<KnowledgeDocument>('/knowledge/documents/upload', { method: 'POST', body: form }),
    onSuccess: onDone,
  });
  return (
    <Panel className="mb-6 p-5">
      <form
        className="flex flex-wrap items-end gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          upload.mutate(new FormData(e.currentTarget));
        }}
      >
        <label className="block min-w-60 flex-1">
          <span className="text-sm font-bold">PDF, Markdown or text file (max 10 MB)</span>
          <input
            ref={fileRef}
            name="file"
            type="file"
            required
            accept=".pdf,.md,.markdown,.txt,application/pdf,text/plain,text/markdown"
            className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-mint file:px-3 file:py-2 file:font-bold"
          />
        </label>
        <label className="block min-w-60 flex-1">
          <span className="text-sm font-bold">Title (optional)</span>
          <input name="title" maxLength={200} placeholder="Uses the file name if empty" className="mt-1 w-full rounded-xl border border-line px-4 py-2.5 outline-none focus:border-brand" />
        </label>
        <div className="flex gap-2">
          <Button type="submit" disabled={upload.isPending}>
            {upload.isPending ? 'Uploading…' : 'Upload and index'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        {upload.error && (
          <div className="w-full">
            <ErrorNote error={upload.error} />
          </div>
        )}
      </form>
    </Panel>
  );
}

function SearchTester() {
  const [query, setQuery] = useState('');
  const search = useMutation({
    mutationFn: (q: string) => api<KnowledgeSearchHit[]>('/knowledge/search', { method: 'POST', json: { query: q, limit: 4 } }),
  });
  return (
    <Panel className="self-start p-5">
      <h2 className="font-display text-lg font-semibold">Test a question</h2>
      <p className="mt-1 text-sm text-slate">See which sections the assistant would read before answering.</p>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) search.mutate(query);
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Do you take Cigna?"
          aria-label="Question to test"
          className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2 outline-none focus:border-brand"
        />
        <Button type="submit" disabled={search.isPending || !query.trim()}>
          Test
        </Button>
      </form>
      {search.error && <div className="mt-3"><ErrorNote error={search.error} /></div>}
      {search.data && (
        <ol className="mt-4 space-y-3">
          {search.data.length === 0 && <li className="text-sm text-slate">No matching sections. Add a document that answers this.</li>}
          {search.data.map((hit) => (
            <li key={hit.chunkId} className="rounded-xl bg-porcelain p-3 ring-1 ring-line">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-bold">{hit.documentTitle}</span>
                <span className="tabular-nums text-slate">{Math.round(hit.score * 100)}% match</span>
              </div>
              <p className="mt-1 line-clamp-4 text-sm whitespace-pre-line text-slate">{hit.content}</p>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
