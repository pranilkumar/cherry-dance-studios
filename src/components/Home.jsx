import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FaPlay, FaArrowRight, FaStar } from 'react-icons/fa';
import logo from '../assets/icons/logo.png';
import '../styles/Home.css';

const Home = () => {
  const textVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.6, -0.05, 0.01, 0.99]
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-20, 20, -20],
      rotate: [0, 5, 0, -5, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <section id="home" className="home-section d-flex align-items-center">
      {/* Animated Background Elements */}
      <div className="home-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>
      
      {/* Floating Particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
      
      <Container className="home-content">
        <Row className="justify-content-center text-center">
          <Col xs={12} md={10} lg={9}>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Logo */}
              <motion.div className="hero-logo-wrap" variants={textVariants}>
                <img src={logo} alt="Cherry Dance Studios" className="hero-logo" />
              </motion.div>

              {/* Main Title */}
              <motion.h1
                className="home-title"
                variants={textVariants}
              >
                <span className="studio-name"><span className="name-cherry">Cherry</span> Dance Studios</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.h2
                className="home-subtitle"
                variants={textVariants}
              >
                Move with Passion, Dance with Heart!
              </motion.h2>

              {/* Description */}
              {/* CTA Buttons */}
              <motion.div
                className="button-group"
                variants={textVariants}
              >
                <Button className="cta-primary" size="lg" href="#register">
                  <span>Start Your Journey</span>
                  <FaArrowRight className="btn-icon" />
                </Button>
                <Button className="cta-secondary" size="lg" href="#gallery" variant="outline-light">
                  <FaPlay className="btn-icon" />
                  <span>Watch Videos</span>
                </Button>
              </motion.div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
              className="scroll-indicator"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 1 }}
            >
              <div className="mouse">
                <div className="mouse-wheel"></div>
              </div>
              <span className="scroll-text">Scroll to explore</span>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Home;