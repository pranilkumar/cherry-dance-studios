import React, { useState, useEffect, useRef } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHome, FaInfoCircle, FaDumbbell, FaImages, FaUserTie, FaEnvelope, FaUserPlus } from 'react-icons/fa';
import CP from '../assets/icons/logo.png';
import '../styles/NavigationBar.css';

const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeLink, setActiveLink] = useState('home');
  const [scrolled, setScrolled] = useState(false);
  const navbarRef = useRef(null);

  // Update active link based on current route
  useEffect(() => {
    const path = location.pathname;
    const pathToId = {
      '/': 'home',
      '/about': 'about',
      '/classes': 'classes',
      '/gallery': 'gallery',
      '/instructors': 'instructors',
      '/contact': 'contact',
      '/register': 'register'
    };
    
    if (pathToId[path]) {
      setActiveLink(pathToId[path]);
    }
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); 

  useEffect(() => {
    // Only track scroll position on the home page
    if (location.pathname !== '/') return;

    const sections = [
      { id: 'home', element: document.getElementById('home') },
      { id: 'about', element: document.getElementById('about') },
      { id: 'classes', element: document.getElementById('classes') },
      { id: 'pricing', element: document.getElementById('pricing') },
      { id: 'gallery', element: document.getElementById('gallery') },
      { id: 'instructors', element: document.getElementById('instructors') },
      { id: 'faq', element: document.getElementById('faq') },
      { id: 'contact', element: document.getElementById('contact') },
      { id: 'register', element: document.getElementById('register') },
    ].filter(sec => sec.element); 

    const handleScroll = () => {
      const navbarHeight = navbarRef.current ? navbarRef.current.offsetHeight : 0;
      const scrollPos = window.scrollY + navbarHeight + 1;
      let currentActive = 'home';

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i].element;
        const sectionId = sections[i].id;

        if (section && scrollPos >= section.offsetTop && scrollPos < (section.offsetTop + section.offsetHeight)) {
          currentActive = sectionId;
          break;
        }
      }

      if (activeLink !== currentActive) {
        setActiveLink(currentActive);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeLink, location.pathname]); 

  const handleNavClick = (id) => {
    const currentPath = location.pathname;
    
    // Check if we're on the home page
    if (currentPath === '/') {
      // On home page - scroll to section
      setActiveLink(id);
      const section = document.getElementById(id);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // On other pages - navigate to respective route or home
      const routeMap = {
        'home': '/',
        'about': '/about',
        'classes': '/classes',
        'instructors': '/instructors',
        'contact': '/contact',
        'gallery': '/gallery'
      };
      
      if (routeMap[id]) {
        navigate(routeMap[id]);
      } else {
        // If no specific route, go to home and scroll
        navigate('/');
        setTimeout(() => {
          const section = document.getElementById(id);
          if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: FaHome },
    { id: 'about', label: 'About', icon: FaInfoCircle },
    { id: 'classes', label: 'Classes', icon: FaDumbbell },
    { id: 'gallery', label: 'Gallery', icon: FaImages },
    { id: 'instructors', label: 'Instructors', icon: FaUserTie },
    { id: 'contact', label: 'Contact', icon: FaEnvelope },
  ];

  return (
    <Navbar 
      ref={navbarRef} 
      variant="dark" 
      expand="lg" 
      fixed="top" 
      className={`modern-navbar ${scrolled ? 'scrolled' : ''}`}
    >
      <Container fluid>
        <Navbar.Brand 
          onClick={() => handleNavClick('home')} 
          className="modern-brand"
        >
          <motion.div
            className="brand-container"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img src={CP} alt="Logo" className="brand-logo" />
            <span className="brand-text">Cherry <span className="brand-accent">Dance Studios</span></span>
          </motion.div>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav" className="modern-toggler" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto align-items-center">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Nav.Link
                    onClick={() => handleNavClick(item.id)}
                    className={`modern-nav-link ${activeLink === item.id ? 'active' : ''}`}
                  >
                    <Icon className="nav-icon" />
                    <span>{item.label}</span>
                  </Nav.Link>
                </motion.div>
              );
            })}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Nav.Link
                onClick={handleRegisterClick}
                className="register-btn-nav"
              >
                <FaUserPlus className="me-2" />
                Register
              </Nav.Link>
            </motion.div>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
