'use client';

import { useEffect, useRef, useState } from 'react';
import { FaPlay, FaPause, FaMusic, FaLock, FaUsers, FaDownload } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';

function fmtTime(s) {
  if (!s || isNaN(s) || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Full-featured audio player card for a single mix.
 * Pause-others logic: when play is pressed, all other <audio> elements on the
 * page are paused so only one mix plays at a time.
 */
function AudioCard({ mix }) {
  const audioRef = useRef(null);
  const [playing, setPlaying]     = useState(false);
  const [current, setCurrent]     = useState(0);
  const [duration, setDuration]   = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Fetch the file as a blob so the browser downloads it instead of
      // opening it in a new tab (required for cross-origin Supabase Storage URLs).
      const res = await fetch(mix.file_url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      // Use original filename if stored, otherwise derive from title.
      a.download = mix.file_name || `${mix.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(mix.file_url, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime    = () => setCurrent(a.currentTime);
    const onMeta    = () => setDuration(a.duration);
    const onEnd     = () => { setPlaying(false); setCurrent(0); };
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    // If another tab/component pauses this element externally
    const onPause   = () => setPlaying(false);
    a.addEventListener('timeupdate',    onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended',         onEnd);
    a.addEventListener('waiting',       onWaiting);
    a.addEventListener('playing',       onPlaying);
    a.addEventListener('pause',         onPause);
    return () => {
      a.removeEventListener('timeupdate',     onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended',          onEnd);
      a.removeEventListener('waiting',        onWaiting);
      a.removeEventListener('playing',        onPlaying);
      a.removeEventListener('pause',          onPause);
    };
  }, []);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      // setPlaying handled by 'pause' event
    } else {
      // Pause every other audio element first
      document.querySelectorAll('audio').forEach((el) => { if (el !== a) el.pause(); });
      await a.play();
      setPlaying(true);
    }
  };

  const seek = (e) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect  = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * duration;
    setCurrent(a.currentTime);
  };

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md transition hover:border-white/15">
      <audio ref={audioRef} src={mix.file_url} preload="metadata" />

      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl transition ${
              playing ? 'bg-[#d1060f] text-white' : 'bg-white/8 text-white/50'
            }`}
          >
            <FaMusic className="text-sm" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-white">
              {mix.title}
            </p>
            {mix.description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-white/55">{mix.description}</p>
            )}
          </div>
        </div>

        {/* Audience badge + download */}
        <div className="mt-0.5 flex flex-shrink-0 items-center gap-2">
          {mix.batch ? (
            <span className="flex items-center gap-1 rounded-full border border-[#d1060f]/25 bg-[#d1060f]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#ee2435]">
              <FaLock className="text-[8px]" />
              {mix.batch.name}
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
              <FaUsers className="text-[8px]" />
              All students
            </span>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            title="Download mix"
            className="grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white/50 transition hover:border-white/30 hover:text-white disabled:opacity-50"
          >
            {downloading
              ? <span className="inline-block h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
              : <FaDownload className="text-[10px]" />}
          </button>
        </div>
      </div>

      {/* Player */}
      <div className="mt-5 flex items-center gap-4">
        {/* Play / pause button */}
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
          className="relative grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-[#d1060f] text-white shadow-[0_4px_20px_rgba(209,6,15,0.35)] transition hover:bg-[#b00310] active:scale-95"
        >
          {buffering ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : playing ? (
            <FaPause className="text-sm" />
          ) : (
            <FaPlay className="text-sm ml-0.5" />
          )}
        </button>

        {/* Progress */}
        <div className="flex-1 space-y-2">
          {/* Track bar */}
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            onClick={seek}
            className="group relative h-2 cursor-pointer overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#d1060f] to-[#ee2435] transition-[width] duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Time */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-white/40 tabular-nums">{fmtTime(current)}</span>
            <span className="text-[10px] text-white/25">{fmtDate(mix.created_at)}</span>
            <span className="font-mono text-[10px] text-white/40 tabular-nums">{fmtTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PortalAudio() {
  const [mixes, setMixes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasBatch, setHasBatch] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      // Fetch the parent's students to get their batch IDs
      const { data: students } = await supabase
        .from('students')
        .select('class_batch_id')
        .eq('email', user.email)
        .eq('status', 'active');

      if (cancelled) return;

      const batchIds = (students || [])
        .map((s) => s.class_batch_id)
        .filter(Boolean);

      setHasBatch(batchIds.length > 0);

      // Build query:
      // Show mixes that are is_public=true AND either:
      //   - have no batch (all-students mixes), or
      //   - belong to one of this parent's batches
      let query = supabase
        .from('audio_mixes')
        .select('*, batch:class_batches(id, name, tier)')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (batchIds.length > 0) {
        query = query.or(`batch_id.is.null,batch_id.in.(${batchIds.join(',')})`);
      } else {
        query = query.is('batch_id', null);
      }

      const { data } = await query;
      if (!cancelled) {
        setMixes(data || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Split into batch-specific and general
  const batchMixes   = mixes.filter((m) => m.batch_id);
  const generalMixes = mixes.filter((m) => !m.batch_id);

  return (
    <div className="p-6 md:p-8">
      <header className="mb-8">
        <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
          Portal · Audio
        </span>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
          Audio mixes.
        </h1>
        <p className="mt-2 text-sm text-white/55">
          {loading
            ? 'Loading your tracks…'
            : mixes.length > 0
            ? 'Practice tracks and routines shared by your instructors.'
            : 'No tracks shared yet — check back after your next class.'}
        </p>
      </header>

      {loading && (
        <div className="py-16 text-center text-sm text-white/35">Loading…</div>
      )}

      {!loading && mixes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
          <FaMusic className="mx-auto mb-4 text-3xl text-white/15" />
          <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-white">
            Nothing here yet.
          </p>
          <p className="mt-2 text-sm text-white/45">
            Cherry and Pranil will share practice mixes here once your class is underway.
          </p>
        </div>
      )}

      {!loading && mixes.length > 0 && (
        <div className="space-y-10">
          {/* Batch-specific mixes */}
          {batchMixes.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                <FaLock className="text-[10px] text-[#ee2435]" />
                Your class
              </h2>
              <div className="space-y-3">
                {batchMixes.map((mix) => (
                  <AudioCard key={mix.id} mix={mix} />
                ))}
              </div>
            </section>
          )}

          {/* General mixes */}
          {generalMixes.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                <FaUsers className="text-[10px]" />
                For all students
              </h2>
              <div className="space-y-3">
                {generalMixes.map((mix) => (
                  <AudioCard key={mix.id} mix={mix} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <p className="mt-10 text-xs text-white/30">
        Practice tip: use headphones for the best experience. Questions?{' '}
        <a href="https://wa.me/16138903789" className="text-white/45 hover:text-white">
          WhatsApp us.
        </a>
      </p>
    </div>
  );
}
