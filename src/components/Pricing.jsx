import React from 'react';
import { Container } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FaEnvelope } from 'react-icons/fa';
import '../styles/Pricing.css';

const Pricing = () => {
  return (
    <section id="pricing" className="pricing-section">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="section-title mb-2">Fees & Pricing</h2>
          <p className="section-subtitle mb-5">
            We keep our pricing personal — fees are discussed directly after you register
          </p>
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="pricing-contact-box">
            <FaEnvelope className="pricing-contact-icon" />
            <h4>Interested in joining?</h4>
            <p>
              Register below and one of our instructors will personally reach out to discuss fees,
              availability, and anything else you'd like to know.
            </p>
            <a href="#register" className="btn pricing-cta-btn">Register Now</a>
          </div>
        </motion.div>
      </Container>
    </section>
  );
                    >
                      {plan.buttonText}
                    </Button>
                  </Card.Body>
                </Card>
              </motion.div>
};

export default Pricing;
