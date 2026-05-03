import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaHeart, FaArrowRight } from 'react-icons/fa';
import '../styles/EventBanner.css';

// Event expires end of May 9, 2026 (Barrhaven local time)
const EVENT_END = new Date('2026-05-10T04:00:00Z'); // May 9 midnight EDT = May 10 04:00 UTC

const EventBanner = () => {
  if (new Date() > EVENT_END) return null;

  return (
    <section className="event-banner-section">
      <Container>
        <motion.div
          className="event-banner-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="event-banner-header">
            <span className="event-tag">Upcoming Event</span>
            <h2 className="event-title">
              <FaHeart className="event-heart" /> Mom &amp; Me Dance Workshop
            </h2>
            <p className="event-subtitle">Celebrate the bond through dance — Mother's Day Special</p>
          </div>

          {/* Details Row */}
          <Row className="event-details-row g-3 justify-content-center">
            <Col xs={12} sm={4} className="event-detail-col">
              <div className="event-detail-item">
                <FaCalendarAlt className="event-detail-icon" />
                <div>
                  <div className="event-detail-label">Date</div>
                  <div className="event-detail-value">Saturday, May 9, 2026</div>
                </div>
              </div>
            </Col>
            <Col xs={12} sm={4} className="event-detail-col">
              <div className="event-detail-item">
                <FaClock className="event-detail-icon" />
                <div>
                  <div className="event-detail-label">Time</div>
                  <div className="event-detail-value">6:00 PM – 8:00 PM</div>
                </div>
              </div>
            </Col>
            <Col xs={12} sm={4} className="event-detail-col">
              <div className="event-detail-item">
                <FaMapMarkerAlt className="event-detail-icon" />
                <div>
                  <div className="event-detail-label">Venue</div>
                  <div className="event-detail-value">Barrhaven, Ottawa (TBC)</div>
                </div>
              </div>
            </Col>
          </Row>

          {/* Pricing + Perks */}
          <div className="event-pricing-row">
            <div className="event-pricing-block">
              <div className="pricing-pill">Mom + 1 Kid &nbsp;<strong>$25</strong></div>
              <div className="pricing-pill">Mom + 2 Kids &nbsp;<strong>$30</strong></div>
            </div>
            <div className="event-perks">
              <span className="event-perk">Video Recording Included</span>
              <span className="event-perk">Snacks Included</span>
            </div>
          </div>

          {/* CTA */}
          <div className="event-cta">
            <p className="event-cta-note">Limited spots only — register now to secure your spot!</p>
            <div className="event-cta-buttons">
              <Link to="/mnm">
                <Button className="event-cta-button">
                  <FaArrowRight className="me-2" /> Register Now
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
};

export default EventBanner;
