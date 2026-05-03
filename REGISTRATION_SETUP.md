# Setting Up the Registration Form

The registration form uses **EmailJS** to send form submissions directly to your email without needing a backend server.

## Quick Setup (5 minutes)

### 1. Create EmailJS Account
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a **free account** (allows 200 emails/month)

### 2. Add Email Service
1. In your EmailJS dashboard, click **"Add New Service"**
2. Choose your email provider (Gmail recommended)
3. Follow the connection steps
4. Copy your **Service ID** (e.g., `service_abc123`)

### 3. Create Email Template
1. Click **"Email Templates"** → **"Create New Template"**
2. Set up your template with these variables:
   ```
   New Registration from Dance Studio

   Name: {{user_name}}
   Email: {{user_email}}
   Mobile: {{user_mobile}}
   Gender: {{gender}}
   Date of Birth: {{dob}}
   Preferred Class: {{preferred_class}}
   Preferred Time: {{preferred_time}}
   Experience Level: {{experience_level}}
   ```
3. Copy your **Template ID** (e.g., `template_xyz789`)

### 4. Get Public Key
1. Go to **"Account"** → **"General"**
2. Copy your **Public Key** (e.g., `AbCdEf123456`)

### 5. Update Configuration
Open `src/config/emailConfig.js` and replace the placeholder values:

```javascript
export const emailConfig = {
  serviceId: 'service_abc123',      // Your Service ID
  templateId: 'template_xyz789',    // Your Template ID
  publicKey: 'AbCdEf123456',        // Your Public Key
};
```

### 6. Test the Form
1. Restart the dev server if needed: `npm run dev`
2. Fill out the registration form on your website
3. Check your email for the registration details

## Troubleshooting

**Form not sending?**
- Check browser console for errors
- Verify all 3 credentials are correct in `emailConfig.js`
- Make sure you're connected to the internet
- Check EmailJS dashboard for delivery status

**Emails going to spam?**
- Add your EmailJS sender address to your contacts
- Check spam/junk folder
- Use a professional email template

**Need more emails?**
- Free plan: 200 emails/month
- Paid plans start at $7/month for 1,000 emails

## Alternative: Without EmailJS

If you don't want to use EmailJS, you can:
1. Use a backend service (Node.js, PHP, etc.)
2. Use Netlify Forms (if hosted on Netlify)
3. Use Formspree or similar services
4. Connect directly to a database

For now, EmailJS is the simplest solution with no backend required.
