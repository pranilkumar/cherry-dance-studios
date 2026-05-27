'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaCheckCircle, FaClock, FaExclamationTriangle, FaHistory } from 'react-icons/fa';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount || 0);

const formatDate = (dateString) => {
  if (!dateString) return '—';
  // Parse as local date to avoid timezone shift
  const [y, m, d] = dateString.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

// A fee is overdue only if its due date is strictly before today (midnight-to-midnight).
// Passing `today` (midnight) rather than `new Date()` prevents fees due *today*
// from being flagged as overdue before the day is even over.
const isOverdue = (fee, today) =>
  fee.payment_status !== 'paid' &&
  fee.due_date &&
  new Date(fee.due_date + 'T00:00:00') < today;

export default function PortalFees() {
  const [fees, setFees] = useState([]);
  const [studentNames, setStudentNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [noStudents, setNoStudents] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setLoading(false); return; }

      const { data: students } = await supabase
        .from('students')
        .select('id, student_name')
        .eq('email', user.email);

      if (!students || students.length === 0) {
        if (!cancelled) { setNoStudents(true); setLoading(false); }
        return;
      }

      const nameMap = {};
      students.forEach((s) => { nameMap[s.id] = s.student_name; });

      const { data: feesData } = await supabase
        .from('fees')
        .select('*')
        .in('student_id', students.map((s) => s.id))
        .order('due_date', { ascending: false });

      if (!cancelled) {
        setStudentNames(nameMap);
        setFees(feesData || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  // Only pending fees are relevant to the parent — paid = history, waived = hide entirely
  const pending     = fees.filter((f) => f.payment_status === 'pending');
  // Due today or earlier (or no due date) → actually owed now
  const outstanding = pending.filter((f) => !f.due_date || new Date(f.due_date + 'T00:00:00') <= today);
  // Due in the future → show as upcoming, not alarming
  const upcoming    = pending.filter((f) => f.due_date && new Date(f.due_date + 'T00:00:00') > today);
  const history     = fees.filter((f) => f.payment_status === 'paid');
  const totalOwed   = outstanding.reduce((s, f) => s + parseFloat(f.amount || 0), 0);
  const totalPaid   = history.reduce((s, f) => s + parseFloat(f.amount || 0), 0);

  return (
    <div className="p-6 md:p-8">
      <header className="mb-8">
        <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
          Portal · Fees
        </span>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
          Fees &amp; payments.
        </h1>
        <p className="mt-2 text-sm text-white/55">
          Your current balance and full payment history.
        </p>
      </header>

      {loading && (
        <div className="py-20 text-center text-sm text-white/40">Loading your fees…</div>
      )}

      {!loading && noStudents && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
          <p className="text-sm text-white/60">
            No dancer linked to this email yet. Contact Cherry or Pranil to get set up.
          </p>
        </div>
      )}

      {!loading && !noStudents && (
        <>
          {/* Summary cards */}
          <div className="mb-8 grid grid-cols-2 gap-4">
            <div className={`rounded-2xl border p-5 backdrop-blur-md ${
              totalOwed > 0
                ? 'border-[#d1060f]/30 bg-[#d1060f]/[0.06]'
                : 'border-white/10 bg-white/[0.03]'
            }`}>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/55">Outstanding</p>
              <p className={`mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tabular-nums ${
                totalOwed > 0 ? 'text-[#ee2435]' : 'text-white'
              }`}>
                {formatCurrency(totalOwed)}
              </p>
              <p className="mt-1 text-xs text-white/45">
                {outstanding.length === 0
                  ? upcoming.length > 0 ? `${upcoming.length} upcoming` : "You're all caught up 🎉"
                  : `${outstanding.length} payment${outstanding.length === 1 ? '' : 's'} due`}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/55">Total paid</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tabular-nums text-white">
                {formatCurrency(totalPaid)}
              </p>
              <p className="mt-1 text-xs text-white/45">{history.length} payment{history.length === 1 ? '' : 's'} recorded</p>
            </div>
          </div>

          {/* Outstanding fees */}
          {outstanding.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                Outstanding
              </h2>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                {outstanding.map((fee, i) => {
                  const overdue = isOverdue(fee, today);
                  return (
                    <div
                      key={fee.id}
                      className={`flex items-center justify-between gap-4 px-5 py-4 ${
                        i < outstanding.length - 1 ? 'border-b border-white/8' : ''
                      } ${overdue ? 'bg-[#d1060f]/[0.04]' : ''}`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {overdue
                            ? <FaExclamationTriangle className="shrink-0 text-[10px] text-[#ee2435]" />
                            : <FaClock className="shrink-0 text-[10px] text-white/45" />}
                          <span className="text-sm font-medium text-white">{fee.fee_type}</span>
                          {studentNames[fee.student_id] && (
                            <span className="text-xs text-white/45">· {studentNames[fee.student_id]}</span>
                          )}
                        </div>
                        <p className={`mt-0.5 text-xs ${overdue ? 'text-[#ee2435]' : 'text-white/55'}`}>
                          {overdue ? 'Overdue · was due ' : 'Due '}{formatDate(fee.due_date)}
                        </p>
                        {fee.notes && (
                          <p className="mt-0.5 text-xs text-white/35 italic">{fee.notes}</p>
                        )}
                      </div>
                      <span className="shrink-0 font-[family-name:var(--font-display)] text-lg font-bold tabular-nums text-white">
                        {formatCurrency(fee.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Upcoming fees */}
          {upcoming.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                Upcoming
              </h2>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                {upcoming.map((fee, i) => (
                  <div
                    key={fee.id}
                    className={`flex items-center justify-between gap-4 px-5 py-4 ${
                      i < upcoming.length - 1 ? 'border-b border-white/8' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FaClock className="shrink-0 text-[10px] text-white/35" />
                        <span className="text-sm font-medium text-white/70">{fee.fee_type}</span>
                        {studentNames[fee.student_id] && (
                          <span className="text-xs text-white/35">· {studentNames[fee.student_id]}</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-white/40">Due {formatDate(fee.due_date)}</p>
                      {fee.notes && (
                        <p className="mt-0.5 text-xs text-white/30 italic">{fee.notes}</p>
                      )}
                    </div>
                    <span className="shrink-0 font-[family-name:var(--font-display)] text-lg font-bold tabular-nums text-white/55">
                      {formatCurrency(fee.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* How to pay — always visible so parents know how to reach us */}
          <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              How to pay
            </h2>
            <div className="space-y-2 text-sm text-white/75">
              <p>
                <span className="font-semibold text-white">E-transfer</span>{' '}
                — send to{' '}
                <a href="mailto:cherrydancestudio.cds@gmail.com" className="text-[#ee2435] hover:underline">
                  cherrydancestudio.cds@gmail.com
                </a>
                {' '}and include your dancer&rsquo;s name in the message.
              </p>
              <p>
                <span className="font-semibold text-white">Cash</span>{' '}
                — hand it to Cherry or Pranil at the studio.
              </p>
              <p>
                <span className="font-semibold text-white">Questions?</span>{' '}
                <a href="https://wa.me/16138903789" className="text-[#ee2435] hover:underline" target="_blank" rel="noreferrer">
                  WhatsApp us at 613-890-3789
                </a>
              </p>
            </div>
          </section>

          {/* Payment history */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              <FaHistory className="text-[10px]" /> Payment history
            </h2>
            {history.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-white/45">
                No payments recorded yet.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                {history.map((fee, i) => (
                  <div
                    key={fee.id}
                    className={`flex items-center justify-between gap-4 px-5 py-4 ${
                      i < history.length - 1 ? 'border-b border-white/8' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FaCheckCircle className="shrink-0 text-[10px] text-white/55" />
                        <span className="text-sm font-medium text-white">{fee.fee_type}</span>
                        {studentNames[fee.student_id] && (
                          <span className="text-xs text-white/45">· {studentNames[fee.student_id]}</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-white/45">
                        Paid {formatDate(fee.payment_date)}
                        {fee.payment_method && ` · ${fee.payment_method.replace('_', ' ')}`}
                      </p>
                      {fee.notes && (
                        <p className="mt-0.5 text-xs text-white/30 italic">{fee.notes}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-[family-name:var(--font-display)] text-lg font-bold tabular-nums text-white">
                        {formatCurrency(fee.amount)}
                      </span>
                      <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#0a0a0f]">
                        <FaCheckCircle className="text-[8px]" /> Paid
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
