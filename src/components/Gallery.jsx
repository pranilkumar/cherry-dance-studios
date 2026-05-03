import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaExpand } from 'react-icons/fa';
import '../styles/Gallery.css';

import galleryImage1 from '../assets/images/Image1.webp';
import galleryImage2 from '../assets/images/Image2.webp';
import galleryImage3 from '../assets/images/Image3.webp';
import galleryImage4 from '../assets/images/Image4.webp';
import galleryImage5 from '../assets/images/Image5.webp';
import galleryImage6 from '../assets/images/Image6.webp';
import galleryImage7 from '../assets/images/Image7.webp';
import galleryImage8 from '../assets/images/Image8.webp';
import holiImage1 from '../assets/images/holi1.jpg';
import holiImage3 from '../assets/images/holi3.jpg';
import holiImage4 from '../assets/images/holi4.jpg';
import iffGroup from '../assets/images/IFF Group Picture.JPG';
import mothersDayWorkshop from '../assets/images/Mothers day workshop.jpg';
import ugadiDhamaka from '../assets/images/ugadi dhamaka.jpg';
import ugadiKids from '../assets/images/ugadi kids.jpg';
import ugadiKids2 from '../assets/images/ugadi kids 2.jpg';
import ugadiOTA2025 from '../assets/images/Ugadi OTA 2025.png';
import ugadiOTA2026 from '../assets/images/Ugadi OTA 2026.jpg';
import ugadiOTA20262 from '../assets/images/Ugadi OTA 2026 2.JPG';

const galleryImages = [
  { src: ugadiOTA2026, alt: 'Ugadi OTA 2026' },
  { src: ugadiOTA20262, alt: 'Ugadi OTA 2026 — Group' },
  { src: ugadiKids, alt: 'Ugadi — Kids Performance' },
  { src: ugadiKids2, alt: 'Ugadi — Kids Performance 2' },
  { src: ugadiDhamaka, alt: 'Ugadi Dhamaka' },
  { src: ugadiOTA2025, alt: 'Ugadi OTA 2025' },
  { src: iffGroup, alt: 'IFF Group Picture' },
  { src: mothersDayWorkshop, alt: "Mother's Day Workshop" },
  { src: holiImage3, alt: 'Holi Festival — Group Pose' },
  { src: holiImage1, alt: 'Holi Festival — Rang Barse' },
  { src: holiImage4, alt: 'Holi Festival — Team Photo' },
  { src: galleryImage1, alt: 'Dance Performance 1' },
  { src: galleryImage2, alt: 'Dance Performance 2' },
  { src: galleryImage3, alt: 'Dance Performance 3' },
  { src: galleryImage4, alt: 'Dance Performance 4' },
  { src: galleryImage5, alt: 'Dance Performance 5' },
  { src: galleryImage6, alt: 'Dance Performance 6' },
  { src: galleryImage7, alt: 'Dance Performance 7' },
  { src: galleryImage8, alt: 'Dance Performance 8' },
];

const Gallery = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedImage(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const imageVariants = {
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

  return (
    <section id="gallery" className="gallery-section">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title text-center mb-5">Our Gallery</h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <Row>
            {galleryImages.map((image, index) => (
              <Col key={index} xs={6} sm={6} md={4} lg={3} className="mb-4">
                <motion.div variants={imageVariants}>
                  <Card className="gallery-card" onClick={() => handleImageClick(image)}>
                    <div className="gallery-image-wrapper">
                      <Card.Img variant="top" src={image.src} alt={image.alt} />
                      <div className="gallery-overlay">
                        <FaExpand className="expand-icon" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>

        {/* The View More button that links to the full gallery page */}
        <motion.div
          className="text-center mt-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Link to="/gallery">
            <Button className="view-more-button">
              View More
            </Button>
          </Link>
        </motion.div>
      </Container>

      {/* Lightbox Modal */}
      <Modal show={showModal} onHide={handleClose} size="lg" centered className="gallery-modal">
        <Modal.Body className="p-0">
          {selectedImage && (
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="img-fluid w-100"
              style={{ borderRadius: '10px' }}
            />
          )}
        </Modal.Body>
      </Modal>
    </section>
  );
};

export default Gallery;