import React, { useState } from 'react';
import { Container, Row, Col, Accordion } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FaChevronDown } from 'react-icons/fa';
import '../styles/FAQ.css';

const faqData = [
  {
    question: 'Do I need prior dance experience to join?',
    answer: 'Not at all! We welcome dancers of all levels, from complete beginners to advanced performers. Our instructors tailor their teaching to match each student\'s pace. Just register and we\'ll guide you from there!'
  },
  {
    question: 'What should I wear to class?',
    answer: 'Wear comfortable, breathable clothing that allows you to move freely — like athletic wear, leggings, or shorts. Clean indoor sneakers or dance shoes work best. Some styles may be done barefoot.'
  },
  {
    question: 'How do I register for classes?',
    answer: 'Simply fill out the registration form on this website and our team will get in touch to confirm your spot and discuss details. You can also reach us directly at 613 890 3789 or email cherrydancestudio.cds@gmail.com.'
  },
  {
    question: 'What age groups do you teach?',
    answer: 'We offer classes for three age groups: Little Stars (Ages 4–7), Junior Dancers (Ages 7–10), and Teens (10+). There\'s a place for every young dancer at Cherry Dance Studios!'
  },
  {
    question: 'What are the class timings?',
    answer: 'Classes run on weekday evenings. Little Stars meet Tuesday & Thursday (5:45–6:30 PM). Junior Dancers have two batch options: Mon & Wed (6:00–7:00 PM) or Tue & Thu (6:30–7:30 PM). Teens (10+) train Mon & Wed (7:00–8:00 PM).'
  },
  {
    question: 'What dance styles do you teach?',
    answer: 'We specialize in Bollywood, Hip-Hop, Contemporary, and Indian semi-classical dance. Our instructors bring energy, tradition, and creativity into every class.'
  },
  {
    question: 'Do you offer private lessons?',
    answer: 'Yes! We offer personalized sessions for students who want individual attention or want to prepare for a specific event or performance. Contact us for availability.'
  },
  {
    question: 'What if I have more questions?',
    answer: 'We\'re always happy to help! Reach us at 613 890 3789, email cherrydancestudio.cds@gmail.com, or send us a message on Instagram or Facebook. Studio hours are weekdays 6:00 PM – 8:00 PM.'
  }
];

const FAQ = () => {
  const [activeKey, setActiveKey] = useState(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <section id="faq" className="faq-section">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title text-center mb-2">Frequently Asked Questions</h2>
          <p className="section-subtitle text-center mb-5">
            Everything you need to know about Cherry Dance Studios
          </p>
        </motion.div>

        <Row className="justify-content-center">
          <Col lg={10} xl={8}>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              <Accordion activeKey={activeKey} onSelect={(key) => setActiveKey(key)}>
                {faqData.map((faq, index) => (
                  <motion.div key={index} variants={itemVariants}>
                    <Accordion.Item eventKey={String(index)} className="faq-item">
                      <Accordion.Header className="faq-header">
                        <span className="faq-number">{String(index + 1).padStart(2, '0')}</span>
                        <span className="faq-question">{faq.question}</span>
                        <FaChevronDown className={`faq-icon ${activeKey === String(index) ? 'rotated' : ''}`} />
                      </Accordion.Header>
                      <Accordion.Body className="faq-answer">
                        {faq.answer}
                      </Accordion.Body>
                    </Accordion.Item>
                  </motion.div>
                ))}
              </Accordion>
            </motion.div>
          </Col>
        </Row>

        <motion.div
          className="faq-cta text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h3>Still Have Questions?</h3>
          <p>Our friendly team is here to help!</p>
          <a href="#contact" className="cta-button">Contact Us</a>
        </motion.div>
      </Container>
    </section>
  );
};

export default FAQ;
