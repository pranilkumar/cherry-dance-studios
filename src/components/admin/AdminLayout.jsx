import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Nav, Navbar, Button } from 'react-bootstrap';
import { FaHome, FaUsers, FaDollarSign, FaStar, FaSignOutAlt, FaBars, FaTimes, FaClipboardList, FaChartLine, FaQrcode, FaHeart } from 'react-icons/fa';
import '../../styles/AdminModern.css';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    navigate('/admin');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h4 className="mb-0">Cherry Dance</h4>
          <span className="text-muted">Admin Portal</span>
        </div>

        <Nav className="flex-column sidebar-nav">
          <Link
            to="/admin/dashboard"
            className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
          >
            <FaHome className="me-2" />
            Dashboard
          </Link>
          <Link
            to="/admin/analytics"
            className={`nav-link ${isActive('/admin/analytics') ? 'active' : ''}`}
          >
            <FaChartLine className="me-2" />
            Analytics & AI
          </Link>
          <Link
            to="/admin/attendance"
            className={`nav-link ${isActive('/admin/attendance') ? 'active' : ''}`}
          >
            <FaQrcode className="me-2" />
            Attendance
          </Link>
          <Link
            to="/admin/registrations"
            className={`nav-link ${isActive('/admin/registrations') ? 'active' : ''}`}
          >
            <FaClipboardList className="me-2" />
            Registrations
          </Link>
          <Link
            to="/admin/workshop"
            className={`nav-link ${isActive('/admin/workshop') ? 'active' : ''}`}
          >
            <FaHeart className="me-2" />
            MnM Workshop
          </Link>
          <Link
            to="/admin/students"
            className={`nav-link ${isActive('/admin/students') ? 'active' : ''}`}
          >
            <FaUsers className="me-2" />
            Students
          </Link>
          <Link
            to="/admin/fees"
            className={`nav-link ${isActive('/admin/fees') ? 'active' : ''}`}
          >
            <FaDollarSign className="me-2" />
            Fees
          </Link>
          <Link
            to="/admin/reviews"
            className={`nav-link ${isActive('/admin/reviews') ? 'active' : ''}`}
          >
            <FaStar className="me-2" />
            Reviews
          </Link>
        </Nav>

        <div className="sidebar-footer">
          <Button variant="outline-light" onClick={handleLogout} className="w-100">
            <FaSignOutAlt className="me-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`admin-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Top Navbar */}
        <Navbar bg="white" className="admin-navbar shadow-sm">
          <Container fluid>
            <Button
              variant="link"
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </Button>
            <Navbar.Brand className="ms-2">
              Admin Dashboard
            </Navbar.Brand>
            <div className="ms-auto">
              <span className="text-muted me-3">admin@cherrydance.com</span>
            </div>
          </Container>
        </Navbar>

        {/* Page Content */}
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
