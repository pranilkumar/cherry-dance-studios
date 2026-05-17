'use client';
// src/RegistrationBanner.jsx
import React from 'react';
import { Modal, Button, Container, Row, Col } from 'react-bootstrap';
import '../styles/RegistrationBanner.css';

const RegistrationBanner = ({ show, onHide }) => {
  return (
    <Modal show={show} onHide={onHide} centered className="registration-modal">
      <Modal.Header closeButton className="registration-modal-header">
        <Modal.Title className="text-center w-100">
          <i className="fa-solid fa-fire-flame-curved me-2"></i>Few Slots Left!
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="registration-modal-body">
        <Container fluid>
          <Row className="justify-content-center text-center">
            <Col xs={12}>
              <p className="banner-text mb-4">
                Don't miss out on your chance to join our vibrant dance community. Secure your spot today!
              </p>
              <Button href="#register" className="register-now-button" onClick={onHide}>
                Register Now <i className="fa-solid fa-arrow-right ms-2"></i>
              </Button>
            </Col>
          </Row>
        </Container>
      </Modal.Body>
    </Modal>
  );
};

export default RegistrationBanner;