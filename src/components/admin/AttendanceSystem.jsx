import { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Modal, Badge, Alert } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaQrcode, FaCheckCircle, FaClock, FaUsers, FaCalendarDay,
  FaCamera, FaDownload, FaMobileAlt, FaBolt, FaChartBar
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import '../../styles/AttendanceSystem.css';

const AttendanceSystem = () => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [todayStats, setTodayStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    totalClasses: 0
  });
  const [scannerActive, setScannerActive] = useState(false);
  const videoRef = useRef(null);

  // Sample classes data
  const classes = [
    {
      id: 1,
      name: 'Hip-Hop Beginners',
      time: '10:00 AM - 11:00 AM',
      instructor: 'Sarah Johnson',
      capacity: 20,
      enrolled: 18,
      status: 'active'
    },
    {
      id: 2,
      name: 'Ballet Advanced',
      time: '2:00 PM - 3:30 PM',
      instructor: 'Michael Chen',
      capacity: 15,
      enrolled: 15,
      status: 'upcoming'
    },
    {
      id: 3,
      name: 'Contemporary Dance',
      time: '6:00 PM - 7:30 PM',
      instructor: 'Emma Williams',
      capacity: 25,
      enrolled: 22,
      status: 'upcoming'
    }
  ];

  // Sample attendance records
  const recentAttendance = [
    {
      id: 1,
      studentName: 'Alex Thompson',
      className: 'Hip-Hop Beginners',
      time: '9:58 AM',
      status: 'on-time',
      method: 'QR Scan'
    },
    {
      id: 2,
      studentName: 'Maria Garcia',
      className: 'Hip-Hop Beginners',
      time: '10:05 AM',
      status: 'late',
      method: 'QR Scan'
    },
    {
      id: 3,
      studentName: 'John Smith',
      className: 'Hip-Hop Beginners',
      time: '9:55 AM',
      status: 'on-time',
      method: 'Face Recognition'
    }
  ];

  useEffect(() => {
    // Simulate loading attendance data
    setAttendanceData(recentAttendance);
    setTodayStats({
      present: 45,
      absent: 8,
      late: 5,
      totalClasses: 6
    });
  }, []);

  const generateQRCode = (classData) => {
    // In production, this would generate a secure token
    const qrData = {
      classId: classData.id,
      className: classData.name,
      timestamp: new Date().toISOString(),
      sessionId: `CLS-${classData.id}-${Date.now()}`
    };
    return JSON.stringify(qrData);
  };

  const handleGenerateQR = (classItem) => {
    setSelectedClass(classItem);
    setShowQRModal(true);
    toast.success('QR Code generated for ' + classItem.name);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('attendance-qr');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-${selectedClass.name}-${Date.now()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      
      toast.success('QR Code downloaded!');
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScannerActive(true);
        toast.success('Scanner activated! Point camera at QR code');
      }
    } catch (error) {
      toast.error('Camera access denied. Please enable camera permissions.');
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      setScannerActive(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'on-time':
        return 'success';
      case 'late':
        return 'warning';
      case 'absent':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <section className="attendance-system-section">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-header"
        >
          <h2><FaQrcode /> Smart Attendance System</h2>
          <p>Contactless check-in with QR codes and biometric options</p>
        </motion.div>

        {/* Today's Stats */}
        <Row className="stats-row">
          <Col lg={3} md={6} className="mb-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="stat-card present">
                <Card.Body>
                  <div className="stat-icon">
                    <FaCheckCircle />
                  </div>
                  <h3>{todayStats.present}</h3>
                  <p>Present Today</p>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="stat-card late">
                <Card.Body>
                  <div className="stat-icon">
                    <FaClock />
                  </div>
                  <h3>{todayStats.late}</h3>
                  <p>Late Arrivals</p>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="stat-card absent">
                <Card.Body>
                  <div className="stat-icon">
                    <FaUsers />
                  </div>
                  <h3>{todayStats.absent}</h3>
                  <p>Absent</p>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="stat-card classes">
                <Card.Body>
                  <div className="stat-icon">
                    <FaCalendarDay />
                  </div>
                  <h3>{todayStats.totalClasses}</h3>
                  <p>Classes Today</p>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>

        <Row>
          {/* Active Classes */}
          <Col lg={6} className="mb-4">
            <Card className="classes-card">
              <Card.Body>
                <div className="card-header-custom">
                  <h4><FaBolt /> Active Classes</h4>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={startScanner}
                  >
                    <FaCamera /> Scan QR
                  </Button>
                </div>

                <div className="classes-list">
                  {classes.map((classItem, index) => (
                    <motion.div
                      key={classItem.id}
                      className="class-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="class-info">
                        <h5>{classItem.name}</h5>
                        <div className="class-details">
                          <span><FaClock /> {classItem.time}</span>
                          <span><FaUsers /> {classItem.enrolled}/{classItem.capacity}</span>
                        </div>
                        <p className="instructor-name">{classItem.instructor}</p>
                      </div>
                      <div className="class-actions">
                        <Badge 
                          bg={classItem.status === 'active' ? 'success' : 'secondary'}
                          className="status-badge"
                        >
                          {classItem.status}
                        </Badge>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleGenerateQR(classItem)}
                        >
                          <FaQrcode /> Generate QR
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Recent Attendance */}
          <Col lg={6} className="mb-4">
            <Card className="attendance-card">
              <Card.Body>
                <div className="card-header-custom">
                  <h4><FaChartBar /> Recent Check-ins</h4>
                  <Badge bg="success" className="live-badge">
                    <span className="pulse-dot"></span> Live
                  </Badge>
                </div>

                <div className="attendance-list">
                  <AnimatePresence>
                    {attendanceData.map((record, index) => (
                      <motion.div
                        key={record.id}
                        className="attendance-item"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="attendance-avatar">
                          {record.studentName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="attendance-info">
                          <h6>{record.studentName}</h6>
                          <p>{record.className}</p>
                          <span className="attendance-method">
                            {record.method === 'QR Scan' ? <FaQrcode /> : <FaCamera />}
                            {record.method}
                          </span>
                        </div>
                        <div className="attendance-status">
                          <Badge bg={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                          <span className="attendance-time">{record.time}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Feature Highlights */}
        <Row className="features-row">
          <Col md={4} className="mb-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="feature-box"
            >
              <FaQrcode className="feature-icon" />
              <h5>QR Code Check-in</h5>
              <p>Fast and contactless attendance marking with unique QR codes for each session</p>
            </motion.div>
          </Col>
          <Col md={4} className="mb-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="feature-box"
            >
              <FaCamera className="feature-icon" />
              <h5>Face Recognition</h5>
              <p>Optional biometric check-in for hands-free attendance tracking</p>
            </motion.div>
          </Col>
          <Col md={4} className="mb-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="feature-box"
            >
              <FaMobileAlt className="feature-icon" />
              <h5>Mobile App</h5>
              <p>Students can check in using our mobile app with saved QR codes</p>
            </motion.div>
          </Col>
        </Row>
      </Container>

      {/* QR Code Modal */}
      <Modal
        show={showQRModal}
        onHide={() => setShowQRModal(false)}
        centered
        className="qr-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaQrcode /> Class QR Code
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClass && (
            <div className="qr-content">
              <div className="qr-info">
                <h5>{selectedClass.name}</h5>
                <p><FaClock /> {selectedClass.time}</p>
                <p><FaUsers /> {selectedClass.instructor}</p>
              </div>
              
              <div className="qr-code-container">
                <QRCodeSVG
                  id="attendance-qr"
                  value={generateQRCode(selectedClass)}
                  size={280}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: "/logo.png",
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </div>

              <Alert variant="info" className="qr-alert">
                <FaMobileAlt /> Students can scan this QR code to check in. 
                Code expires in 30 minutes.
              </Alert>

              <div className="qr-actions">
                <Button variant="primary" onClick={handleDownloadQR}>
                  <FaDownload /> Download QR Code
                </Button>
                <Button variant="outline-secondary">
                  <FaMobileAlt /> Share via App
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Scanner Modal */}
      <Modal
        show={scannerActive}
        onHide={stopScanner}
        centered
        size="lg"
        className="scanner-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaCamera /> Scan QR Code
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="scanner-container">
            <video ref={videoRef} autoPlay playsInline className="scanner-video" />
            <div className="scanner-overlay">
              <div className="scanner-frame"></div>
            </div>
            <p className="scanner-instructions">
              Position the QR code within the frame
            </p>
          </div>
        </Modal.Body>
      </Modal>
    </section>
  );
};

export default AttendanceSystem;
