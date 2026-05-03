import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Modal, Alert, Badge } from 'react-bootstrap';
import { FaUsers, FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaDownload } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import '../../styles/AdminModern.css';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [alert, setAlert] = useState({ show: false, message: '', variant: '' });

  // Form state
  const [formData, setFormData] = useState({
    parent_name: '',
    student_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    preferred_class: '',
    preferred_weekday: '',
    preferred_time_slot: '',
    experience_level: '',
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, statusFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('enrollment_date', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      showAlert('Failed to load students', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.phone?.includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => student.status === statusFilter);
    }

    setFilteredStudents(filtered);
  };

  const handleShowModal = (student = null) => {
    if (student) {
      setCurrentStudent(student);
      setFormData({
        parent_name: student.parent_name || '',
        student_name: student.student_name || '',
        email: student.email || '',
        phone: student.phone || '',
        date_of_birth: student.date_of_birth || '',
        gender: student.gender || '',
        preferred_class: student.preferred_class || '',
        preferred_weekday: student.preferred_weekday || '',
        preferred_time_slot: student.preferred_time_slot || '',
        experience_level: student.experience_level || '',
        status: student.status || 'active',
        notes: student.notes || ''
      });
    } else {
      setCurrentStudent(null);
      setFormData({
        parent_name: '',
        student_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        preferred_class: '',
        preferred_weekday: '',
        preferred_time_slot: '',
        experience_level: '',
        status: 'active',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentStudent(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentStudent) {
        // Update existing student
        const { error } = await supabase
          .from('students')
          .update(formData)
          .eq('id', currentStudent.id);

        if (error) throw error;
        showAlert('Student updated successfully', 'success');
      } else {
        // Add new student
        const { error } = await supabase
          .from('students')
          .insert([formData]);

        if (error) throw error;
        showAlert('Student added successfully', 'success');
      }

      handleCloseModal();
      fetchStudents();
    } catch (error) {
      console.error('Error saving student:', error);
      showAlert('Failed to save student', 'danger');
    }
  };

  const handleDeleteClick = (student) => {
    setCurrentStudent(student);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', currentStudent.id);

      if (error) throw error;
      showAlert('Student deleted successfully', 'success');
      setShowDeleteModal(false);
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      showAlert('Failed to delete student', 'danger');
    }
  };

  const showAlert = (message, variant) => {
    setAlert({ show: true, message, variant });
    setTimeout(() => {
      setAlert({ show: false, message: '', variant: '' });
    }, 3000);
  };

  const exportToCSV = () => {
    const headers = ['Student Name', 'Parent Name', 'Email', 'Phone', 'Date of Birth', 'Gender', 'Preferred Class', 'Status', 'Enrollment Date'];
    const rows = filteredStudents.map(student => [
      student.student_name,
      student.parent_name,
      student.email,
      student.phone,
      student.date_of_birth,
      student.gender,
      student.preferred_class,
      student.status,
      new Date(student.enrollment_date).toLocaleDateString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      inactive: 'secondary',
      pending: 'warning',
      dropped: 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Container className="student-management py-5">
        <div className="text-center">
          <p>Loading students...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="student-management py-4">
      {alert.show && (
        <Alert variant={alert.variant} dismissible onClose={() => setAlert({ show: false })}>
          {alert.message}
        </Alert>
      )}

      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center mb-3">
            <FaUsers className="me-2" size={32} style={{ color: '#0ea5e9' }} />
            <h2 className="mb-0">Student Management</h2>
          </div>
          <p className="text-muted">Manage student enrollments, information, and status</p>
        </Col>
      </Row>

      {/* Search and Filter Controls */}
      <Card className="control-card mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={5}>
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
            <Col md={3}>
              <div className="filter-box">
                <FaFilter className="filter-icon" />
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="dropped">Dropped</option>
                </Form.Select>
              </div>
            </Col>
            <Col md={4} className="d-flex justify-content-end gap-2">
              <Button variant="outline-primary" onClick={exportToCSV}>
                <FaDownload className="me-2" />
                Export CSV
              </Button>
              <Button variant="primary" onClick={() => handleShowModal()}>
                <FaPlus className="me-2" />
                Add Student
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Students Table */}
      <Card className="data-card">
        <Card.Header>
          <h5 className="mb-0">All Students ({filteredStudents.length})</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Parent Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Preferred Class</th>
                  <th>Status</th>
                  <th>Enrollment Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      No students found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="fw-bold">{student.student_name}</td>
                      <td>{student.parent_name}</td>
                      <td>{student.email}</td>
                      <td>{student.phone}</td>
                      <td>{student.preferred_class || 'N/A'}</td>
                      <td>{getStatusBadge(student.status)}</td>
                      <td>{new Date(student.enrollment_date).toLocaleDateString()}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleShowModal(student)}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteClick(student)}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Add/Edit Student Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {currentStudent ? 'Edit Student' : 'Add New Student'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Parent Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="parent_name"
                    value={formData.parent_name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Student Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="student_name"
                    value={formData.student_name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone *</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date of Birth</Form.Label>
                  <Form.Control
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Gender</Form.Label>
                  <Form.Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Preferred Class</Form.Label>
                  <Form.Select
                    name="preferred_class"
                    value={formData.preferred_class}
                    onChange={handleInputChange}
                  >
                    <option value="">Select...</option>
                    <option value="Ballet">Ballet</option>
                    <option value="Hip Hop">Hip Hop</option>
                    <option value="Contemporary">Contemporary</option>
                    <option value="Jazz">Jazz</option>
                    <option value="Tap">Tap</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Preferred Weekday</Form.Label>
                  <Form.Select
                    name="preferred_weekday"
                    value={formData.preferred_weekday}
                    onChange={handleInputChange}
                  >
                    <option value="">Select...</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Time Slot</Form.Label>
                  <Form.Select
                    name="preferred_time_slot"
                    value={formData.preferred_time_slot}
                    onChange={handleInputChange}
                  >
                    <option value="">Select...</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Experience Level</Form.Label>
                  <Form.Select
                    name="experience_level"
                    value={formData.experience_level}
                    onChange={handleInputChange}
                  >
                    <option value="">Select...</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                    <option value="dropped">Dropped</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any additional notes..."
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {currentStudent ? 'Update Student' : 'Add Student'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete {currentStudent?.student_name}? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default StudentManagement;
