import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaTimes, FaPaperPlane, FaMicrophone, FaSpinner } from 'react-icons/fa';
import { getGroqResponse } from '../services/groqService';
import '../styles/AIAssistant.css';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "Hello! I'm your AI dance assistant. Ask me about classes, schedules, pricing, or get personalized recommendations!",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const getAIResponse = async (userMessage) => {
    // Use Groq API with fallback to keyword-based responses
    return await getGroqResponse(userMessage);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      type: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Get AI response
    const responseText = await getAIResponse(inputText);

    setIsTyping(false);
    const botMessage = {
      type: 'bot',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { icon: '📚', text: 'View Classes', action: 'Tell me about available classes' },
    { icon: '💰', text: 'Pricing', action: 'What are the prices?' },
    { icon: '🎁', text: 'Free Trial', action: 'How do I get a free trial?' },
    { icon: '📍', text: 'Location', action: 'Where are you located?' }
  ];

  const handleQuickAction = (action) => {
    setInputText(action);
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        className="ai-chat-button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={isOpen ? { scale: 0 } : { scale: 1 }}
      >
        <FaRobot />
        <span className="ai-chat-pulse"></span>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="ai-chat-window"
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="ai-chat-header">
              <div className="ai-chat-header-info">
                <div className="ai-avatar">
                  <FaRobot />
                </div>
                <div>
                  <h4>AI Dance Assistant</h4>
                  <span className="ai-status">
                    <span className="status-dot"></span> Online
                  </span>
                </div>
              </div>
              <button className="ai-close-btn" onClick={() => setIsOpen(false)}>
                <FaTimes />
              </button>
            </div>

            {/* Messages */}
            <div className="ai-chat-messages">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  className={`ai-message ${msg.type}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {msg.type === 'bot' && (
                    <div className="message-avatar">
                      <FaRobot />
                    </div>
                  )}
                  <div className="message-content">
                    <p>{msg.text}</p>
                    <span className="message-time">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  className="ai-message bot"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="message-avatar">
                    <FaRobot />
                  </div>
                  <div className="message-content typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 1 && (
              <div className="ai-quick-actions">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={index}
                    className="quick-action-btn"
                    onClick={() => handleQuickAction(action.action)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>{action.icon}</span>
                    {action.text}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="ai-chat-input">
              <input
                type="text"
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button
                className={`voice-btn ${isListening ? 'listening' : ''}`}
                onClick={handleVoiceInput}
                title="Voice input"
              >
                {isListening ? <FaSpinner className="spinning" /> : <FaMicrophone />}
              </button>
              <button
                className="send-btn"
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isTyping}
              >
                <FaPaperPlane />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
