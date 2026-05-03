import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { motion, useInView } from 'framer-motion';
import { FaUsers, FaTrophy, FaCalendarAlt, FaHeart } from 'react-icons/fa';
import '../styles/Stats.css';

const statsData = [
  {
    icon: <FaUsers />,
    value: 500,
    suffix: '+',
    label: 'Happy Students',
    color: '#D1060F'
  },
  {
    icon: <FaCalendarAlt />,
    value: 15,
    suffix: '+',
    label: 'Years Experience',
    color: '#ffffff'
  },
  {
    icon: <FaTrophy />,
    value: 50,
    suffix: '+',
    label: 'Performances',
    color: '#D1060F'
  },
  {
    icon: <FaHeart />,
    value: 100,
    suffix: '%',
    label: 'Satisfaction Rate',
    color: '#ffffff'
  }
];

const AnimatedCounter = ({ end, duration = 2, suffix = '', inView }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / (duration * 1000);

      if (progress < 1) {
        setCount(Math.floor(end * progress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, inView]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
};

const Stats = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { scale: 0.5, opacity: 0 },
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
    <section className="stats-section" ref={ref}>
      <Container>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <Row>
            {statsData.map((stat, index) => (
              <Col key={index} xs={6} md={3} className="mb-4 mb-md-0">
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.1, transition: { duration: 0.3 } }}
                >
                  <div className="stat-item" style={{ '--stat-color': stat.color }}>
                    <div className="stat-icon" style={{ color: stat.color }}>
                      {stat.icon}
                    </div>
                    <div className="stat-value">
                      <AnimatedCounter 
                        end={stat.value} 
                        suffix={stat.suffix}
                        inView={inView}
                      />
                    </div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>
      </Container>
    </section>
  );
};

export default Stats;
