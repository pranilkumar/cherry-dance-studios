// Groq API Service for AI Chatbot
// Free, fast, and reliable AI responses for the dance studio chatbot

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'mixtral-8x7b-32768';

// System prompt for the dance studio chatbot
const SYSTEM_PROMPT = `You are a professional and friendly customer service assistant for Cherry Dance Studios, a modern dance school based in Barrhaven, Ottawa.

Key Information About Cherry Dance Studios:
- Location: Barrhaven, Ottawa, ON
- Phone: 613 890 3789
- Email: cherrydancestudio.cds@gmail.com
- Studio Hours: Weekdays (Monday–Friday) 6:00 PM – 8:00 PM
- Instructors: Certified professionals with extensive experience in Bollywood and Indian dance

Classes Offered:
- Little Stars (Ages 4–7): Tuesday & Thursday, 5:45 PM – 6:30 PM (45 min per class)
- Junior Dancers (Ages 7–10): Monday & Wednesday 6:00 PM – 7:00 PM  OR  Tuesday & Thursday 6:30 PM – 7:30 PM (60 min per class)
- Teens (Ages 10+): Monday & Wednesday, 7:00 PM – 8:00 PM (1 hr per class)

Dance Styles: Bollywood, Hip-Hop, Contemporary, Indian semi-classical, and freestyle

Pricing & Fees:
- Fees are discussed personally after registration — we tailor plans to each student
- Direct students to register and our team will reach out with all fee details

Your responsibilities:
1. Answer questions about classes, schedules, and instructors
2. Help with registration — direct people to the Register section of the website
3. Give class recommendations based on age and interests
4. Be professional, friendly, and helpful
5. Direct complex questions to our contact info

Guidelines:
- Always be professional and courteous
- Keep responses concise (2-3 sentences max for simple questions)
- If asked about something not related to the dance studio, politely redirect to dance-related topics
- For pricing questions, always say fees are discussed personally after registration and encourage them to register
- Never make up scheduling information not provided above
- Always be welcoming to beginners`;

/**
 * Send a message to Groq API and get an AI response
 * @param {string} userMessage - The user's message
 * @returns {Promise<string>} - The AI response
 */
export const getGroqResponse = async (userMessage) => {
  try {
    if (!GROQ_API_KEY) {
      console.warn('Groq API key not configured. Using fallback responses.');
      return getFallbackResponse(userMessage);
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status);
      return getFallbackResponse(userMessage);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'I apologize, but I could not process your request. Please try again.';
    
    return aiResponse;
  } catch (error) {
    console.error('Error calling Groq API:', error);
    return getFallbackResponse(userMessage);
  }
};

/**
 * Fallback responses when API is not available
 * These are used as a backup if Groq API fails or is not configured
 */
const getFallbackResponse = (userMessage) => {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('class') || lowerMessage.includes('schedule')) {
    return 'We offer classes for all age groups — Little Stars (Ages 4–7), Junior Dancers (Ages 7–10), and Teens (10+). Classes run on weekday evenings. Would you like specific schedule details for any age group?';
  } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('fee')) {
    return 'We discuss fees personally after you register — our team will reach out with a plan that works best for you. Please sign up through the Register section and we\'ll be in touch!';
  } else if (lowerMessage.includes('beginner') || lowerMessage.includes('start') || lowerMessage.includes('new')) {
    return 'Welcome! We love having new students. Depending on your age, we\'d recommend either our Little Stars or Junior Dancers class to get started. Register through our website and we\'ll guide you from there!';
  } else if (lowerMessage.includes('location') || lowerMessage.includes('address') || lowerMessage.includes('where')) {
    return 'We are located in Barrhaven, Ottawa, ON. Feel free to reach us at 613 890 3789 or email cherrydancestudio.cds@gmail.com for exact directions.';
  } else if (lowerMessage.includes('age') || lowerMessage.includes('year') || lowerMessage.includes('old')) {
    return 'We have classes for all ages! Little Stars (Ages 4–7), Junior Dancers (Ages 7–10), and Teens (10+). Register and we\'ll match your child with the right group.';
  } else if (lowerMessage.includes('payment') || lowerMessage.includes('pay')) {
    return 'Fee details are discussed personally after registration. Please register through our website and our team will contact you with all payment information.';
  } else if (lowerMessage.includes('contact') || lowerMessage.includes('call') || lowerMessage.includes('reach')) {
    return 'You can reach us at:\nPhone: 613 890 3789\nEmail: cherrydancestudio.cds@gmail.com\nStudio Hours: Weekdays 6:00 PM – 8:00 PM';
  } else if (lowerMessage.includes('bollywood') || lowerMessage.includes('dance style') || lowerMessage.includes('hip') || lowerMessage.includes('contemporary')) {
    return 'We specialize in Bollywood, Hip-Hop, Contemporary, and Indian semi-classical dance styles. Our experienced instructors bring these styles to life in a fun and supportive environment!';
  } else if (lowerMessage.includes('thank')) {
    return "You're welcome! Feel free to ask anything else about Cherry Dance Studios.";
  } else if (lowerMessage.includes('instructor') || lowerMessage.includes('teacher')) {
    return 'Our instructors are certified professionals with extensive experience in Bollywood and Indian dance. They are passionate about teaching and creating a welcoming environment for all students.';
  } else {
    return 'I\'m happy to help with information about our classes, schedules, instructors, or registration. What would you like to know?';
  }
};
