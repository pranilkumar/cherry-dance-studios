import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import '../../styles/AdminModern.css';

const PACKAGE_LABELS = {
  mom_1kid:  'Mom + 1 Child ($25)',
  mom_2kids: 'Mom + 2 Children ($30)',
  mom_3kids: 'Mom + 3 Children ($35)',
};

const PAYMENT_COLORS = {
  pending:  { bg: '#fff8e1', color: '#b45309', border: '#fde68a' },
  paid:     { bg: '#e6f9f0', color: '#15803d', border: '#86efac' },
  refunded: { bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
};

const WorkshopRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selected, setSelected]       = useState(null);
  const [updating, setUpdating]       = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('workshop_registrations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError('Failed to load registrations.');
    else setRegistrations(data || []);
    setLoading(false);
  };

  const updatePayment = async (id, status) => {
    setUpdating(true);
    const { error } = await supabase
      .from('workshop_registrations')
      .update({ payment_status: status })
      .eq('id', id);
    if (!error) {
      setRegistrations(r => r.map(x => x.id === id ? { ...x, payment_status: status } : x));
      if (selected?.id === id) setSelected(s => ({ ...s, payment_status: status }));
    }
    setUpdating(false);
  };

  const filtered = registrations.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.parent_name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.phone?.includes(q) ||
      r.child1_name?.toLowerCase().includes(q);
    const matchPayment = paymentFilter === 'all' || r.payment_status === paymentFilter;
    return matchSearch && matchPayment;
  });

  const stats = {
    total:   registrations.length,
    pending: registrations.filter(r => r.payment_status === 'pending').length,
    paid:    registrations.filter(r => r.payment_status === 'paid').length,
    revenue: registrations
      .filter(r => r.payment_status === 'paid')
      .reduce((sum, r) => {
        const prices = { mom_1kid: 25, mom_2kids: 30, mom_3kids: 35 };
        return sum + (prices[r.package] || 0);
      }, 0),
  };

  return (
    <div className="admin-content">
      <div className="content-header">
        <div>
          <h3 className="content-title">Workshop Registrations</h3>
          <p className="content-subtitle">Mom &amp; Me — May 9, 2026</p>
        </div>
        <button className="btn-modern btn-secondary" onClick={fetchData}>Refresh</button>
      </div>

      {error && <div className="alert-modern alert-error">{error}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total',   value: stats.total,   color: '#1d1d1f' },
          { label: 'Pending', value: stats.pending,  color: '#b45309' },
          { label: 'Paid',    value: stats.paid,     color: '#15803d' },
          { label: 'Revenue', value: `$${stats.revenue}`, color: '#D1060F' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 12, color: '#888', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none' }}
        />
        <select
          value={paymentFilter}
          onChange={e => setPaymentFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#fff', outline: 'none', cursor: 'pointer' }}
        >
          <option value="all">All Payments</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>No registrations found.</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '2px solid #f0f0f0' }}>
                {['Mom', 'Children', 'Package', 'Phone', 'Payment', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const ps = PAYMENT_COLORS[r.payment_status] || PAYMENT_COLORS.pending;
                const children = [r.child1_name, r.child2_name, r.child3_name].filter(Boolean).join(', ');
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f5f5f5', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1d1d1f' }}>{r.parent_name}</td>
                    <td style={{ padding: '12px 16px', color: '#555' }}>{children}</td>
                    <td style={{ padding: '12px 16px', color: '#555' }}>{PACKAGE_LABELS[r.package] || r.package}</td>
                    <td style={{ padding: '12px 16px', color: '#555' }}>{r.phone}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                        {r.payment_status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#888', fontSize: 12 }}>
                      {new Date(r.created_at).toLocaleDateString('en-CA')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setSelected(r)} style={{ padding: '5px 10px', borderRadius: 8, background: '#f3f4f6', border: 'none', cursor: 'pointer', fontSize: 12 }}>View</button>
                        {r.payment_status !== 'paid' && (
                          <button onClick={() => updatePayment(r.id, 'paid')} disabled={updating} style={{ padding: '5px 10px', borderRadius: 8, background: '#D1060F', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12 }}>
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelected(null)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 500, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h4 style={{ margin: 0, color: '#1d1d1f' }}>{selected.parent_name}</h4>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: 10, fontSize: 14 }}>
              {[
                ['Email',     selected.email],
                ['Phone',     selected.phone],
                ['Package',   PACKAGE_LABELS[selected.package] || selected.package],
                ['Child 1',   `${selected.child1_name} (Age: ${selected.child1_age})`],
                selected.child2_name && ['Child 2', `${selected.child2_name} (Age: ${selected.child2_age})`],
                selected.child3_name && ['Child 3', `${selected.child3_name} (Age: ${selected.child3_age})`],
                ['Allergies', selected.food_allergies || 'None'],
                ['Heard From',selected.heard_from || 'Not specified'],
                ['Registered',new Date(selected.created_at).toLocaleString()],
              ].filter(Boolean).map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#fafafa', borderRadius: 8 }}>
                  <span style={{ color: '#888', fontWeight: 500 }}>{label}</span>
                  <span style={{ color: '#1d1d1f', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{val}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              {selected.payment_status !== 'paid' && (
                <button onClick={() => updatePayment(selected.id, 'paid')} disabled={updating} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#15803d', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                  Mark as Paid
                </button>
              )}
              {selected.payment_status !== 'pending' && (
                <button onClick={() => updatePayment(selected.id, 'pending')} disabled={updating} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#f3f4f6', color: '#555', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                  Mark as Pending
                </button>
              )}
              <button onClick={() => updatePayment(selected.id, 'refunded')} disabled={updating} style={{ padding: '11px 16px', borderRadius: 10, background: '#fff', color: '#b91c1c', border: '1px solid #fca5a5', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkshopRegistrations;
