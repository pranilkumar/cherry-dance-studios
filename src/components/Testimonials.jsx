import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FaStar, FaQuoteLeft, FaUserCircle } from 'react-icons/fa';
import '../styles/Testimonials.css';

const testimonials = [
  {
    name: 'Anonymous',
    role: 'Hip-Hop Student',
    rating: 5,
    text: 'The instructors are incredibly talented and patient. I went from being a beginner to performing on stage in just a few months!',
    color: '#FF6B9D'
  },
  {
    name: 'Anonymous',
    role: 'Bollywood Student',
    rating: 5,
    text: 'Finding this studio was a dream come true. The teaching style connects tradition with modern expression beautifully.',
    color: '#4ECDC4'
  },
  {
    name: 'Anonymous',
    role: 'Contemporary Dancer',
    rating: 5,
    text: 'The classes here are on another level. The choreography is challenging yet accessible, and the community is so supportive.',
    color: '#A29BFE'
  },
  {
    name: 'Anonymous',
    role: 'Parent',
    rating: 5,
    text: 'My child has been taking kids classes for several months now. Their coordination, confidence, and love for dance have grown tremendously.',
    color: '#FFD93D'
  },
  {
    name: 'Anonymous',
    role: 'Dance Student',
    rating: 5,
    text: 'Learning dance here has been an incredible journey. The attention to detail in teaching is exceptional.',
    color: '#FD79A8'
  },
  {
    name: 'Anonymous',
    role: 'Freestyle Dancer',
    rating: 5,
    text: 'The freestyle classes help you discover your unique style. The energy in class is electric, and the community is welcoming!',
    color: '#74B9FF'
  }
];

const Testimonials = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  };

  const cardVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FaStar
        key={index}
        className={`star-icon ${index < rating ? 'filled' : ''}`}
      />
    ));
  };

  return (
    <section id="testimonials" className="testimonials-section">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title text-center mb-2">What Our Students Say</h2>
          <p className="section-subtitle text-center mb-5">
            Don't just take our word for it—hear from our dance family
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Row>
            {testimonials.map((testimonial, index) => (
              <Col key={index} xs={12} md={6} lg={4} className="mb-4">
                <motion.div 
                  variants={cardVariants}
                  whileHover={{ y: -10, transition: { duration: 0.3 } }}
                >
                  <Card 
                    className="testimonial-card h-100"
                    style={{ '--accent-color': testimonial.color }}
                  >
                    <div className="quote-icon">
                      <FaQuoteLeft />
                    </div>
                    
                    <Card.Body>
                      <div className="testimonial-header">
                        <div className="avatar" style={{ backgroundColor: testimonial.color }}>
                          <FaUserCircle />
                        </div>
                        <div className="user-info">
                          <h4 className="user-name">{testimonial.name}</h4>
                          <p className="user-role">{testimonial.role}</p>
                        </div>
                      </div>

                      <div className="rating">
                        {renderStars(testimonial.rating)}
                      </div>

                      <p className="testimonial-text">
                        "{testimonial.text}"
                      </p>
                    </Card.Body>

                    <div 
                      className="card-accent" 
                      style={{ backgroundColor: testimonial.color }}
                    />
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>

        <motion.div
          className="text-center mt-5"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="testimonial-cta">
            <h3>Ready to Start Your Dance Journey?</h3>
            <p>Join hundreds of happy dancers at Cherry Dance Studios</p>
            <a href="#register" className="cta-button">
              Book Your Free Trial Class
            </a>
          </div>
        </motion.div>
      </Container>
    </section>
  );
};

export default Testimonials;
