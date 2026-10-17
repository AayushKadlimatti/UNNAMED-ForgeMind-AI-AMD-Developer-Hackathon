import { useState } from 'react';
import { api } from '../api/connected';

const input = 'master-input';
const button = 'master-button master-secondary';

export default function KnowledgePanel({ user }) {
  const [query, setQuery] = useState('motor vibration bearing');
  const [matches, setMatches] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: '', source: '', source_url: '', text: '' });
  async function search(e) {
    e.preventDefault(); setBusy(true); setMessage('');
    try { setMatches((await api(`/api/documents/search?q=${encodeURIComponent(query)}`)).matches); }
    catch (err) { setMessage(err.message); }
    finally { setBusy(false); }
  }
  async function save(e) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      await api('/api/documents', { method: 'POST', body: JSON.stringify({ ...form, source_url: form.source_url || null }) });
      setForm({ title: '', source: '', source_url: '', text: '' });
      setMessage('Reference saved. Relevant excerpts will accompany future AMD requests.');
    } catch (err) { setMessage(err.message); }
    finally { setBusy(false); }
  }
  return <section className="p-5 rounded-xl border border-[#374151] bg-[#111827] space-y-4">
    <h2 className="text-lg font-semibold">Maintenance reference library</h2>
    <p className="text-sm text-gray-400">Add a relevant manual excerpt or maintenance note with its source and revision. Documents are user-supplied and not independently verified. Excerpts matched to an investigation are sent to AMD; add only material your team may share with that service.</p>
    {!user ? <p>Connect a demo role in Settings to search or add references.</p> : <>
      <form className="flex flex-wrap gap-2" onSubmit={search}><label className="flex-1 text-sm">Search references<input className={input} value={query} onChange={e => setQuery(e.target.value)} required maxLength={1000} /></label><button className={button} disabled={busy}>Search</button></form>
      {matches?.length === 0 && <p>No matching references. Add a source excerpt below or try other search terms.</p>}
      {matches?.map(match => <article className="border border-[#374151] p-3 rounded-md space-y-2" key={match.excerpt_id}><h3 className="font-semibold">{match.title}</h3><p className="text-xs text-gray-400">{match.source} · User-supplied</p><p className="text-sm whitespace-pre-wrap">{match.excerpt}</p>{match.source_url && <a className="text-[#06B6D4] underline" href={match.source_url} target="_blank" rel="noreferrer">Open source</a>}</article>)}
      {user.role === 'admin' && <details><summary className="cursor-pointer text-[#06B6D4]">Add a document excerpt</summary><form className="space-y-3 mt-3" onSubmit={save}>
        {[['title', 'Document title', 200], ['source', 'Revision, page or source description', 500], ['source_url', 'Source URL (optional)', 2000]].map(([key, label, max]) => <label className="block text-sm" key={key}>{label}<input className={input} type={key === 'source_url' ? 'url' : 'text'} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required={key !== 'source_url'} maxLength={max} /></label>)}
        <label className="block text-sm">Reference text<textarea className={input} rows={6} value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} minLength={20} maxLength={20000} required /></label>
        <button className={button} disabled={busy}>Save reference</button>
      </form></details>}
    </>}
    {message && <p role="status" className="text-sm text-[#F59E0B]">{message}</p>}
  </section>;
}
