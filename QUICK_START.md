# Quick Start Guide - Cherry Dance Studios Website

## 🚀 Getting Started

### Start Development Server
```bash
npm run dev
```
Visit: http://localhost:5173

### Deploy to GitHub Pages
```bash
npm run deploy
```

---

## 📋 Quick Updates Cheat Sheet

### 1. Update Studio Name/Branding
**File:** `src/Home.jsx` (Line 45)
```jsx
Welcome to <span className="studio-name">Cherry Dance Studios</span>
```

**File:** `src/NavigationBar.jsx` (Line 60)
```jsx
<span style={{ color: 'black' }}>CDS</span>
```

### 2. Update Contact Information
**File:** `src/Contact.jsx` (Lines 10-42)
```jsx
{
  icon: <FaPhone />,
  title: 'Call Us',
  details: ['+1 (613) 555-DANCE', ...],  // ← Change this
}
```

### 3. Update Pricing
**File:** `src/Pricing.jsx` (Lines 10-60)
```jsx
{
  name: 'Monthly',
  price: '149',  // ← Change price here
  features: [...] // ← Update features
}
```

### 4. Add/Edit Classes
**File:** `src/Classes.jsx` (Lines 10-75)
```jsx
{
  title: 'Bollywood Dance',
  schedule: 'Mon, Wed, Fri',  // ← Change schedule
  time: '6:00 PM - 7:30 PM',  // ← Change time
}
```

### 5. Add Testimonials
**File:** `src/Testimonials.jsx` (Lines 10-65)
```jsx
{
  name: 'Sarah Johnson',
  text: 'Cherry Dance Studios has...',  // ← Add review
  rating: 5
}
```

### 6. Update Stats/Numbers
**File:** `src/Stats.jsx` (Lines 10-40)
```jsx
{
  value: 500,  // ← Update number
  label: 'Happy Students'
}
```

### 7. Add Gallery Images
**Steps:**
1. Add image to `src/` folder (e.g., `Image9.webp`)
2. Open `src/Gallery.jsx`
3. Import: `import galleryImage9 from './Image9.webp';`
4. Add to array: `{ src: galleryImage9, alt: 'Description' }`

---

## 🎨 Color Customization

### Main Theme Colors (CSS Variables)
**File:** Various CSS files

**Purple Gradient:** `#667eea` → `#764ba2`
**Pink Gradient:** `#FF6B9D` → `#FD79A8`

**Find & Replace in all CSS files:**
- Search: `#667eea` → Replace with your brand color
- Search: `#764ba2` → Replace with your secondary color

---

## 📱 Social Media Links

**File:** `src/Contact.jsx` (Lines 45-49)
```jsx
{ 
  icon: <FaFacebookF />, 
  link: 'https://facebook.com/cherrydance'  // ← Update
}
```

**WhatsApp Number:**
```jsx
link: 'https://wa.me/16135553262'  // ← Change phone number
```

---

## 🗺️ Google Maps

**File:** `src/Contact.jsx` (Line 130)
```jsx
src="https://www.google.com/maps/embed?pb=..."
```

**How to get your map:**
1. Go to Google Maps
2. Find your location
3. Click "Share" → "Embed a map"
4. Copy the iframe src URL
5. Replace the src in code

---

## 📋 FAQ Updates

**File:** `src/FAQ.jsx` (Lines 10-70)
```jsx
{
  question: 'Do I need prior dance experience?',
  answer: 'Not at all! We welcome...'  // ← Edit answer
}
```

---

## 🎬 Video IDs (YouTube)

**File:** `src/About.jsx` (Lines 8-15)
```jsx
{ id: 'oVPpJOhOHSA', title: 'Dance Video 1' }
       ↑ This is the video ID
```

**How to get YouTube video ID:**
- URL: `youtube.com/watch?v=oVPpJOhOHSA`
- ID is after `v=`

---

## 🔤 Font Changes

**File:** `src/index.css` (Line 5)
```css
font-family: 'Poppins', sans-serif;
```

**Add Google Font:**
1. Visit fonts.google.com
2. Select font
3. Copy `<link>` tag to `index.html` head
4. Update font-family in CSS

---

## 🎯 Call-to-Action Buttons

**Primary CTA Color:** Pink gradient
**Secondary CTA:** Purple gradient

**File:** `src/Home.css` (Lines 85-95)
```css
.cta-primary {
  background: linear-gradient(135deg, #FF6B9D 0%, #FD79A8 100%);
}
```

---

## 📧 Form Submission Setup

### Email Notifications
Currently uses Netlify forms (passive).

**To get email notifications:**
1. Deploy to Netlify
2. Go to Forms section in dashboard
3. Add notification email

**Or integrate EmailJS:**
```bash
npm install @emailjs/browser
```
(Already installed, needs configuration)

---

## 🔍 SEO Basics

### Page Title & Description
**File:** `index.html`
```html
<title>Cherry Dance Studios - Ottawa's Premier Dance School</title>
<meta name="description" content="...">
```

### Keywords
Add in `index.html`:
```html
<meta name="keywords" content="dance studio Ottawa, Bollywood dance, hip-hop classes Ottawa">
```

---

## 📊 Add Google Analytics

**File:** `index.html` (Before `</head>`)
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

---

## 🐛 Common Issues & Fixes

### Issue: Site not updating
**Fix:** Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Build fails
**Fix:** 
```bash
rm -rf node_modules
npm install
npm run dev
```

### Issue: Images not showing
**Fix:** Check image paths are correct and files exist in `src/` folder

### Issue: Animations not working
**Fix:** Make sure framer-motion is installed:
```bash
npm install framer-motion
```

---

## 📱 Testing Checklist

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] All navigation links work
- [ ] Forms submit successfully
- [ ] All images load
- [ ] No console errors (F12)
- [ ] Fast loading (under 3 seconds)

---

## 🎨 Useful Resources

- **Icons:** https://react-icons.github.io/react-icons/
- **Colors:** https://coolors.co/
- **Fonts:** https://fonts.google.com/
- **Images:** https://unsplash.com/ (free stock photos)
- **Animations:** https://www.framer.com/motion/

---

## 🆘 Emergency Fixes

### Broken layout?
```bash
git checkout src/index.css
npm run dev
```

### Lost changes?
Check: `git log` to see history

### Site won't build?
```bash
npm run build
# Check error message
# Usually a syntax error in JSX
```

---

## 📞 Support

For questions about:
- **React/Vite:** https://vitejs.dev/
- **React Bootstrap:** https://react-bootstrap.github.io/
- **Framer Motion:** https://www.framer.com/motion/

---

**Remember:** Always test locally (`npm run dev`) before deploying!

Good luck with Cherry Dance Studios! 🎉💃🕺
