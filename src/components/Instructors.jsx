import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import '../styles/Instructors.css';

// Import images directly
import instructor1 from '../assets/images/pranil.png';
import instructor2 from '../assets/images/Shivangi.JPG';

const instructors = [
  {
    name: 'Pranil Kumar',
    image: instructor1,
    description: 'Energetic instructor with 15+ years in freestyle and hip-hop, known for dynamic choreography and a vibrant teaching style that inspires confidence and creativity.',
  },
  {
    name: 'Shivangi Agrawal',
    image: instructor2,
    description: 'Graceful instructor specializing in Bollywood and Indian semi-classical dance, known for soulful choreography, expressive storytelling, and bringing tradition to life on stage.',
  },
];

const Instructors = () => {
  return (
    <section id="instructors" className="instructors-section">
      <Container>
        <h2 className="section-title text-center mb-5">Our Instructors</h2>
        <Row>
          {instructors.map((inst, index) => (
            <Col key={index} xs={12} md={6} lg={5} className="mb-4">
              <Card className="instructor-card h-100 text-center">
                <Card.Img variant="top" src={inst.image} alt={inst.name} />
                <Card.Body>
                  <Card.Title>{inst.name}</Card.Title>
                  <Card.Text>{inst.description}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default Instructors;
