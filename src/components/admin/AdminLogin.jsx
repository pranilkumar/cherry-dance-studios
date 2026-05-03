import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { FaLock, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../../styles/AdminModern.css';
import '../../styles/Register.css';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Simple authentication - replace with Supabase Auth later
  const ADMIN_CREDENTIALS = {
    email: 'admin@cherrydance.com',
    password: 'cherry123'
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (
        credentials.email === ADMIN_CREDENTIALS.email &&
        credentials.password === ADMIN_CREDENTIALS.password
      ) {
        // Store auth token in localStorage
        localStorage.setItem('admin_auth', 'true');
        localStorage.setItem('admin_email', credentials.email);
        navigate('/admin/dashboard');
      } else {
        setError('Invalid credentials. Please try again.');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="admin-login-page">
      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col md={6} lg={5} xl={4}>
            <Card className="admin-login-card">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <div className="admin-icon-circle mb-3">
                    <FaLock size={40} />
                  </div>
                  <h2 className="admin-login-title">Admin Login</h2>
                  <p className="text-muted">Cherry Dance Studios</p>
                </div>

                {error && (
                  <Alert variant="danger" className="mb-4">
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <FaUser className="me-2" />
                      Email Address
                    </Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="admin@cherrydance.com"
                      value={credentials.email}
                      onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                      required
                      className="admin-input"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>
                      <FaLock className="me-2" />
                      Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter password"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      required
                      className="admin-input"
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    className="w-100 admin-login-btn"
                    disabled={loading}
                  >
                    {loading ? 'Logging in...' : 'Login to Dashboard'}
                  </Button>
                </Form>

                <div className="text-center mt-4">
                  <small className="text-muted">
                    Default: admin@cherrydance.com / cherry123
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminLogin;
