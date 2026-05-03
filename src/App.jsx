// src/App.jsx
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '40px', fontFamily: 'monospace', background: '#fff', color: '#d00' }}>
          <h2>App crashed — error details:</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{this.state.error?.toString()}{'\n\n'}{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
import { Toaster } from 'react-hot-toast';

// Main page components
import NavigationBar from './components/NavigationBar';
import Home from './components/Home';
import About from './components/About';
import Classes from './components/Classes';
import Instructors from './components/Instructors';
import Gallery from './components/Gallery';
import FAQ from './components/FAQ';
import Contact from './components/Contact';
import RegistrationBanner from './components/RegistrationBanner';
import EventBanner from './components/EventBanner';
import Register from './components/Register';
import Footer from './components/Footer';
import AIAssistant from './components/AIAssistant';
import PWABar from './components/PWABar';

// Full Gallery page component
import FullGallery from './components/FullGallery';
import MnMRegistration from './components/MnMRegistration';

// Admin components
import AdminLogin from './components/admin/AdminLogin';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import StudentManagement from './components/admin/StudentManagement';
import FeeManagement from './components/admin/FeeManagement';
import RegistrationManagement from './components/admin/RegistrationManagement';
import AnalyticsDashboard from './components/admin/AnalyticsDashboard';
import AttendanceSystem from './components/admin/AttendanceSystem';
import ProtectedRoute from './components/admin/ProtectedRoute';

import 'bootstrap/dist/css/bootstrap.min.css';

// HomePage holds all main sections
const HomePage = ({ showModalBanner, handleModalHide }) => {
  return (
    <>
      <main>
        <Home />
        <EventBanner />
        <About />
        <Classes />
        <Gallery />
        <Instructors />
        <FAQ />
        <Contact />
        <Register />
      </main>
      <Footer />
      <AIAssistant />
      <RegistrationBanner
        show={showModalBanner}
        onHide={handleModalHide}
      />
    </>
  );
};

function App() {
  const [showModalBanner, setShowModalBanner] = useState(false);

  // Disabled the popup banner - can be re-enabled later
  // useEffect(() => {
  //   const timer1 = setTimeout(() => setShowModalBanner(true), 12000);
  //   const timer2 = setTimeout(() => setShowModalBanner(true), 42000);

  //   return () => {
  //     clearTimeout(timer1);
  //     clearTimeout(timer2);
  //   };
  // }, []);

  const handleModalHide = () => setShowModalBanner(false);

  return (
    <ErrorBoundary>
    <Router>
      <PWABar />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1d1d1f',
            padding: '14px 18px',
            borderRadius: '14px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            fontSize: '0.9rem',
          },
          success: {
            iconTheme: {
              primary: '#0071e3',
              secondary: '#fff',
            },
          },
        }}
      />
      <NavigationBar />
      <Routes>
        {/* Main home page with all sections */}
        <Route 
          path="/" 
          element={
            <HomePage 
              showModalBanner={showModalBanner} 
              handleModalHide={handleModalHide} 
            />
          } 
        />
        
        {/* Dedicated routes for each section */}
        <Route path="/about" element={
          <>
            <About />
            <Footer />
          </>
        } />
        
        <Route path="/classes" element={
          <>
            <Classes />
            <Footer />
          </>
        } />
        
        <Route path="/instructors" element={
          <>
            <Instructors />
            <Footer />
          </>
        } />
        
        <Route path="/faq" element={
          <>
            <FAQ />
            <Footer />
          </>
        } />
        
        <Route path="/contact" element={
          <>
            <Contact />
            <Footer />
          </>
        } />
        
        {/* Dedicated Register page */}
        <Route path="/register" element={
          <>
            <Register />
            <Footer />
          </>
        } />
        
        {/* Full gallery page */}
        <Route path="/gallery" element={<FullGallery />} />

        {/* MnM Mother's Day Workshop registration */}
        <Route path="/mnm" element={<MnMRegistration />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/*" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="attendance" element={<AttendanceSystem />} />
          <Route path="registrations" element={<RegistrationManagement />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="fees" element={<FeeManagement />} />
        </Route>
      </Routes>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
