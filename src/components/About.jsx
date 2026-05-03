import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import '../styles/About.css';
import VideoEmbed from './VideoEmbed'; // Import the new VideoEmbed component

const youtubeVideos = [
  { id: 'E60sIwe5aIc', title: 'Cherry Dance Studios - Performance 1' },
  { id: 'spQKyyn5PNU', title: 'Cherry Dance Studios - Performance 2' },
  { id: 'rM1RA0EpXmg', title: 'Cherry Dance Studios - Performance 3' },
  { id: '9WHHmYyYs2k', title: 'Cherry Dance Studios - Performance 4' },
  { id: 'elTMH3JatwI', title: 'Cherry Dance Studios - Performance 5' },
];

const About = () => {
  return (
    <section id="about" className="about-section">
      <Container>
        <Row className="justify-content-center text-center">
          <Col xs={12} lg={8}>
            <h2 className="section-title">About Us</h2>
            <p className="about-lead">
              Cherry Dance Studios is an Ottawa-based dance school dedicated to bringing
              the joy of Bollywood dance to students of all ages and
              skill levels. Founded with a passion for preserving vibrant dance traditions
              while making them fun and accessible, we welcome everyone from curious
              beginners to seasoned performers.
            </p>
            <p className="about-body">
              Our instructors create a warm, inclusive environment where students
              build confidence, technique, and a genuine love of movement. Whether you're
              enrolling your child in weekly classes or stepping onto the stage for
              a community showcase, Cherry Dance Studios is your home for dance in Ottawa.
            </p>
            <div className="about-highlights">
              <div className="about-highlight-item">
                <span>Ages 4 &amp; Up</span>
              </div>
              <div className="about-highlight-item">
                <span>Ottawa, Ontario</span>
              </div>
              <div className="about-highlight-item">
                <span>Bollywood Dance</span>
              </div>
            </div>
          </Col>
        </Row>

        <Row className="justify-content-center mt-4">
          {youtubeVideos.map((video, index) => (
            <Col
              key={index}
              xs={12}     // On extra small screens, one video per row
              sm={6}      // On small (and larger) screens, two videos per row
              className="mb-4" // Margin bottom for spacing between rows
            >
              <VideoEmbed videoId={video.id} title={video.title} />
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default About;