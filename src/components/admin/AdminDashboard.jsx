import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Spinner } from 'react-bootstrap';
import { FaUsers, FaDollarSign, FaClock, FaChartLine, FaUserPlus, FaMoneyBillWave, FaClipboardList } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import '../../styles/AdminModern.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    pendingPayments: 0,
    monthlyRevenue: 0,
    recentStudents: [],
    upcomingDues: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch total students
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*');

      if (studentsError) throw studentsError;

      // Fetch pending fees
      const { data: fees, error: feesError } = await supabase
        .from('fees')
        .select('*')
        .eq('payment_status', 'pending');

      if (feesError) throw feesError;

      // Fetch this month's paid fees
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: paidFees, error: paidError } = await supabase
        .from('fees')
        .select('amount')
        .eq('payment_status', 'paid')
        .gte('payment_date', `${currentMonth}-01`);

      if (paidError) throw paidError;

      const monthlyRevenue = paidFees?.reduce((sum, fee) => sum + parseFloat(fee.amount), 0) || 0;
      const activeStudents = students?.filter(s => s.status === 'active').length || 0;

      // Get recent students (last 5)
      const recentStudents = students?.slice(-5).reverse() || [];

      // Get upcoming dues (next 7 days)
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const { data: upcomingDues, error: duesError } = await supabase
        .from('fees')
        .select('*, students(student_name, parent_name)')
        .eq('payment_status', 'pending')
        .gte('due_date', today.toISOString().split('T')[0])
        .lte('due_date', nextWeek.toISOString().split('T')[0])
        .order('due_date', { ascending: true });

      if (duesError) throw duesError;

      setStats({
        totalStudents: students?.length || 0,
        activeStudents,
        pendingPayments: fees?.length || 0,
        monthlyRevenue,
        recentStudents,
        upcomingDues: upcomingDues || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <h4>Loading dashboard...</h4>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard Overview</h1>
        <p className="dashboard-subtitle">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Statistics Cards */}
      <Row className="stats-row">
        <Col md={6} lg={3}>
          <div className="stat-card">
            <div className="stat-icon">
              <FaUsers />
            </div>
            <div className="stat-label">Total Students</div>
            <div className="stat-value">{stats.totalStudents}</div>
            <div className="stat-change positive">
              {stats.activeStudents} active
            </div>
          </div>
        </Col>

        <Col md={6} lg={3}>
          <div className="stat-card">
            <div className="stat-icon">
              <FaDollarSign />
            </div>
            <div className="stat-label">Monthly Revenue</div>
            <div className="stat-value">{formatCurrency(stats.monthlyRevenue)}</div>
            <div className="stat-change">This month</div>
          </div>
        </Col>

        <Col md={6} lg={3}>
          <div className="stat-card">
            <div className="stat-icon">
              <FaClock />
            </div>
            <div className="stat-label">Pending Payments</div>
            <div className="stat-value">{stats.pendingPayments}</div>
            <div className="stat-change">Awaiting payment</div>
          </div>
        </Col>

        <Col md={6} lg={3}>
          <div className="stat-card">
            <div className="stat-icon">
              <FaChartLine />
            </div>
            <div className="stat-label">Upcoming Dues</div>
            <div className="stat-value">{stats.upcomingDues.length}</div>
            <div className="stat-change">Next 7 days</div>
          </div>
        </Col>
      </Row>

      {/* Quick Actions */}
      <div className="page-header">
        <h3 className="mb-3">Quick Actions</h3>
        <div className="d-flex flex-wrap gap-3">
          <Link to="/admin/registrations">
            <button className="btn-primary-modern">
              <FaClipboardList />
              View Registrations
            </button>
          </Link>
          <Link to="/admin/students">
            <button className="btn-primary-modern">
              <FaUserPlus />
              Manage Students
            </button>
          </Link>
          <Link to="/admin/fees">
            <button className="btn-primary-modern">
              <FaMoneyBillWave />
              Manage Fees
            </button>
          </Link>
        </div>
      </div>

      {/* Data Tables */}
      <Row className="g-4">
        {/* Recent Students */}
        <Col lg={6}>
          <div className="data-card">
            <div style={{ padding: '1.5rem 2rem', borderBottom: '2px solid #e2e8f0' }}>
              <h4 style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>Recent Registrations</h4>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {stats.recentStudents.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Class</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentStudents.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <div>
                            <strong>{student.student_name}</strong>
                            <br />
                            <small style={{ color: '#64748b' }}>{student.parent_name}</small>
                          </div>
                        </td>
                        <td>{student.preferred_class || 'Not assigned'}</td>
                        <td>
                          <span className={`badge-modern ${student.status === 'active' ? 'badge-active' : 'badge-pending'}`}>
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <FaUsers />
                  <h4>No Recent Registrations</h4>
                  <p>New student registrations will appear here</p>
                </div>
              )}
            </div>
          </div>
        </Col>

        {/* Upcoming Dues */}
        <Col lg={6}>
          <div className="data-card">
            <div style={{ padding: '1.5rem 2rem', borderBottom: '2px solid #e2e8f0' }}>
              <h4 style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>Upcoming Payment Dues</h4>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {stats.upcomingDues.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.upcomingDues.map((fee) => (
                      <tr key={fee.id}>
                        <td>
                          <strong>{fee.students?.student_name}</strong>
                        </td>
                        <td>
                          <strong style={{ color: '#10b981' }}>
                            {formatCurrency(fee.amount)}
                          </strong>
                        </td>
                        <td>
                          <span className="badge-modern badge-pending">
                            {formatDate(fee.due_date)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <FaClock />
                  <h4>No Upcoming Dues</h4>
                  <p>Payment dues will appear here</p>
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
