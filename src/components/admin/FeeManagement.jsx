import { useState, useEffect } from 'react';
import { Container, Row, Col, Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FaDollarSign, FaCheckCircle, FaClock, FaExclamationTriangle, FaCalendarAlt, FaChartLine, FaSearch, FaPlus, FaMoneyBillWave, FaHistory } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import '../../styles/AdminModern.css';

const FeeManagement = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [alert, setAlert] = useState({ show: false, message: '', variant: '' });

  // Monthly stats
  const [monthlyStats, setMonthlyStats] = useState({
    totalIncome: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0
  });

  // Payment form
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [monthFilter]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all active students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('status', 'active')
        .order('student_name');

      if (studentsError) throw studentsError;

      // Fetch fees for current month
      const startOfMonth = `${monthFilter}-01`;
      const endOfMonth = new Date(monthFilter + '-01');
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      const endDate = endOfMonth.toISOString().split('T')[0];

      const { data: feesData, error: feesError } = await supabase
        .from('fees')
        .select('*')
        .gte('due_date', startOfMonth)
        .lte('due_date', endDate);

      if (feesError) throw feesError;

      // Combine student data with fee status
      const studentsWithFees = studentsData.map(student => {
        const studentFee = feesData?.find(fee => fee.student_id === student.id);
        return {
          ...student,
          fee: studentFee,
          feeStatus: studentFee ? studentFee.payment_status : 'not_created',
          amount: studentFee?.amount || 0,
          dueDate: studentFee?.due_date,
          paymentDate: studentFee?.payment_date
        };
      });

      setStudents(studentsWithFees);

      // Calculate monthly stats
      const stats = {
        totalIncome: feesData?.filter(f => f.payment_status === 'paid')
          .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0) || 0,
        paidCount: feesData?.filter(f => f.payment_status === 'paid').length || 0,
        pendingCount: feesData?.filter(f => f.payment_status === 'pending').length || 0,
        overdueCount: feesData?.filter(f => {
          if (f.payment_status === 'pending' && f.due_date) {
            return new Date(f.due_date) < new Date();
          }
          return false;
        }).length || 0
      };

      setMonthlyStats(stats);
    } catch (error) {
      console.error('Error fetching data:', error);
      showAlert('Failed to load data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parent_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => student.feeStatus === statusFilter);
    }

    setFilteredStudents(filtered);
  };

  const handleMarkAsPaid = async (student) => {
    setSelectedStudent(student);
    setPaymentData({
      amount: student.amount || '100',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const submitPayment = async () => {
    try {
      if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
        showAlert('Please enter a valid amount', 'warning');
        return;
      }

      // If fee record doesn't exist, create it
      if (!selectedStudent.fee) {
        const { error: createError } = await supabase
          .from('fees')
          .insert([{
            student_id: selectedStudent.id,
            fee_type: 'Monthly Fee',
            amount: paymentData.amount,
            due_date: `${monthFilter}-05`,
            payment_status: 'paid',
            payment_date: paymentData.payment_date,
            payment_method: paymentData.payment_method,
            notes: paymentData.notes
          }]);

        if (createError) throw createError;
      } else {
        // Update existing fee record
        const { error: updateError } = await supabase
          .from('fees')
          .update({
            payment_status: 'paid',
            payment_date: paymentData.payment_date,
            payment_method: paymentData.payment_method,
            amount: paymentData.amount,
            notes: paymentData.notes
          })
          .eq('id', selectedStudent.fee.id);

        if (updateError) throw updateError;
      }

      showAlert('Payment recorded successfully!', 'success');
      setShowPaymentModal(false);
      fetchData();
    } catch (error) {
      console.error('Error recording payment:', error);
      showAlert('Failed to record payment', 'danger');
    }
  };

  const viewPaymentHistory = async (student) => {
    try {
      const { data, error } = await supabase
        .from('fees')
        .select('*')
        .eq('student_id', student.id)
        .order('due_date', { ascending: false });

      if (error) throw error;

      setPaymentHistory(data || []);
      setSelectedStudent(student);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      showAlert('Failed to load payment history', 'danger');
    }
  };

  const showAlert = (message, variant) => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ show: false, message: '', variant: '' }), 3000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusInfo = (student) => {
    if (student.feeStatus === 'paid') {
      return { text: 'Paid', class: 'badge-paid', icon: <FaCheckCircle /> };
    } else if (student.feeStatus === 'pending') {
      const isOverdue = student.dueDate && new Date(student.dueDate) < new Date();
      if (isOverdue) {
        return { text: 'Overdue', class: 'badge-rejected', icon: <FaExclamationTriangle /> };
      }
      return { text: 'Pending', class: 'badge-pending', icon: <FaClock /> };
    }
    return { text: 'Not Created', class: 'badge-inactive', icon: <FaClock /> };
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <h4>Loading fee tracker...</h4>
      </div>
    );
  }

  return (
    <div className="management-container">
      {/* Alert */}
      {alert.show && (
        <Alert variant={alert.variant} onClose={() => setAlert({ show: false, message: '', variant: '' })} dismissible>
          {alert.message}
        </Alert>
      )}

      {/* Header */}
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="page-title">Fee Tracker</h1>
            <p className="page-description">Track monthly fees and income</p>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <FaCalendarAlt style={{ color: '#3b82f6', fontSize: '1.2rem' }} />
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="form-control-modern"
              style={{ width: 'auto' }}
            />
          </div>
        </div>
      </div>

      {/* Monthly Stats */}
      <Row className="stats-row">
        <Col md={6} lg={3}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              <FaDollarSign />
            </div>
            <div className="stat-label">Total Income</div>
            <div className="stat-value">{formatCurrency(monthlyStats.totalIncome)}</div>
            <div className="stat-change positive">{monthlyStats.paidCount} payments received</div>
          </div>
        </Col>

        <Col md={6} lg={3}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}>
              <FaCheckCircle />
            </div>
            <div className="stat-label">Paid Students</div>
            <div className="stat-value">{monthlyStats.paidCount}</div>
            <div className="stat-change">Out of {students.length} active</div>
          </div>
        </Col>

        <Col md={6} lg={3}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}>
              <FaClock />
            </div>
            <div className="stat-label">Pending</div>
            <div className="stat-value">{monthlyStats.pendingCount}</div>
            <div className="stat-change">Yet to pay</div>
          </div>
        </Col>

        <Col md={6} lg={3}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
              <FaExclamationTriangle />
            </div>
            <div className="stat-label">Overdue</div>
            <div className="stat-value">{monthlyStats.overdueCount}</div>
            <div className="stat-change negative">Needs attention</div>
          </div>
        </Col>
      </Row>

      {/* Controls */}
      <div className="controls-bar">
        <Row className="align-items-center">
          <Col md={6}>
            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="Search by student or parent name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </Col>
          <Col md={3}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="not_created">Not Created</option>
            </select>
          </Col>
          <Col md={3} className="text-end">
            <span style={{ color: '#64748b', fontWeight: 600 }}>
              {filteredStudents.length} students
            </span>
          </Col>
        </Row>
      </div>

      {/* Student Fee List */}
      <div className="data-card">
        {filteredStudents.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Parent Name</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Payment Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const statusInfo = getStatusInfo(student);
                return (
                  <tr key={student.id}>
                    <td>
                      <strong>{student.student_name}</strong>
                      <br />
                      <small style={{ color: '#64748b' }}>{student.preferred_class || 'No class'}</small>
                    </td>
                    <td>{student.parent_name}</td>
                    <td>
                      <strong style={{ color: '#10b981', fontSize: '1.1rem' }}>
                        {student.amount ? formatCurrency(student.amount) : 'Not set'}
                      </strong>
                    </td>
                    <td>{formatDate(student.dueDate)}</td>
                    <td>
                      <span className={`badge-modern ${statusInfo.class}`}>
                        {statusInfo.icon} {statusInfo.text}
                      </span>
                    </td>
                    <td>
                      {student.feeStatus === 'paid' ? (
                        <span style={{ color: '#10b981', fontWeight: 600 }}>
                          {formatDate(student.paymentDate)}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        {student.feeStatus !== 'paid' && (
                          <button
                            className="btn-action btn-approve"
                            onClick={() => handleMarkAsPaid(student)}
                          >
                            <FaCheckCircle /> Mark Paid
                          </button>
                        )}
                        <button
                          className="btn-action btn-view"
                          onClick={() => viewPaymentHistory(student)}
                        >
                          <FaHistory /> History
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <FaDollarSign />
            <h4>No Students Found</h4>
            <p>Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaMoneyBillWave className="me-2" />
            Record Payment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStudent && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
              <strong style={{ color: '#1e293b', fontSize: '1.1rem' }}>
                {selectedStudent.student_name}
              </strong>
              <br />
              <small style={{ color: '#64748b' }}>Parent: {selectedStudent.parent_name}</small>
            </div>
          )}

          <Form>
            <Form.Group className="form-group-modern">
              <Form.Label className="form-label-modern">Amount (CAD)</Form.Label>
              <Form.Control
                type="number"
                className="form-control-modern"
                placeholder="Enter amount"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="form-group-modern">
              <Form.Label className="form-label-modern">Payment Date</Form.Label>
              <Form.Control
                type="date"
                className="form-control-modern"
                value={paymentData.payment_date}
                onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="form-group-modern">
              <Form.Label className="form-label-modern">Payment Method</Form.Label>
              <Form.Select
                className="form-control-modern"
                value={paymentData.payment_method}
                onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="e-transfer">E-Transfer</option>
                <option value="cheque">Cheque</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="form-group-modern">
              <Form.Label className="form-label-modern">Notes (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                className="form-control-modern"
                placeholder="Add any notes..."
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowPaymentModal(false)}>
            Cancel
          </Button>
          <button className="btn-primary-modern" onClick={submitPayment}>
            <FaCheckCircle /> Record Payment
          </button>
        </Modal.Footer>
      </Modal>

      {/* Payment History Modal */}
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaHistory className="me-2" />
            Payment History
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStudent && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
              <strong style={{ color: '#1e293b', fontSize: '1.1rem' }}>
                {selectedStudent.student_name}
              </strong>
              <br />
              <small style={{ color: '#64748b' }}>Parent: {selectedStudent.parent_name}</small>
            </div>
          )}

          {paymentHistory.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment Date</th>
                    <th>Method</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((fee) => {
                    const month = new Date(fee.due_date).toLocaleDateString('en-CA', { year: 'numeric', month: 'short' });
                    return (
                      <tr key={fee.id}>
                        <td><strong>{month}</strong></td>
                        <td><strong style={{ color: '#10b981' }}>{formatCurrency(fee.amount)}</strong></td>
                        <td>
                          <span className={`badge-modern ${fee.payment_status === 'paid' ? 'badge-paid' : 'badge-pending'}`}>
                            {fee.payment_status}
                          </span>
                        </td>
                        <td>{formatDate(fee.payment_date)}</td>
                        <td style={{ textTransform: 'capitalize' }}>{fee.payment_method || 'N/A'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <FaHistory />
              <h4>No Payment History</h4>
              <p>No payments recorded for this student yet</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowHistoryModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FeeManagement;
