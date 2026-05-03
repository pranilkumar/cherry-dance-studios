import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Container, Row, Col, Card, Button, Form, Badge, Modal, Spinner } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { 
  FaCreditCard, FaApple, FaGoogle, FaBitcoin, FaCheckCircle, 
  FaShieldAlt, FaCalendarAlt, FaReceipt, FaMobileAlt 
} from 'react-icons/fa';
import { SiEthereum } from 'react-icons/si';
import toast from 'react-hot-toast';
import '../styles/AdvancedPayment.css';

// Initialize Stripe (replace with your publishable key)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_KEY');

const PaymentForm = ({ selectedPlan, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      // In production, create payment intent on your backend
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast.error(error.message);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!');
        onSuccess?.();
      }
    } catch (err) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-method-selector">
        <h6>Select Payment Method</h6>
        <div className="payment-methods">
          <button
            type="button"
            className={`payment-method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('card')}
          >
            <FaCreditCard /> Card
          </button>
          <button
            type="button"
            className={`payment-method-btn ${paymentMethod === 'apple' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('apple')}
          >
            <FaApple /> Apple Pay
          </button>
          <button
            type="button"
            className={`payment-method-btn ${paymentMethod === 'google' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('google')}
          >
            <FaGoogle /> Google Pay
          </button>
        </div>
      </div>

      <div className="payment-element-wrapper">
        <PaymentElement />
      </div>

      <Button
        type="submit"
        disabled={!stripe || processing}
        className="submit-payment-btn"
      >
        {processing ? (
          <>
            <Spinner animation="border" size="sm" /> Processing...
          </>
        ) : (
          <>
            <FaShieldAlt /> Pay ${selectedPlan.price} Securely
          </>
        )}
      </Button>

      <div className="payment-security">
        <FaShieldAlt />
        <span>Secured by Stripe • PCI DSS Compliant • 256-bit SSL Encryption</span>
      </div>
    </form>
  );
};

const AdvancedPaymentSystem = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subscriptionType, setSubscriptionType] = useState('monthly');
  const [installments, setInstallments] = useState(1);
  const [clientSecret, setClientSecret] = useState('');

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: 120,
      period: 'month',
      features: ['All Classes Access', 'Flexible Schedule', 'Cancel Anytime', 'Mobile App Access'],
      popular: false,
      savings: 0
    },
    {
      id: 'quarterly',
      name: 'Quarterly',
      price: 320,
      originalPrice: 360,
      period: '3 months',
      features: ['All Classes Access', 'Priority Booking', '10% Discount', 'Free Workshop Access', 'Flexibility to Pause'],
      popular: true,
      savings: 40
    },
    {
      id: 'annual',
      name: 'Annual',
      price: 1080,
      originalPrice: 1440,
      period: 'year',
      features: ['All Classes Access', 'VIP Priority Booking', '25% Discount', 'Free Workshops & Events', 'Personal Training Session', '1 Month Free'],
      popular: false,
      savings: 360
    }
  ];

  const cryptoOptions = [
    { name: 'Bitcoin', icon: FaBitcoin, symbol: 'BTC', color: '#f7931a' },
    { name: 'Ethereum', icon: SiEthereum, symbol: 'ETH', color: '#627eea' }
  ];

  const handleSelectPlan = async (plan) => {
    setSelectedPlan(plan);
    
    // In production, create payment intent on backend
    // For now, using a dummy client secret for demonstration
    try {
      // const response = await fetch('/api/create-payment-intent', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ amount: plan.price * 100, planId: plan.id })
      // });
      // const data = await response.json();
      // setClientSecret(data.clientSecret);
      
      setClientSecret('demo_client_secret'); // Replace with actual client secret
      setShowPaymentModal(true);
    } catch (error) {
      toast.error('Failed to initialize payment');
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    toast.success('Payment successful! Welcome to Cherry Dance Studios!', {
      duration: 5000
    });
  };

  const calculateInstallmentAmount = (price) => {
    return (price / installments).toFixed(2);
  };

  return (
    <section id="payment-system" className="advanced-payment-section">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-header"
        >
          <h2 className="section-title">Flexible Payment Options</h2>
          <p className="section-subtitle">
            Choose your plan and payment method. We support all modern payment options including digital wallets and cryptocurrency.
          </p>
        </motion.div>

        {/* Pricing Plans */}
        <Row className="pricing-row">
          {plans.map((plan, index) => (
            <Col key={plan.id} lg={4} md={6} className="mb-4">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                  {plan.popular && (
                    <div className="popular-badge">
                      <FaCheckCircle /> Most Popular
                    </div>
                  )}
                  
                  {plan.savings > 0 && (
                    <div className="savings-badge">
                      Save ${plan.savings}
                    </div>
                  )}

                  <Card.Body>
                    <h3 className="plan-name">{plan.name}</h3>
                    
                    <div className="plan-price">
                      {plan.originalPrice && (
                        <span className="original-price">${plan.originalPrice}</span>
                      )}
                      <div className="current-price">
                        <span className="currency">$</span>
                        <span className="amount">{plan.price}</span>
                        <span className="period">/{plan.period}</span>
                      </div>
                    </div>

                    <ul className="features-list">
                      {plan.features.map((feature, idx) => (
                        <li key={idx}>
                          <FaCheckCircle className="check-icon" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="select-plan-btn"
                      onClick={() => handleSelectPlan(plan)}
                    >
                      Select Plan
                    </Button>

                    {plan.price > 200 && (
                      <div className="installment-option">
                        <FaCalendarAlt />
                        <span>EMI available from ${calculateInstallmentAmount(plan.price)}/month</span>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>

        {/* Payment Methods Showcase */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="payment-methods-showcase"
        >
          <h3>We Accept All Major Payment Methods</h3>
          
          <div className="payment-icons">
            <div className="payment-icon-group">
              <FaCreditCard />
              <span>Credit/Debit Cards</span>
            </div>
            <div className="payment-icon-group">
              <FaApple />
              <span>Apple Pay</span>
            </div>
            <div className="payment-icon-group">
              <FaGoogle />
              <span>Google Pay</span>
            </div>
            <div className="payment-icon-group">
              <FaBitcoin />
              <span>Cryptocurrency</span>
            </div>
            <div className="payment-icon-group">
              <FaMobileAlt />
              <span>Mobile Wallets</span>
            </div>
          </div>

          <div className="payment-features">
            <div className="feature-item">
              <FaShieldAlt className="feature-icon" />
              <div>
                <h5>Secure Payments</h5>
                <p>Bank-level encryption</p>
              </div>
            </div>
            <div className="feature-item">
              <FaCalendarAlt className="feature-icon" />
              <div>
                <h5>Auto-Pay Option</h5>
                <p>Never miss a payment</p>
              </div>
            </div>
            <div className="feature-item">
              <FaReceipt className="feature-icon" />
              <div>
                <h5>Instant Receipts</h5>
                <p>Digital invoices via email</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Crypto Payment Option */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="crypto-section"
        >
          <h3>Pay with Cryptocurrency</h3>
          <p>We're future-ready! Pay with Bitcoin or Ethereum</p>
          
          <div className="crypto-options">
            {cryptoOptions.map((crypto) => (
              <Card key={crypto.symbol} className="crypto-card">
                <Card.Body>
                  <crypto.icon style={{ color: crypto.color, fontSize: '2.5rem' }} />
                  <h4>{crypto.name}</h4>
                  <Badge bg="secondary">{crypto.symbol}</Badge>
                  <Button variant="outline-primary" size="sm" className="mt-3">
                    Pay with {crypto.name}
                  </Button>
                </Card.Body>
              </Card>
            ))}
          </div>
        </motion.div>
      </Container>

      {/* Payment Modal */}
      <Modal
        show={showPaymentModal}
        onHide={() => setShowPaymentModal(false)}
        size="lg"
        centered
        className="payment-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaShieldAlt /> Secure Payment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPlan && (
            <>
              <div className="payment-summary">
                <h5>Payment Summary</h5>
                <div className="summary-row">
                  <span>Plan:</span>
                  <strong>{selectedPlan.name}</strong>
                </div>
                <div className="summary-row">
                  <span>Amount:</span>
                  <strong>${selectedPlan.price}</strong>
                </div>
                {selectedPlan.savings > 0 && (
                  <div className="summary-row savings">
                    <span>You Save:</span>
                    <strong className="text-success">${selectedPlan.savings}</strong>
                  </div>
                )}
              </div>

              {clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PaymentForm selectedPlan={selectedPlan} onSuccess={handlePaymentSuccess} />
                </Elements>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
    </section>
  );
};

export default AdvancedPaymentSystem;
