import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { FaCheckCircle, FaTimesCircle, FaUserPlus, FaEye, FaSearch } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import '../../styles/AdminModern.css';

const RegistrationManagement = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [converting, setConverting] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      showAlert('error', 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const convertToStudent = async (registrationId) => {
    try {
      setConverting(true);
      
      // Call the database function to convert
      const { data, error } = await supabase
        .rpc('convert_registration_to_student', {
          registration_id: registrationId
        });

      if (error) throw error;

      showAlert('success', 'Registration successfully converted to student!');
      fetchRegistrations();
      setShowModal(false);
    } catch (error) {
      console.error('Error converting registration:', error);
      showAlert('error', error.message || 'Failed to convert registration');
    } finally {
      setConverting(false);
    }
  };

  const updateStatus = async (registrationId, newStatus) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ status: newStatus })
        .eq('id', registrationId);

      if (error) throw error;

      showAlert('success', `Registration ${newStatus} successfully!`);
      fetchRegistrations();
    } catch (error) {
      console.error('Error updating status:', error);
      showAlert('error', 'Failed to update status');
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'warning', text: 'Pending Review' },
      approved: { bg: 'info', text: 'Approved' },
      converted: { bg: 'success', text: 'Converted' },
      rejected: { bg: 'danger', text: 'Rejected' }
    };
    const badge = badges[status] || badges.pending;
    return <Badge bg={badge.bg}>{badge.text}</Badge>;
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = 
      reg.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Container fluid className="registration-management">
      <Row className="mb-4">
        <Col>
          <h2 className="page-title">Registration Management</h2>
          <p className="page-subtitle">Review and convert enquiries to students</p>
        </Col>
      </Row>

      {alert && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={6}>
          <div className="search-box">
            <FaSearch className="search-icon" />
            <Form.Control
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </Col>
        <Col md={6}>
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="converted">Converted</option>
            <option value="rejected">Rejected</option>
          </Form.Select>
        </Col>
      </Row>

      <Card className="data-card">
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading registrations...</p>
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No registrations found</p>
            </div>
          ) : (
            <Table responsive hover className="registrations-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Preferred Class</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg) => (
                  <tr key={reg.id}>
                    <td>{new Date(reg.created_at).toLocaleDateString()}</td>
                    <td><strong>{reg.student_name}</strong></td>
                    <td>{reg.email}</td>
                    <td>{reg.phone}</td>
                    <td>{reg.preferred_class || 'Not specified'}</td>
                    <td>{getStatusBadge(reg.status)}</td>
                    <td>
                      <div className="action-buttons">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => {
                            setSelectedRegistration(reg);
                            setShowModal(true);
                          }}
                        >
                          <FaEye /> View
                        </Button>
                        {reg.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => updateStatus(reg.id, 'approved')}
                            >
                              <FaCheckCircle /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => updateStatus(reg.id, 'rejected')}
                            >
                              <FaTimesCircle /> Reject
                            </Button>
                          </>
                        )}
                        {(reg.status === 'approved' || reg.status === 'pending') && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => convertToStudent(reg.id)}
                          >
                            <FaUserPlus /> Convert
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Registration Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Registration Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRegistration && (
            <Row>
              <Col md={6}>
                <p><strong>Student Name:</strong> {selectedRegistration.student_name}</p>
                <p><strong>Parent Name:</strong> {selectedRegistration.parent_name}</p>
                <p><strong>Email:</strong> {selectedRegistration.email}</p>
                <p><strong>Phone:</strong> {selectedRegistration.phone}</p>
                <p><strong>Date of Birth:</strong> {selectedRegistration.date_of_birth || 'Not provided'}</p>
                <p><strong>Gender:</strong> {selectedRegistration.gender || 'Not provided'}</p>
              </Col>
              <Col md={6}>
                <p><strong>Preferred Class:</strong> {selectedRegistration.preferred_class || 'Not specified'}</p>
                <p><strong>Preferred Time:</strong> {selectedRegistration.preferred_time_slot || 'Not specified'}</p>
                <p><strong>Experience Level:</strong> {selectedRegistration.experience_level || 'Not specified'}</p>
                <p><strong>Status:</strong> {getStatusBadge(selectedRegistration.status)}</p>
                <p><strong>Submitted:</strong> {new Date(selectedRegistration.created_at).toLocaleString()}</p>
              </Col>
              {selectedRegistration.notes && (
                <Col md={12}>
                  <p><strong>Notes:</strong></p>
                  <p className="text-muted">{selectedRegistration.notes}</p>
                </Col>
              )}
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          {selectedRegistration && (selectedRegistration.status === 'approved' || selectedRegistration.status === 'pending') && (
            <Button
              variant="primary"
              onClick={() => convertToStudent(selectedRegistration.id)}
              disabled={converting}
            >
              {converting ? (
                <>
                  <Spinner animation="border" size="sm" /> Converting...
                </>
              ) : (
                <>
                  <FaUserPlus /> Convert to Student
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default RegistrationManagement;
