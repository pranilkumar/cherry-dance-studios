import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import '../styles/Contact.css';

const contactInfo = [
  {
    icon: <FaMapMarkerAlt />,
    title: 'Visit Us',
    details: ['Barrhaven, Ottawa, ON', 'DM us to get address details', 'Cherry Dance Studios'],
    color: '#D1060F'
  },
  {
    icon: <FaPhone />,
    title: 'Call Us',
    details: ['+1 (613) 890-3789', 'Call or Text', 'Mon-Fri: 6-7 PM & 7-8 PM'],
    link: 'tel:+16138903789',
    color: '#8a0000'
  },
  {
    icon: <FaEnvelope />,
    title: 'Email Us',
    details: ['cherrydancestudio.cds@gmail.com', 'We reply within 24 hours', 'Open for inquiries'],
    link: 'mailto:cherrydancestudio.cds@gmail.com',
    color: '#D1060F'
  },
  {
    icon: <FaClock />,
    title: 'Studio Hours',
    details: ['Monday to Friday', '6:00 PM - 7:00 PM & 7:00 PM - 8:00 PM', 'Two time slots available'],
    color: '#8a0000'
  }
];

const socialMedia = [
  { icon: <FaFacebookF />, name: 'Facebook', link: 'https://www.facebook.com/share/1A4R3ZMtZS/', color: '#D1060F' },
  { icon: <FaInstagram />, name: 'Instagram', link: 'https://www.instagram.com/cherrypranil?igsh=MXIzYXE0OGt4ZmJ0Zg==', color: '#a80000' },
  { icon: <FaWhatsapp />, name: 'WhatsApp', link: 'https://wa.me/16138903789', color: '#8a0000' }
];

const Contact = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <section id="contact" className="contact-section">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title text-center mb-2">Get In Touch</h2>
          <p className="section-subtitle text-center mb-5">
            Have questions? We'd love to hear from you!
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <Row className="mb-5">
            {contactInfo.map((info, index) => (
              <Col key={index} xs={12} md={6} lg={3} className="mb-4">
                <motion.div variants={itemVariants}>
                  <div className="contact-card" style={{ '--card-color': info.color }}>
                    <div className="contact-icon" style={{ color: info.color }}>
                      {info.icon}
                    </div>
                    <h4 className="contact-title">{info.title}</h4>
                    <div className="contact-details">
                      {info.details.map((detail, idx) => (
                        <p key={idx}>
                          {info.link && idx === 0 ? (
                            <a href={info.link} style={{ color: info.color }}>
                              {detail}
                            </a>
                          ) : (
                            detail
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>

        <motion.div
          className="map-container"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <h3 className="text-center mb-4">Find Us on the Map</h3>
          <div className="map-wrapper">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d22388.91299634982!2d-75.76134289999999!3d45.27298535!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4cce0e1d8e1e1e1d%3A0x1e1e1e1e1e1e1e1e!2sBarrhaven%2C%20Ottawa%2C%20ON!5e0!3m2!1sen!2sca!4v1234567890123"
              width="100%"
              height="400"
              style={{ border: 0, borderRadius: '15px' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Cherry Dance Studios - Barrhaven Location"
            ></iframe>
          </div>
        </motion.div>

        <motion.div
          className="social-section text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <h3 className="mb-4">Connect With Us</h3>
          <div className="social-links">
            {socialMedia.map((social, index) => (
              <motion.a
                key={index}
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                style={{ backgroundColor: social.color }}
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                {social.icon}
                <span className="social-name">{social.name}</span>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </Container>

      {/* WhatsApp Floating Button */}
      <motion.a
        href="https://wa.me/16138903789"
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <FaWhatsapp />
      </motion.a>
    </section>
  );
};

export default Contact;
