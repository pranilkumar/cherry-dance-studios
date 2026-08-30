'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  FaDollarSign, FaCheckCircle, FaClock, FaExclamationTriangle,
  FaCalendarAlt, FaSearch, FaMoneyBillWave, FaHistory, FaTimes,
  FaEdit, FaBell, FaLayerGroup, FaUndo, FaBan,
} from 'react-icons/fa';

const inputCls =
  'w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[#ee2435] focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-[#d1060f]/25';
const selectChevron =
  "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23ffffff%22 stroke-width=%221.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_0.65rem_center] bg-no-repeat pr-9";

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount || 0);

const formatDate = (dateString) => {
  if (!dateString) return '—';
  // Append T00:00:00 so the string is parsed as local time, not UTC midnight
  // (which would shift the date back by 4-5 hours in Eastern time zones).
  return new Date(dateString.split('T')[0] + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatMethod = (method) => {
  if (!method) return '—';
  const map = { cash: 'Cash', card: 'Card', bank_transfer: 'Bank transfer', 'e-transfer': 'E-transfer', cheque: 'Cheque' };
  return map[method] || method;
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
  const [editData, setEditData] = useState<{ amount: string; fee_type: string; due_date: string; notes: string }>({ amount: '', fee_type: '', due_date: '', notes: '' });
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState({ amount: '100', feeType: 'Monthly fee' });
  const [isBulking, setIsBulking] = useState(false);
  const [lastBulkStudents, setLastBulkStudents] = useState<any[]>([]); // students from last bulk creation
  const [isNotifying, setIsNotifying] = useState(false);
  const [reminderModal, setReminderModal] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [selectedReminderIds, setSelectedReminderIds] = useState<Set<string>>(new Set());
  const [setRateModal, setSetRateModal] = useState<any>(null);   // student whose fee_amount we're setting
  const [setRateValue, setSetRateValue] = useState('');
  const [isSavingRate, setIsSavingRate] = useState(false);
  const [alert, setAlert] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState({ totalIncome: 0, paidCount: 0, pendingCount: 0, overdueCount: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: studentsData, error: sErr } = await supabase
        .from('students').select('*, fee_amount, class_batch:class_batches(name)').in('status', ['active', 'on_break']).order('student_name');
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
        // If duplicates exist, priority: paid > waived > pending/other
        const fee = allFees.find((f) => f.payment_status === 'paid')
          ?? allFees.find((f) => f.payment_status === 'waived')
          ?? allFees[0];
        // Amount priority:
        // 1. Actual fee record amount (most authoritative)
        // 2. Student's configured monthly rate (fee_amount) — shown for not_created students
        //    so reminders and the table display the right number even before a fee is created
        // 3. 0 (truly unknown — shows "Not set" in the table)
        const resolvedAmount =
          fee?.amount != null
            ? parseFloat(String(fee.amount))
            : student.fee_amount
              ? parseFloat(String(student.fee_amount))
              : 0;
        // Only bill from the month the student enrolled
        const enrolledMonthStr = student.enrollment_date
          ? String(student.enrollment_date).slice(0, 7)
          : null;
        const billableThisMonth = !enrolledMonthStr || enrolledMonthStr <= monthFilter;

        return {
          ...student, fee,
          feeStatus: fee
            ? fee.payment_status
            : billableThisMonth ? 'not_created' : 'not_enrolled',
          amount: resolvedAmount,
          // For students with no fee record, use the 10th as the implied due date
          // so overdue detection works correctly.
          dueDate: fee?.due_date ?? `${monthFilter}-10`,
          paymentDate: fee?.payment_date,
        };
      });

      setStudents(studentsWithFees);

      // Compute stats from the full student list so that students with no fee
      // record (feeStatus === 'not_created') are counted as pending/overdue.
      const statsToday = new Date(); statsToday.setHours(0, 0, 0, 0);
      const isUnpaidOverdue = (s: any) => {
        if (s.status === 'on_break') return false;
        if (s.feeStatus === 'paid' || s.feeStatus === 'waived' || s.feeStatus === 'not_enrolled') return false;
        return s.dueDate && new Date(s.dueDate + 'T00:00:00') < statsToday;
      };
      const isUnpaidNotOverdue = (s: any) => {
        if (s.status === 'on_break') return false;
        if (s.feeStatus === 'paid' || s.feeStatus === 'waived' || s.feeStatus === 'not_enrolled') return false;
        if (!s.dueDate) return true; // no due date → treat as pending
        return new Date(s.dueDate + 'T00:00:00') >= statsToday;
      };

      setMonthlyStats({
        totalIncome: feesData?.filter((f) => f.payment_status === 'paid')
          .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0) || 0,
        paidCount: feesData?.filter((f) => f.payment_status === 'paid').length || 0,
        pendingCount: studentsWithFees.filter(isUnpaidNotOverdue).length,
        overdueCount: studentsWithFees.filter(isUnpaidOverdue).length,
      });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to load fee data' });
    } finally {
      setLoading(false);
    }
  }, [monthFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData, monthFilter]);

  const filtered = useMemo(() => {
    const filterToday = new Date(); filterToday.setHours(0, 0, 0, 0);
    const studentIsOverdue = (s) =>
      s.status !== 'on_break' &&
      s.feeStatus !== 'not_enrolled' &&
      (s.feeStatus === 'pending' || s.feeStatus === 'not_created') &&
      s.dueDate && new Date(s.dueDate + 'T00:00:00') < filterToday;
    const studentIsPending = (s) =>
      s.status !== 'on_break' &&
      s.feeStatus !== 'not_enrolled' &&
      (s.feeStatus === 'pending' || s.feeStatus === 'not_created') &&
      (!s.dueDate || new Date(s.dueDate + 'T00:00:00') >= filterToday);

    return students.filter((s) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      (s.student_name || '').toLowerCase().includes(term) ||
      (s.parent_name || '').toLowerCase().includes(term);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'overdue'      && studentIsOverdue(s)) ||
      (statusFilter === 'pending'      && studentIsPending(s)) ||
      (statusFilter === 'paid'         && s.feeStatus === 'paid') ||
      (statusFilter === 'waived'       && s.feeStatus === 'waived') ||
      (statusFilter === 'not_created'  && s.feeStatus === 'not_created');
    return matchesSearch && matchesStatus;
  });
  }, [students, searchTerm, statusFilter]);

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
      const feeType = paymentModal.fee?.fee_type || 'Monthly fee';
      const amount  = parseFloat(paymentData.amount);

      if (!paymentModal.fee) {
        const { error } = await supabase.from('fees').insert([{
          student_id: paymentModal.id, fee_type: feeType, amount,
          due_date: `${monthFilter}-10`, payment_status: 'paid', payment_date: paymentData.payment_date,
          payment_method: paymentData.payment_method, notes: paymentData.notes || null,
        }]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('fees').update({
          payment_status: 'paid', payment_date: paymentData.payment_date,
          payment_method: paymentData.payment_method, amount, notes: paymentData.notes || null,
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
    // Exclude on_break students — bulk fees are for actively attending students only.
    const withoutFee = students.filter((s) => s.status !== 'on_break' && s.feeStatus === 'not_created' && s.feeStatus !== 'not_enrolled');
    if (withoutFee.length === 0) {
      return showAlert('error', 'All active students already have a fee for this month.');
    }
    setIsBulking(true);
    try {
      // Due date is always the 10th of the selected month — not user-editable
      // to prevent accidentally creating fees with wrong due dates.
      const bulkDueDate = `${monthFilter}-10`;
      const inserts = withoutFee.map((s) => ({
        student_id: s.id,
        fee_type: bulkData.feeType,
        // Use the student's individual fee amount if set, otherwise the bulk default.
        amount: s.fee_amount ? parseFloat(s.fee_amount) : parseFloat(bulkData.amount),
        due_date: bulkDueDate,
        payment_status: 'pending',
      }));
      const { error } = await supabase.from('fees').insert(inserts);
      if (error) throw error;
      setLastBulkStudents(withoutFee.map((s) => ({
        email: s.email,
        emailSecondary: s.email_secondary || '',
        studentName: s.student_name,
        parentName: s.parent_name,
        amount: parseFloat(bulkData.amount),
        feeType: bulkData.feeType,
        dueDate: bulkDueDate,
      })));
      showAlert('success', `Created ${inserts.length} fees for ${monthFilter}.`);
      setBulkModal(false);
      fetchData();
    } catch (err) {
      showAlert('error', err.message || 'Failed to create fees.');
    } finally {
      setIsBulking(false);
    }
  };

  // ── Notify parents after bulk creation ────────────────────────────
  const notifyParentsAfterBulk = async () => {
    if (!lastBulkStudents.length) return;
    setIsNotifying(true);
    try {
      const res = await fetch('/api/send-fee-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ month: monthFilter, fees: lastBulkStudents }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send notifications');
      showAlert('success', `Notified ${data.sent} parent${data.sent !== 1 ? 's' : ''}${data.failed ? ` (${data.failed} failed)` : ''}.`);
      setLastBulkStudents([]);
    } catch (err) {
      showAlert('error', err.message || 'Failed to send notifications');
    } finally {
      setIsNotifying(false);
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

  // ── Waive fee (not applicable this month) ───────────────────────────
  // Works for both pending fees (update) and students with no fee yet (insert).
  const markWaived = async (student) => {
    try {
      if (student.fee?.id) {
        // Existing fee record — just update its status
        const { error } = await supabase.from('fees').update({
          payment_status: 'waived',
          payment_date: null,
          payment_method: null,
        }).eq('id', student.fee.id);
        if (error) throw error;
      } else {
        // No fee record yet — create one directly as waived
        const { error } = await supabase.from('fees').insert([{
          student_id: student.id,
          fee_type: 'Monthly fee',
          amount: 0,
          due_date: `${monthFilter}-10`,
          payment_status: 'waived',
        }]);
        if (error) throw error;
      }
      showAlert('success', `${student.student_name} — fee waived for this month.`);
      fetchData();
    } catch (err) {
      showAlert('error', err.message || 'Failed to waive fee.');
    }
  };

  // ── Set per-student monthly rate ────────────────────────────────────
  const openSetRate = (student) => {
    setSetRateValue(student.fee_amount ? String(student.fee_amount) : '');
    setSetRateModal(student);
  };

  const saveStudentRate = async () => {
    if (!setRateModal) return;
    const rate = parseFloat(setRateValue);
    if (!rate || rate <= 0) return showAlert('error', 'Please enter a valid amount.');
    setIsSavingRate(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({ fee_amount: rate })
        .eq('id', setRateModal.id);
      if (error) throw error;
      showAlert('success', `Monthly rate for ${setRateModal.student_name} set to ${formatCurrency(rate)}.`);
      setSetRateModal(null);
      fetchData();
    } catch (err) {
      showAlert('error', err.message || 'Failed to save rate.');
    } finally {
      setIsSavingRate(false);
    }
  };

  // ── Overdue reminders ────────────────────────────────────────────────
  const feeToday = new Date(); feeToday.setHours(0, 0, 0, 0);
  const overdueStudents = students.filter(
    (s) =>
      s.status !== 'on_break' &&
      s.feeStatus !== 'not_enrolled' &&
      (s.feeStatus === 'pending' || s.feeStatus === 'not_created') &&
      s.dueDate &&
      new Date(s.dueDate + 'T00:00:00') < feeToday
  );

  const sendOverdueReminders = async () => {
    setIsSendingReminders(true);
    // Only send to checked students who have a known amount > 0 and an email address.
    const sendable = overdueStudents.filter(
      (s) => selectedReminderIds.has(s.id) && s.email && s.amount > 0
    );
    let sent = 0, failed = 0;
    for (const s of sendable) {
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
    const skipped = overdueStudents.length - sendable.length;
    setIsSendingReminders(false);
    setReminderModal(false);
    showAlert(
      failed === 0 ? 'success' : 'error',
      [
        failed === 0
          ? `Reminders sent to ${sent} parent${sent === 1 ? '' : 's'}.`
          : `Sent ${sent}, failed ${failed}. Check that all students have emails on file.`,
        skipped > 0 ? `${skipped} skipped — no fee rate set (use "Create this month's fees" or set per-student rate).` : '',
      ].filter(Boolean).join(' ')
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
    if (student.feeStatus === 'waived') {
      return { label: 'Waived', bg: 'rgba(255,255,255,0.07)', fg: 'rgba(255,255,255,0.4)', icon: FaBan };
    }
    if (student.feeStatus === 'not_enrolled') {
      return { label: 'Not enrolled yet', bg: 'rgba(255,255,255,0.04)', fg: 'rgba(255,255,255,0.25)', icon: FaBan };
    }
    if (student.feeStatus === 'pending' || student.feeStatus === 'not_created') {
      const overdue = student.dueDate && new Date(student.dueDate + 'T00:00:00') < feeToday;
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
              onClick={() => {
                // Pre-select all students who can actually receive a reminder
                const sendable = overdueStudents.filter((s) => s.email && s.amount > 0);
                setSelectedReminderIds(new Set(sendable.map((s) => s.id)));
                setReminderModal(true);
              }}
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
          className={`mb-5 flex flex-col gap-2 rounded-xl border px-4 py-3 text-sm backdrop-blur-md ${
            alert.type === 'success'
              ? 'border-white/15 bg-white/[0.06] text-white'
              : 'border-[#d1060f]/30 bg-[#d1060f]/10 text-[#ee2435]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{alert.message}</span>
            <button onClick={() => setAlert(null)} className="ml-3 opacity-65 hover:opacity-100">
              <FaTimes className="text-xs" />
            </button>
          </div>
          {alert.type === 'success' && lastBulkStudents.length > 0 && (
            <div className="flex items-center gap-3 border-t border-white/10 pt-2">
              <span className="text-xs text-white/60">Notify {lastBulkStudents.length} parent{lastBulkStudents.length !== 1 ? 's' : ''} by email?</span>
              <button
                type="button"
                onClick={notifyParentsAfterBulk}
                disabled={isNotifying}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#d1060f] px-3 py-1 text-xs font-semibold text-white hover:bg-[#b00310] disabled:opacity-60"
              >
                <FaBell className="text-[10px]" />
                {isNotifying ? 'Sending…' : 'Send fee notices'}
              </button>
              <button
                type="button"
                onClick={() => setLastBulkStudents([])}
                className="text-xs text-white/40 hover:text-white/70"
              >
                Skip
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={FaDollarSign}          label="Total income" value={formatCurrency(monthlyStats.totalIncome)} sub={`${monthlyStats.paidCount} payments`} />
        <StatCard icon={FaCheckCircle}         label="Paid"         value={monthlyStats.paidCount}    sub={`of ${students.filter(s => s.status === 'active').length} active`} />
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
            { v: 'all',         label: `All (${students.length})` },
            { v: 'paid',        label: `Paid (${monthlyStats.paidCount})` },
            { v: 'overdue',     label: `Overdue (${monthlyStats.overdueCount})` },
            { v: 'pending',     label: `Pending (${monthlyStats.pendingCount})` },
            { v: 'waived',      label: `Waived (${students.filter(s => s.feeStatus === 'waived').length})` },
            { v: 'not_created', label: `No record (${students.filter(s => s.feeStatus === 'not_created').length})` },
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
                        <div className="text-xs text-white/55">
                          {student.class_batch?.name || student.preferred_class || 'No class'}
                          {student.status === 'on_break' && <span className="ml-1.5 text-amber-400/80">· On break</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-white/80">{student.parent_name}</td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {student.amount > 0 ? (
                          <div>
                            <span className={`font-semibold ${student.feeStatus === 'not_created' ? 'text-white/55' : 'text-white'}`}>
                              {formatCurrency(student.amount)}
                            </span>
                            {student.feeStatus === 'not_created' && (
                              <button
                                type="button"
                                onClick={() => openSetRate(student)}
                                className="block text-[10px] text-white/35 underline-offset-2 hover:text-[#ee2435] hover:underline"
                              >
                                edit rate
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openSetRate(student)}
                            className="inline-flex items-center gap-1 rounded-md border border-dashed border-white/20 px-2 py-0.5 text-xs text-white/40 hover:border-[#ee2435]/50 hover:text-[#ee2435]"
                          >
                            <FaDollarSign className="text-[9px]" /> Set rate
                          </button>
                        )}
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
                          {student.feeStatus !== 'paid' && student.feeStatus !== 'waived' && (
                            <button
                              type="button"
                              onClick={() => openPayment(student)}
                              className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white px-2.5 py-1 text-xs font-medium text-[#0a0a0f] hover:bg-white/90"
                            >
                              <FaCheckCircle className="text-[10px]" /> Mark paid
                            </button>
                          )}
                          {(student.feeStatus === 'pending' || student.feeStatus === 'not_created') && (
                            <button
                              type="button"
                              onClick={() => markWaived(student)}
                              title="Waive — fee not applicable this month"
                              className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-white/50 hover:border-white/30 hover:text-white/70"
                            >
                              <FaBan className="text-[10px]" /> Waive
                            </button>
                          )}
                          {(student.feeStatus === 'paid' || student.feeStatus === 'waived') && (
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
              <Field label="Default amount (CAD)" required>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/45">$</span>
                  <input type="number" min="0" step="0.01" value={bulkData.amount}
                    onChange={(e) => setBulkData((p) => ({ ...p, amount: e.target.value }))}
                    className={`${inputCls} pl-7`} />
                </div>
                <p className="mt-1 text-[10px] text-white/35">Used for students without an individual rate set.</p>
              </Field>
              <Field label="Due date">
                <div className={`${inputCls} flex items-center text-white/55`}>
                  <FaCalendarAlt className="mr-2 text-[#ee2435] text-xs shrink-0" />
                  10th {new Date(`${monthFilter}-10T00:00:00`).toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })}
                </div>
                <p className="mt-1 text-[10px] text-white/35">Always the 10th — edit individual fees to change.</p>
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
      {reminderModal && (() => {
        const canSend  = overdueStudents.filter((s) => s.email && s.amount > 0);
        const noAmount = overdueStudents.filter((s) => s.amount === 0);
        const noEmail  = overdueStudents.filter((s) => s.amount > 0 && !s.email);
        const checkedCount = canSend.filter((s) => selectedReminderIds.has(s.id)).length;
        const allChecked   = checkedCount === canSend.length && canSend.length > 0;

        const toggleStudent = (id: string, canToggle: boolean) => {
          if (!canToggle) return;
          setSelectedReminderIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
          });
        };

        const toggleAll = () => {
          setSelectedReminderIds(
            allChecked ? new Set() : new Set(canSend.map((s) => s.id))
          );
        };

        return (
          <Modal title={<><FaBell className="inline -mt-0.5 mr-2 text-[#ee2435]" />Send overdue reminders</>} onClose={() => setReminderModal(false)}>
            {/* Select all / none row */}
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-white/70">
                <strong className="text-white">{checkedCount}</strong> of{' '}
                <strong className="text-white">{canSend.length}</strong> selected
              </p>
              {canSend.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs text-white/45 underline-offset-2 hover:text-white/80 hover:underline"
                >
                  {allChecked ? 'Deselect all' : 'Select all'}
                </button>
              )}
            </div>

            <div className="mb-5 overflow-hidden rounded-lg border border-white/8">
              {overdueStudents.map((s, i) => {
                const missingAmount = s.amount === 0;
                const missingEmail  = !s.email && s.amount > 0;
                const canToggle     = !missingAmount && !missingEmail;
                const isChecked     = canToggle && selectedReminderIds.has(s.id);

                return (
                  <div
                    key={s.id}
                    onClick={() => toggleStudent(s.id, canToggle)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                      i < overdueStudents.length - 1 ? 'border-b border-white/8' : ''
                    } ${canToggle ? 'cursor-pointer hover:bg-white/[0.04]' : 'opacity-45'}`}
                  >
                    {/* Checkbox */}
                    <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                      isChecked
                        ? 'border-[#d1060f] bg-[#d1060f]'
                        : canToggle
                          ? 'border-white/25 bg-white/[0.04]'
                          : 'border-white/15 bg-white/[0.02]'
                    }`}>
                      {isChecked && (
                        <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>

                    {/* Name + email */}
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-white">{s.student_name}</span>
                      <span className="ml-2 text-xs text-white/45">{s.email || 'no email'}</span>
                      {missingAmount && (
                        <span className="ml-2 text-[10px] text-amber-400/80">· rate not set</span>
                      )}
                      {missingEmail && (
                        <span className="ml-2 text-[10px] text-white/40">· no email</span>
                      )}
                    </div>

                    <span className={`shrink-0 font-semibold tabular-nums ${missingAmount ? 'text-white/30' : 'text-[#ee2435]'}`}>
                      {missingAmount ? '—' : formatCurrency(s.amount)}
                    </span>
                  </div>
                );
              })}
            </div>

            {noAmount.length > 0 && (
              <p className="mb-4 text-xs text-amber-400/70">
                ⚠ {noAmount.length} student{noAmount.length === 1 ? ' has' : 's have'} no fee rate set — use{' '}
                <strong className="text-amber-400/90">Set rate</strong> in the fees table first.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-white/8 pt-4">
              <button type="button" onClick={() => setReminderModal(false)}
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:border-white/30">
                Cancel
              </button>
              <button
                type="button"
                onClick={sendOverdueReminders}
                disabled={isSendingReminders || checkedCount === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-[#d1060f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b00310] disabled:opacity-60"
              >
                <FaBell className="text-xs" />
                {isSendingReminders ? 'Sending…' : `Send to ${checkedCount}`}
              </button>
            </div>
          </Modal>
        );
      })()}

      {/* ── Set monthly rate modal ── */}
      {setRateModal && (
        <Modal title={<><FaDollarSign className="inline -mt-0.5 mr-2 text-[#ee2435]" />Set monthly rate</>} onClose={() => setSetRateModal(null)}>
          <div className="mb-5 rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3">
            <strong className="text-base text-white">{setRateModal.student_name}</strong>
            <div className="text-xs text-white/55">Parent: {setRateModal.parent_name}</div>
          </div>
          <p className="mb-4 text-sm text-white/60">
            This sets the monthly fee rate for this student. It will be used automatically when creating monthly fees in bulk.
          </p>
          <Field label="Monthly rate (CAD)" required>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/45">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={setRateValue}
                onChange={(e) => setSetRateValue(e.target.value)}
                placeholder="e.g. 100"
                className={`${inputCls} pl-7`}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveStudentRate()}
              />
            </div>
          </Field>
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/8 pt-4">
            <button type="button" onClick={() => setSetRateModal(null)}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:border-white/30">
              Cancel
            </button>
            <button type="button" onClick={saveStudentRate} disabled={isSavingRate}
              className="inline-flex items-center gap-2 rounded-lg bg-[#d1060f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b00310] disabled:opacity-60">
              <FaCheckCircle className="text-xs" />
              {isSavingRate ? 'Saving…' : 'Save rate'}
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
                      ? new Date(fee.due_date.split('T')[0] + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'short' })
                      : '—';
                    const statusStyle = fee.payment_status === 'paid'
                      ? { background: '#ffffff', color: '#0a0a0f' }
                      : fee.payment_status === 'waived'
                        ? { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }
                        : { background: 'rgba(209,6,15,0.18)', color: '#ee2435' };
                    return (
                      <tr key={fee.id} className="hover:bg-white/[0.04]">
                        <td className="px-4 py-3 font-medium text-white">{month}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-white">{formatCurrency(fee.amount)}</td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                            style={statusStyle}
                          >
                            {fee.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-white/65">{formatDate(fee.payment_date)}</td>
                        <td className="px-4 py-3 text-xs text-white/65">{formatMethod(fee.payment_method)}</td>
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

function StatCard({ icon: Icon, label, value, sub, featured = false }: { icon: any; label: any; value: any; sub: any; featured?: any }) {
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

function Field({ label, required = false, children }: { label: any; required?: any; children: any }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-white/70">
        {label}{required && <span className="ml-1 text-[#ee2435]">*</span>}
      </label>
      {children}
    </div>
  );
}
