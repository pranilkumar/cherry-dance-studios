'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  FaDollarSign, FaCheckCircle, FaClock, FaExclamationTriangle,
  FaCalendarAlt, FaSearch, FaMoneyBillWave, FaHistory, FaTimes,
  FaEdit, FaBell, FaLayerGroup, FaUndo,
} from 'react-icons/fa';

const inputCls =
  'w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[#ee2435] focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-[#d1060f]/25';
const selectChevron =
  "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23ffffff%22 stroke-width=%221.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_0.65rem_center] bg-no-repeat pr-9";

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount || 0);

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function FeeManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [paymentModal, setPaymentModal] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentData, setPaymentData] = useState({
    amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'cash', notes: '',
  });
  const [sendReceipt, setSendReceipt] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editModal, setEditModal] = useState(null);      // fee object being edited
  const [editData, setEditData] = useState({});
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState({ amount: '100', feeType: 'Monthly fee', dueDate: '' });
  const [isBulking, setIsBulking] = useState(false);
  const [reminderModal, setReminderModal] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [alert, setAlert] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState({ totalIncome: 0, paidCount: 0, pendingCount: 0, overdueCount: 0 });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchData();
    setBulkData((p) => ({ ...p, dueDate: `${monthFilter}-15` }));
  }, [monthFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: studentsData, error: sErr } = await supabase
        .from('students').select('*').eq('status', 'active').order('student_name');
      if (sErr) throw sErr;

      const startOfMonth = `${monthFilter}-01`;
      // Compute last day using local-time Date constructor (avoids UTC-parse timezone shift).
      const [y, m] = monthFilter.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate(); // new Date(y, m, 0) = last day of month m in local time
      const endDate = `${monthFilter}-${String(lastDay).padStart(2, '0')}`;

      const { data: feesData, error: fErr } = await supabase
        .from('fees').select('*').gte('due_date', startOfMonth).lte('due_date', endDate);
      if (fErr) throw fErr;

      const studentsWithFees = (studentsData || []).map((student) => {
        const allFees = feesData?.filter((f) => f.student_id === student.id) || [];
        // If duplicates exist, prefer the paid record so the row reflects reality.
        const fee = allFees.find((f) => f.payment_status === 'paid') ?? allFees[0];
        return {
          ...student, fee,
          feeStatus: fee ? fee.payment_status : 'not_created',
          amount: fee?.amount || 0,
          dueDate: fee?.due_date,
          paymentDate: fee?.payment_date,
        };
      });

      setStudents(studentsWithFees);

      setMonthlyStats({
        totalIncome: feesData?.filter((f) => f.payment_status === 'paid')
          .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0) || 0,
        paidCount: feesData?.filter((f) => f.payment_status === 'paid').length || 0,
        pendingCount: feesData?.filter((f) => f.payment_status === 'pending').length || 0,
        overdueCount: feesData?.filter((f) => f.payment_status === 'pending' && f.due_date && new Date(f.due_date) < new Date()).length || 0,
      });
    } catch (err) {
      showAlert('error', err.message || 'Failed to load fee data');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => students.filter((s) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      (s.student_name || '').toLowerCase().includes(term) ||
      (s.parent_name || '').toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || s.feeStatus === statusFilter;
    return matchesSearch && matchesStatus;
  }), [students, searchTerm, statusFilter]);

  const openPayment = (student) => {
    setPaymentData({
      amount: student.amount || '100',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      notes: '',
    });
    setSendReceipt(!!student.email);
    setPaymentModal(student);
  };

  const submitPayment = async () => {
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      return showAlert('error', 'Please enter a valid amount.');
    }
    setIsSubmitting(true);
    try {
      const feeType = paymentModal.fee?.fee_type || 'Monthly Fee';

      if (!paymentModal.fee) {
        const { error } = await supabase.from('fees').insert([{
          student_id: paymentModal.id, fee_type: feeType, amount: paymentData.amount,
          due_date: `${monthFilter}-15`, payment_status: 'paid', payment_date: paymentData.payment_date,
          payment_method: paymentData.payment_method, notes: paymentData.notes,
        }]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('fees').update({
          payment_status: 'paid', payment_date: paymentData.payment_date,
          payment_method: paymentData.payment_method, amount: paymentData.amount, notes: paymentData.notes,
        }).eq('id', paymentModal.fee.id);
        if (error) throw error;
      }

      // Send receipt email if the parent has an email and the checkbox is on.
      let emailNote = '';
      if (sendReceipt && paymentModal.email) {
        try {
          const res = await fetch('/api/send-payment-receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: paymentModal.email,
              emailSecondary: paymentModal.email_secondary || null,
              studentName: paymentModal.student_name,
              parentName: paymentModal.parent_name,
              amount: parseFloat(paymentData.amount),
              feeType,
              paymentDate: paymentData.payment_date,
              paymentMethod: paymentData.payment_method,
            }),
          });
          emailNote = res.ok ? ` Receipt sent to ${paymentModal.email}.` : ' (receipt email failed)';
        } catch {
          emailNote = ' (receipt email failed)';
        }
      }

      showAlert('success', `Payment recorded.${emailNote}`);
      setPaymentModal(null);
      fetchData();
    } catch (err) {
      console.error('[fees] submitPayment error:', err);
      showAlert('error', err.message || 'Failed to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openHistory = async (student) => {
    try {
      const { data, error } = await supabase
        .from('fees').select('*').eq('student_id', student.id).order('due_date', { ascending: false });
      if (error) throw error;
      setPaymentHistory(data || []);
      setHistoryModal(student);
    } catch (err) {
      showAlert('error', err.message || 'Failed to load history');
    }
  };

  // ── Bulk fee creation ───────────────────────────────────────────────
  const createBulkFees = async () => {
    const withoutFee = students.filter((s) => s.feeStatus === 'not_created');
    if (withoutFee.length === 0) {
      return showAlert('error', 'All active students already have a fee for this month.');
    }
    setIsBulking(true);
    try {
      const inserts = withoutFee.map((s) => ({
        student_id: s.id,
        fee_type: bulkData.feeType,
        amount: parseFloat(bulkData.amount),
        due_date: bulkData.dueDate,
        payment_status: 'pending',
      }));
      const { error } = await supabase.from('fees').insert(inserts);
      if (error) throw error;
      showAlert('success', `Created ${inserts.length} fees for ${monthFilter}.`);
      setBulkModal(false);
      fetchData();
    } catch (err) {
      showAlert('error', err.message || 'Failed to create fees.');
    } finally {
      setIsBulking(false);
    }
  };

  // ── Edit existing fee ────────────────────────────────────────────────
  const openEdit = (student) => {
    const fee = student.fee;
    if (!fee) return;
    setEditData({
      amount: fee.amount?.toString() || '',
      fee_type: fee.fee_type || 'Monthly fee',
      due_date: fee.due_date || '',
      notes: fee.notes || '',
    });
    setEditModal(student);
  };

  const submitEdit = async () => {
    if (!editModal?.fee?.id) return;
    try {
      const { error } = await supabase.from('fees').update({
        amount: parseFloat(editData.amount),
        fee_type: editData.fee_type,
        due_date: editData.due_date,
        notes: editData.notes || null,
      }).eq('id', editModal.fee.id);
      if (error) throw error;
      showAlert('success', 'Fee updated.');
      setEditModal(null);
      fetchData();
    } catch (err) {
      showAlert('error', err.message || 'Failed to update fee.');
    }
  };

  // ── Mark unpaid (undo) ───────────────────────────────────────────────
  const markUnpaid = async (student) => {
    if (!student?.fee?.id) return;
    try {
      const { error } = await supabase.from('fees').update({
        payment_status: 'pending',
        payment_date: null,
        payment_method: null,
      }).eq('id', student.fee.id);
      if (error) throw error;
      showAlert('success', `${student.student_name} marked as unpaid.`);
      fetchData();
    } catch (err) {
      showAlert('error', err.message || 'Failed to mark unpaid.');
    }
  };

  // ── Overdue reminders ────────────────────────────────────────────────
  const overdueStudents = students.filter(
    (s) => s.feeStatus === 'pending' && s.dueDate && new Date(s.dueDate + 'T00:00:00') < new Date()
  );

  const sendOverdueReminders = async () => {
    setIsSendingReminders(true);
    let sent = 0, failed = 0;
    for (const s of overdueStudents) {
      if (!s.email) { failed++; continue; }
      try {
        const res = await fetch('/api/send-overdue-reminder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: s.email,
            emailSecondary: s.email_secondary || null,
            studentName: s.student_name,
            parentName: s.parent_name,
            amount: s.amount,
            feeType: s.fee?.fee_type || 'Monthly fee',
            dueDate: s.dueDate,
          }),
        });
        if (res.ok) sent++; else failed++;
      } catch { failed++; }
    }
    setIsSendingReminders(false);
    setReminderModal(false);
    showAlert(
      failed === 0 ? 'success' : 'error',
      failed === 0
        ? `Reminders sent to ${sent} parent${sent === 1 ? '' : 's'}.`
        : `Sent ${sent}, failed ${failed}. Check that all students have emails on file.`
    );
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    // Errors stay until manually dismissed; success auto-clears after 4s.
    if (type === 'success') setTimeout(() => setAlert(null), 4000);
  };

  const getStatusInfo = (student) => {
    if (student.feeStatus === 'paid') {
      return { label: 'Paid', bg: '#ffffff', fg: '#0a0a0f', icon: FaCheckCircle };
    }
    if (student.feeStatus === 'pending') {
      const overdue = student.dueDate && new Date(student.dueDate) < new Date();
      return overdue
        ? { label: 'Overdue', bg: '#d1060f', fg: '#ffffff', icon: FaExclamationTriangle }
        : { label: 'Pending', bg: 'rgba(209,6,15,0.18)', fg: '#ee2435', icon: FaClock };
    }
    return { label: 'Not set', bg: 'rgba(255,255,255,0.08)', fg: 'rgba(255,255,255,0.55)', icon: FaClock };
  };

  return (
    <div className="p-6 md:p-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
            Fees
          </span>
          <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
            Monthly tracker.
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Mark payments, see history, spot overdues.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {overdueStudents.length > 0 && (
            <button
              type="button"
              onClick={() => setReminderModal(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#d1060f]/50 bg-[#d1060f]/15 px-3.5 py-2 text-xs font-medium text-[#ee2435] hover:bg-[#d1060f]/25"
            >
              <FaBell className="text-[10px]" />
              Send reminders ({overdueStudents.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => setBulkModal(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/85 hover:border-white/30"
          >
            <FaLayerGroup className="text-[10px]" />
            Create this month&rsquo;s fees
          </button>
          <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5">
            <FaCalendarAlt className="text-xs text-[#ee2435]" />
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="border-0 bg-transparent text-sm text-white focus:outline-none [color-scheme:dark]"
            />
          </div>
        </div>
      </header>

      {alert && (
        <div
          className={`mb-5 flex items-center justify-between rounded-xl border px-4 py-3 text-sm backdrop-blur-md ${
            alert.type === 'success'
              ? 'border-white/15 bg-white/[0.06] text-white'
              : 'border-[#d1060f]/30 bg-[#d1060f]/10 text-[#ee2435]'
          }`}
        >
          <span>{alert.message}</span>
          <button onClick={() => setAlert(null)} className="ml-3 opacity-65 hover:opacity-100">
            <FaTimes className="text-xs" />
          </button>
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={FaDollarSign}          label="Total income" value={formatCurrency(monthlyStats.totalIncome)} sub={`${monthlyStats.paidCount} payments`} />
        <StatCard icon={FaCheckCircle}         label="Paid"         value={monthlyStats.paidCount}    sub={`of ${students.length} active`} />
        <StatCard icon={FaClock}               label="Pending"      value={monthlyStats.pendingCount} sub="yet to pay" featured />
        <StatCard icon={FaExclamationTriangle} label="Overdue"      value={monthlyStats.overdueCount} sub="needs attention" featured />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/40" />
          <input
            type="text"
            placeholder="Search student or parent…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { v: 'all', label: `All (${students.length})` },
            { v: 'paid', label: `Paid (${monthlyStats.paidCount})` },
            { v: 'pending', label: `Pending (${monthlyStats.pendingCount})` },
            { v: 'not_created', label: 'Not set' },
          ].map((f) => (
            <button
              key={f.v}
              type="button"
              onClick={() => setStatusFilter(f.v)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                statusFilter === f.v
                  ? 'border-[#d1060f] bg-[#d1060f] text-white'
                  : 'border-white/15 bg-white/5 text-white/80 hover:border-white/30'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs font-medium text-white/55">
          {filtered.length} student{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-white/40">Loading fees…</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-white/55">No students match this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/8 bg-white/[0.04] text-xs uppercase tracking-wider text-white/45">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Student</th>
                  <th className="px-5 py-3 text-left font-medium">Parent</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 text-left font-medium">Due</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Paid on</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {filtered.map((student) => {
                  const info = getStatusInfo(student);
                  const Icon = info.icon;
                  return (
                    <tr key={student.id} className="hover:bg-white/[0.04]">
                      <td className="px-5 py-3">
                        <div className="font-medium text-white">{student.student_name}</div>
                        <div className="text-xs text-white/55">{student.preferred_class || 'No class'}</div>
                      </td>
                      <td className="px-5 py-3 text-white/80">{student.parent_name}</td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {student.amount > 0
                          ? <span className="font-semibold text-white">{formatCurrency(student.amount)}</span>
                          : <span className="text-white/35">Not set</span>}
                      </td>
                      <td className="px-5 py-3 text-xs text-white/65">{formatDate(student.dueDate)}</td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                          style={{ background: info.bg, color: info.fg }}
                        >
                          <Icon className="text-[8px]" />
                          {info.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {student.feeStatus === 'paid'
                          ? <span className="font-semibold text-white">{formatDate(student.paymentDate)}</span>
                          : <span className="text-white/35">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {student.feeStatus !== 'paid' && (
                            <button
                              type="button"
                              onClick={() => openPayment(student)}
                              className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white px-2.5 py-1 text-xs font-medium text-[#0a0a0f] hover:bg-white/90"
                            >
                              <FaCheckCircle className="text-[10px]" /> Mark paid
                            </button>
                          )}
                          {student.feeStatus === 'paid' && (
                            <button
                              type="button"
                              onClick={() => markUnpaid(student)}
                              title="Undo — mark as unpaid"
                              className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-white/60 hover:border-white/30 hover:text-white/85"
                            >
                              <FaUndo className="text-[10px]" /> Undo
                            </button>
                          )}
                          {student.fee && (
                            <button
                              type="button"
                              onClick={() => openEdit(student)}
                              className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-white/85 hover:border-white/30"
                            >
                              <FaEdit className="text-[10px]" /> Edit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openHistory(student)}
                            className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-white/85 hover:border-white/30"
                          >
                            <FaHistory className="text-[10px]" /> History
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {paymentModal && (
        <Modal title={<><FaMoneyBillWave className="inline -mt-0.5 mr-2 text-[#ee2435]" /> Record payment</>} onClose={() => setPaymentModal(null)}>
          <div className="mb-5 rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3">
            <strong className="text-base text-white">{paymentModal.student_name}</strong>
            <div className="text-xs text-white/55">Parent: {paymentModal.parent_name}</div>
          </div>

          <div className="space-y-4">
            <Field label="Amount (CAD)" required>
              <input type="number" step="0.01" value={paymentData.amount}
                onChange={(e) => setPaymentData((p) => ({ ...p, amount: e.target.value }))}
                placeholder="Enter amount" className={inputCls} />
            </Field>

            <Grid2>
              <Field label="Payment date" required>
                <input type="date" value={paymentData.payment_date}
                  onChange={(e) => setPaymentData((p) => ({ ...p, payment_date: e.target.value }))}
                  className={`${inputCls} [color-scheme:dark]`} />
              </Field>
              <Field label="Method">
                <select value={paymentData.payment_method}
                  onChange={(e) => setPaymentData((p) => ({ ...p, payment_method: e.target.value }))}
                  className={`${inputCls} ${selectChevron}`}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="e-transfer">E-Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </Field>
            </Grid2>

            <Field label="Notes (optional)">
              <textarea rows={3} value={paymentData.notes}
                onChange={(e) => setPaymentData((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Anything to remember?" className={`${inputCls} resize-none`} />
            </Field>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3">
            <input
              id="send-receipt"
              type="checkbox"
              checked={sendReceipt}
              onChange={(e) => setSendReceipt(e.target.checked)}
              disabled={!paymentModal.email}
              className="h-4 w-4 cursor-pointer accent-[#d1060f]"
            />
            <label htmlFor="send-receipt" className="cursor-pointer text-sm text-white/70">
              Send receipt to parent
              {paymentModal.email
                ? <span className="ml-1.5 text-white/40">({paymentModal.email})</span>
                : <span className="ml-1.5 text-white/35">(no email on file)</span>}
            </label>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3 border-t border-white/8 pt-4">
            <button type="button" onClick={() => setPaymentModal(null)}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:border-white/30">
              Cancel
            </button>
            <button type="button" onClick={submitPayment} disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#d1060f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b00310] disabled:opacity-60 disabled:cursor-not-allowed">
              <FaCheckCircle className="text-xs" />
              {isSubmitting ? 'Saving…' : 'Record payment'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Bulk fee creation modal ── */}
      {bulkModal && (
        <Modal title={<><FaLayerGroup className="inline -mt-0.5 mr-2 text-[#ee2435]" />Create fees for {monthFilter}</>} onClose={() => setBulkModal(false)}>
          <p className="mb-5 text-sm text-white/60">
            Creates a <strong className="text-white">pending</strong> fee for every active student who doesn&rsquo;t have one this month.{' '}
            <span className="text-white/45">({students.filter((s) => s.feeStatus === 'not_created').length} student{students.filter((s) => s.feeStatus === 'not_created').length === 1 ? '' : 's'} will be billed.)</span>
          </p>
          <div className="space-y-4">
            <Grid2>
              <Field label="Amount (CAD)" required>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/45">$</span>
                  <input type="number" min="0" step="0.01" value={bulkData.amount}
                    onChange={(e) => setBulkData((p) => ({ ...p, amount: e.target.value }))}
                    className={`${inputCls} pl-7`} />
                </div>
              </Field>
              <Field label="Due date" required>
                <input type="date" value={bulkData.dueDate}
                  onChange={(e) => setBulkData((p) => ({ ...p, dueDate: e.target.value }))}
                  className={`${inputCls} [color-scheme:dark]`} />
              </Field>
            </Grid2>
            <Field label="Fee type">
              <select value={bulkData.feeType}
                onChange={(e) => setBulkData((p) => ({ ...p, feeType: e.target.value }))}
                className={`${inputCls} ${selectChevron}`}>
                <option value="Monthly fee">Monthly fee</option>
                <option value="Annual fee">Annual fee</option>
                <option value="Registration fee">Registration fee</option>
                <option value="Other">Other</option>
              </select>
            </Field>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/8 pt-4">
            <button type="button" onClick={() => setBulkModal(false)}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:border-white/30">
              Cancel
            </button>
            <button type="button" onClick={createBulkFees} disabled={isBulking}
              className="inline-flex items-center gap-2 rounded-lg bg-[#d1060f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b00310] disabled:opacity-60">
              <FaLayerGroup className="text-xs" />
              {isBulking ? 'Creating…' : `Create ${students.filter((s) => s.feeStatus === 'not_created').length} fees`}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Edit fee modal ── */}
      {editModal && (
        <Modal title={<><FaEdit className="inline -mt-0.5 mr-2 text-[#ee2435]" />Edit fee — {editModal.student_name}</>} onClose={() => setEditModal(null)}>
          <div className="space-y-4">
            <Grid2>
              <Field label="Amount (CAD)" required>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/45">$</span>
                  <input type="number" min="0" step="0.01" value={editData.amount}
                    onChange={(e) => setEditData((p) => ({ ...p, amount: e.target.value }))}
                    className={`${inputCls} pl-7`} />
                </div>
              </Field>
              <Field label="Due date">
                <input type="date" value={editData.due_date}
                  onChange={(e) => setEditData((p) => ({ ...p, due_date: e.target.value }))}
                  className={`${inputCls} [color-scheme:dark]`} />
              </Field>
            </Grid2>
            <Field label="Fee type">
              <select value={editData.fee_type}
                onChange={(e) => setEditData((p) => ({ ...p, fee_type: e.target.value }))}
                className={`${inputCls} ${selectChevron}`}>
                <option value="Monthly fee">Monthly fee</option>
                <option value="Registration fee">Registration fee</option>
                <option value="Annual fee">Annual fee</option>
                <option value="Costume deposit">Costume deposit</option>
                <option value="Workshop fee">Workshop fee</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Notes (optional)">
              <input type="text" value={editData.notes}
                onChange={(e) => setEditData((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Any notes…" className={inputCls} />
            </Field>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/8 pt-4">
            <button type="button" onClick={() => setEditModal(null)}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:border-white/30">
              Cancel
            </button>
            <button type="button" onClick={submitEdit}
              className="inline-flex items-center gap-2 rounded-lg bg-[#d1060f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b00310]">
              <FaCheckCircle className="text-xs" /> Save changes
            </button>
          </div>
        </Modal>
      )}

      {/* ── Overdue reminders modal ── */}
      {reminderModal && (
        <Modal title={<><FaBell className="inline -mt-0.5 mr-2 text-[#ee2435]" />Send overdue reminders</>} onClose={() => setReminderModal(false)}>
          <p className="mb-4 text-sm text-white/70">
            This will send a payment reminder email to <strong className="text-white">{overdueStudents.length} parent{overdueStudents.length === 1 ? '' : 's'}</strong> with overdue fees.
          </p>
          <div className="mb-5 overflow-hidden rounded-lg border border-white/8">
            {overdueStudents.map((s, i) => (
              <div key={s.id} className={`flex items-center justify-between px-4 py-2.5 text-sm ${i < overdueStudents.length - 1 ? 'border-b border-white/8' : ''}`}>
                <div>
                  <span className="font-medium text-white">{s.student_name}</span>
                  <span className="ml-2 text-xs text-white/45">{s.email || 'no email'}</span>
                </div>
                <span className="font-semibold tabular-nums text-[#ee2435]">{formatCurrency(s.amount)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-white/8 pt-4">
            <button type="button" onClick={() => setReminderModal(false)}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:border-white/30">
              Cancel
            </button>
            <button type="button" onClick={sendOverdueReminders} disabled={isSendingReminders}
              className="inline-flex items-center gap-2 rounded-lg bg-[#d1060f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b00310] disabled:opacity-60">
              <FaBell className="text-xs" />
              {isSendingReminders ? 'Sending…' : 'Send reminders'}
            </button>
          </div>
        </Modal>
      )}

      {historyModal && (
        <Modal title={<><FaHistory className="inline -mt-0.5 mr-2 text-[#ee2435]" /> Payment history</>} onClose={() => setHistoryModal(null)} size="lg">
          <div className="mb-5 rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3">
            <strong className="text-base text-white">{historyModal.student_name}</strong>
            <div className="text-xs text-white/55">Parent: {historyModal.parent_name}</div>
          </div>

          {paymentHistory.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-sm text-white/55">
              No payments on record yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-white/8">
              <table className="w-full text-sm">
                <thead className="border-b border-white/8 bg-white/[0.04] text-xs uppercase tracking-wider text-white/45">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Month</th>
                    <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                    <th className="px-4 py-2.5 text-left font-medium">Status</th>
                    <th className="px-4 py-2.5 text-left font-medium">Paid on</th>
                    <th className="px-4 py-2.5 text-left font-medium">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {paymentHistory.map((fee) => {
                    const month = fee.due_date
                      ? new Date(fee.due_date).toLocaleDateString('en-CA', { year: 'numeric', month: 'short' })
                      : '—';
                    const isPaid = fee.payment_status === 'paid';
                    return (
                      <tr key={fee.id} className="hover:bg-white/[0.04]">
                        <td className="px-4 py-3 font-medium text-white">{month}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-white">{formatCurrency(fee.amount)}</td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                            style={{
                              background: isPaid ? '#ffffff' : 'rgba(209,6,15,0.18)',
                              color: isPaid ? '#0a0a0f' : '#ee2435',
                            }}
                          >
                            {fee.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-white/65">{formatDate(fee.payment_date)}</td>
                        <td className="px-4 py-3 text-xs capitalize text-white/65">{fee.payment_method || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/8 pt-4">
            <button type="button" onClick={() => setHistoryModal(null)}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:border-white/30">
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── tiny primitives ── */

function StatCard({ icon: Icon, label, value, sub, featured }) {
  return (
    <div className={`rounded-2xl border p-5 backdrop-blur-md ${featured ? 'border-[#d1060f]/30 bg-[#d1060f]/[0.06]' : 'border-white/10 bg-white/[0.03]'}`}>
      <div className={`grid h-10 w-10 place-items-center rounded-full ${featured ? 'bg-[#d1060f] text-white' : 'bg-white/10 text-white'}`}>
        <Icon className="text-base" />
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-[0.15em] text-white/55">{label}</p>
      <p className={`mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums ${featured ? 'text-[#ee2435]' : 'text-white'}`}>{value}</p>
      <p className="mt-1 text-xs text-white/45">{sub}</p>
    </div>
  );
}

function Modal({ title, children, onClose, size = 'md' }) {
  const w = size === 'lg' ? 'max-w-2xl' : 'max-w-md';
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0a0a0f]/80 p-4 backdrop-blur-md sm:items-center">
      <div className={`w-full ${w} overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] shadow-[0_30px_120px_rgba(0,0,0,0.6)]`}>
        <header className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-white">{title}</h2>
          <button type="button" onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-white/45 hover:bg-white/10 hover:text-white">
            <FaTimes className="text-xs" />
          </button>
        </header>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Grid2({ children }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-white/70">
        {label}{required && <span className="ml-1 text-[#ee2435]">*</span>}
      </label>
      {children}
    </div>
  );
}
