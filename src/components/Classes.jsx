import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FaBolt, FaPalette, FaTheaterMasks } from 'react-icons/fa';
import '../styles/Classes.css';

const classData = [
  {
    title: 'Little Stars',
    ageGroup: 'Ages 4–7',
    description: 'A fun and nurturing introduction to dance. Build coordination, confidence, and a love for movement.',
    slots: [
      { days: 'Tuesday & Thursday', time: '5:45 PM – 6:30 PM' }
    ],
    duration: '45 min per class',
    icon: FaPalette,
    color: '#D1060F'
  },
  {
    title: 'The Crew',
    ageGroup: 'Ages 7–10',
    description: 'Structured choreography, rhythm training, and creative expression in a supportive environment.',
    slots: [
      { days: 'Monday & Wednesday', time: '6:00 PM – 7:00 PM' },
      { days: 'Tuesday & Thursday', time: '6:30 PM – 7:30 PM' }
    ],
    duration: '60 min per class',
    icon: FaTheaterMasks,
    color: '#1d1d1f'
  },
  {
    title: 'Slay Squad',
    ageGroup: 'Ages 10+',
    description: 'Intensive Bollywood, freestyle, and choreography training for dedicated dancers ready to level up.',
    slots: [
      { days: 'Monday & Wednesday', time: '7:00 PM – 8:00 PM' }
    ],
    duration: '2 hrs per class',
    icon: FaBolt,
    color: '#D1060F'
  }
];

const Classes = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <section id="classes" className="classes-section">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title text-center mb-2">Our Classes</h2>
          <p className="section-subtitle text-center mb-5">
            Classes for all age groups — register to discuss fees and availability
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          <Row className="justify-content-center">
            {classData.map((cls, index) => (
              <Col key={index} xs={12} md={6} lg={4} className="mb-4">
                <motion.div variants={cardVariants} whileHover={{ y: -8, transition: { duration: 0.3 } }}>
                  <div className="class-card">
                    <div className="class-card-header" style={{ background: cls.color }}>
                      <cls.icon className="class-card-icon" />
                      <span className="class-age-badge">{cls.ageGroup}</span>
                    </div>
                    <div className="class-card-body">
                      <h3 className="class-title">{cls.title}</h3>
                      <p className="class-description">{cls.description}</p>

                      <div className="class-schedule">
                        <div className="schedule-label">Schedule</div>
                        {cls.slots.map((slot, i) => (
                          <div key={i} className="schedule-slot">
                            <span className="slot-days">{slot.days}</span>
                            <span className="slot-time">{slot.time}</span>
                          </div>
                        ))}
                      </div>

                      <div className="class-duration">
                        <span className="duration-label">Duration: </span>
                        <span className="duration-value">{cls.duration}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>

        <motion.div
          className="text-center mt-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="class-note">
            <strong>Interested?</strong> Register below and we'll get in touch to discuss availability and fees.
          </p>
        </motion.div>
      </Container>
    </section>
  );
};

export default Classes;
