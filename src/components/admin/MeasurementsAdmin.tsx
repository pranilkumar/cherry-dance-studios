'use client';

import { useEffect, useState, useCallback } from 'react';
import { FaRuler, FaCopy, FaCheck, FaSpinner, FaExternalLinkAlt } from 'react-icons/fa';

type Measurement = {
  id: string;
  event_slug: string;
  child_name: string;
  parent_name: string;
  phone: string;
  lehenga_waist: number;
  lehenga_length: number;
  blouse_upper_chest: number;
  blouse_full_chest: number;
  blouse_length: number;
  blouse_hem_round: number;
  blouse_shoulder: number;
  blouse_sleeve: number;
  blouse_arm_round: number;
  blouse_hip_round: number;
  submitted_at: string;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-CA', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function generateTailorMessage(slug: string, items: Measurement[]) {
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  let msg = `🧵 Cherry Dance Studios — Costume Measurements\n📅 ${date}\n🎪 Event: ${title}\n`;
  items.forEach((m, i) => {
    msg += `\n${i + 1}. Child: ${m.child_name}\n`;
    msg += `   Parent: ${m.parent_name} | ${m.phone}\n\n`;
    msg += `   LEHENGA\n`;
    msg += `   Waist Round: ${m.lehenga_waist}" | Waist to Floor: ${m.lehenga_length}"\n\n`;
    msg += `   BLOUSE\n`;
    msg += `   Upper Chest: ${m.blouse_upper_chest}" | Full Chest: ${m.blouse_full_chest}" | Hem Round: ${m.blouse_hem_round}"\n`;
    msg += `   Shoulder Width: ${m.blouse_shoulder}" | Sleeve Length: ${m.blouse_sleeve}" | Arm Round: ${m.blouse_arm_round}"\n`;
    msg += `   Blouse Length: ${m.blouse_length}" | Hip Round: ${m.blouse_hip_round}"`;
    if (i < items.length - 1) msg += '\n\n---';
  });
  return msg;
}

function EventPanel({ slug, siteUrl }: { slug: string; siteUrl: string }) {
  const [items, setItems]       = useState<Measurement[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [expanded, setExpanded] = useState(false);
  const [msg, setMsg]           = useState('');
  const [copied, setCopied]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/measurements?event=${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (res.ok) setItems(data.data ?? []);
      else setError(data.error || 'Failed to load.');
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const formUrl = `${siteUrl}/events/${slug}/measurements`;

  function genMsg() {
    const text = generateTailorMessage(slug, items);
    setMsg(text);
    setCopied(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: select the text
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded(x => !x)}
        className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-white/[0.02] transition"
      >
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">{title}</p>
          <p className="mt-0.5 text-xs text-white/40">/{slug}</p>
        </div>
        <div className="flex items-center gap-4">
          {loading
            ? <FaSpinner className="animate-spin text-white/30 text-sm" />
            : <span className="rounded-full bg-[#d1060f]/20 px-3 py-0.5 text-xs font-semibold text-[#ee2435]">
                {items.length} submission{items.length !== 1 ? 's' : ''}
              </span>
          }
          <span className="text-white/30 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/10 px-6 pb-6 pt-5 space-y-5">
          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60 hover:text-white transition"
            >
              Open form <FaExternalLinkAlt className="text-[10px]" />
            </a>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(formUrl); }}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60 hover:text-white transition"
            >
              Copy form link
            </button>
            {items.length > 0 && (
              <button
                type="button"
                onClick={genMsg}
                className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition"
                style={{ background: 'linear-gradient(135deg,#b00310,#d1060f,#ee2435)' }}
              >
                Generate Tailor Message
              </button>
            )}
          </div>

          {/* Error */}
          {error && <p className="text-xs text-[#ee2435]">{error}</p>}

          {/* Tailor message */}
          {msg && (
            <div className="rounded-xl border border-white/10 bg-[#0a0a0f] p-4">
              <pre className="whitespace-pre-wrap text-xs leading-relaxed text-white/75">{msg}</pre>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={copy}
                  className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/60 hover:text-white transition"
                >
                  {copied ? <><FaCheck className="text-green-400" /> Copied!</> : <><FaCopy /> Copy</>}
                </button>
              </div>
            </div>
          )}

          {/* Submissions list */}
          {!loading && items.length === 0 && (
            <p className="text-sm text-white/35">No submissions yet.</p>
          )}

          {items.length > 0 && (
            <div className="space-y-3">
              {items.map((m, i) => (
                <div key={m.id} className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
                  <div className="mb-3 flex justify-between items-start gap-2">
                    <div>
                      <p className="font-[family-name:var(--font-display)] text-base font-semibold text-white">
                        {i + 1}. {m.child_name}
                      </p>
                      <p className="text-xs text-white/45">{m.parent_name} · {m.phone}</p>
                    </div>
                    <p className="text-right text-xs text-white/30 flex-shrink-0">{fmtDate(m.submitted_at)}</p>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-3">
                    <div>
                      <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-[#B8872A]">Lehenga</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-white/55">
                        <span><b className="text-white/80">Waist Round</b> {m.lehenga_waist}"</span>
                        <span><b className="text-white/80">Waist to Floor</b> {m.lehenga_length}"</span>
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-[#B8872A]">Blouse</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-white/55">
                        <span><b className="text-white/80">Upper Chest</b> {m.blouse_upper_chest}"</span>
                        <span><b className="text-white/80">Full Chest</b> {m.blouse_full_chest}"</span>
                        <span><b className="text-white/80">Blouse Length</b> {m.blouse_length}"</span>
                        <span><b className="text-white/80">Hem Round</b> {m.blouse_hem_round}"</span>
                        <span><b className="text-white/80">Shoulder Width</b> {m.blouse_shoulder}"</span>
                        <span><b className="text-white/80">Sleeve</b> {m.blouse_sleeve}"</span>
                        <span><b className="text-white/80">Arm Round</b> {m.blouse_arm_round}"</span>
                        <span><b className="text-white/80">Hip Round</b> {m.blouse_hip_round}"</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MeasurementsAdmin() {
  const [slugInput, setSlugInput] = useState('');
  const [events, setEvents]       = useState<string[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cherrydancestudios.com';

  // Fetch all distinct event slugs that have submissions
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch('/api/measurements');
        const data = await res.json();
        if (res.ok && data.data) {
          const slugs = [...new Set<string>(data.data.map((m: Measurement) => m.event_slug))];
          setEvents(slugs);
        }
      } catch { /* ignore */ }
      finally { setLoadingAll(false); }
    })();
  }, []);

  function addSlug() {
    const s = slugInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (s && !events.includes(s)) setEvents(ev => [...ev, s]);
    setSlugInput('');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d1060f]/20">
          <FaRuler className="text-[#ee2435]" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
            Costume Measurements
          </h1>
          <p className="text-xs text-white/40">View submissions and generate tailor messages per event</p>
        </div>
      </div>

      {/* Add event slug */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <p className="mb-3 text-sm font-medium text-white/70">Add an event to view its measurements</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={slugInput}
            onChange={e => setSlugInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSlug()}
            placeholder="event-slug (e.g. diwali-2025)"
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#ee2435] focus:outline-none focus:ring-2 focus:ring-[#d1060f]/30"
          />
          <button
            type="button"
            onClick={addSlug}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#b00310,#d1060f,#ee2435)' }}
          >
            Add
          </button>
        </div>
        <p className="mt-2 text-xs text-white/30">
          The slug is the last part of the form URL. e.g. for
          <code className="mx-1 text-white/50">/events/diwali-2025/measurements</code>
          the slug is <code className="text-white/50">diwali-2025</code>
        </p>
      </div>

      {loadingAll && (
        <p className="flex items-center gap-2 text-sm text-white/40">
          <FaSpinner className="animate-spin" /> Loading…
        </p>
      )}

      {!loadingAll && events.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
          <p className="text-sm text-white/35">No events with measurements yet.</p>
          <p className="mt-1 text-xs text-white/25">
            Share a form URL like <code>/events/your-event-slug/measurements</code> with parents.
          </p>
        </div>
      )}

      {events.map(slug => (
        <EventPanel key={slug} slug={slug} siteUrl={siteUrl} />
      ))}
    </div>
  );
}
