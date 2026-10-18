'use client';

import type { KnowledgeDocument, KnowledgeSearchHit, Paginated } from '@smilecare/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Button, DocumentBadge, EmptyState, ErrorNote, PageHeader, Panel, Skeleton, fieldClass, textareaClass } from '@/components/admin/ui';
import { FileIcon } from '@/components/icons';
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
        description="Sunny only answers from these documents. Keep prices, hours and policies here up to date."
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
                  <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-pearl text-azure-600">
                    <FileIcon size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{d.title}</p>
                    <p className="text-sm text-ink-500">
                      {d.sourceType.toUpperCase()} · {d.chunkCount} sections · updated {timeAgo(d.updatedAt)}
                    </p>
                    {d.error && <p className="mt-1 text-sm text-danger-ink">{d.error}</p>}
                  </div>
                  <DocumentBadge status={d.status} />
                  <div className="flex gap-1">
                    <Button variant="ghost" disabled={reindex.isPending} onClick={() => reindex.mutate(d.id)}>
                      Re-index
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={remove.isPending}
                      onClick={() => confirm(`Delete “${d.title}”? Sunny will stop using it immediately.`) && remove.mutate(d.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No documents yet">Add your price list, opening hours and FAQs so Sunny can answer questions.</EmptyState>
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
          <input name="title" required minLength={2} maxLength={200} placeholder="Holiday opening hours" className={fieldClass} />
        </label>
        <label className="block">
          <span className="text-sm font-bold">Content</span>
          <textarea
            name="content"
            required
            rows={8}
            placeholder={'# Holiday hours\n\nWe are closed on December 25 and January 1.'}
            className={`${textareaClass} font-mono text-sm`}
          />
          <span className="mt-1 block text-sm text-ink-500">Markdown headings (# Heading) help Sunny find the right section.</span>
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
            className="mt-1.5 block w-full text-sm file:mr-3 file:h-10 file:rounded-full file:border-0 file:bg-azure-50 file:px-4 file:font-bold file:text-azure-700"
          />
        </label>
        <label className="block min-w-60 flex-1">
          <span className="text-sm font-bold">Title (optional)</span>
          <input name="title" maxLength={200} placeholder="Uses the file name if empty" className={fieldClass} />
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
      <h2 className="font-display text-xl font-bold">Test a question</h2>
      <p className="mt-1 text-sm text-ink-500">See which sections Sunny would read before answering.</p>
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
          className="h-11 min-w-0 flex-1 rounded-full border-[1.5px] border-line-strong px-4 outline-none focus:border-azure-600"
        />
        <Button type="submit" disabled={search.isPending || !query.trim()}>
          Test
        </Button>
      </form>
      {search.error && <div className="mt-3"><ErrorNote error={search.error} /></div>}
      {search.data && (
        <ol className="mt-4 space-y-3">
          {search.data.length === 0 && <li className="text-sm text-ink-500">No matching sections. Add a document that answers this.</li>}
          {search.data.map((hit) => (
            <li key={hit.chunkId} className="rounded-2xl bg-pearl p-3.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-bold">{hit.documentTitle}</span>
                <span className="tabular-nums text-ink-500">{Math.round(hit.score * 100)}% match</span>
              </div>
              <p className="mt-1 line-clamp-4 text-sm whitespace-pre-line text-ink-500">{hit.content}</p>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
