# Quick Start - Get Your Chatbot Working (15 minutes)

## Right Now - Follow These Steps

### Step 1: Get Your Free API Key (5 minutes)

1. Open browser and go to: **https://console.groq.com**

2. Click **"Sign Up"** button

3. Choose sign-up method:
   - Email + password, OR
   - Google account

4. Verify your email (if using email method)

5. Once logged in:
   - Look for **"API Keys"** in the sidebar
   - Click **"Create API Key"**
   - You'll see a key starting with `gsk_...`
   - Click copy button

6. Save this key somewhere safe (email to yourself, note in phone)

**You now have your FREE API key! This works forever with no costs.**

---

### Step 2: Add Key to Your Project (2 minutes)

1. In VS Code, open your project root folder

2. Create a new file called `.env` (note the dot at the start)
   - Right-click in file explorer
   - New File
   - Name it: `.env`

3. Copy this into the file:
   ```
   VITE_GROQ_API_KEY=gsk_your_api_key_here
   VITE_GROQ_MODEL=mixtral-8x7b-32768
   ```

4. Replace `gsk_your_api_key_here` with your actual API key from Step 1

5. **Save the file** (Ctrl+S or Cmd+S)

**Example of what it should look like:**
```
VITE_GROQ_API_KEY=gsk_3k8jd9ksd0sdfk8ds98dsfk_example_key_here
VITE_GROQ_MODEL=mixtral-8x7b-32768
```

---

### Step 3: Test the Chatbot (5 minutes)

1. Open terminal in VS Code (Terminal → New Terminal)

2. Make sure you're in the dance-studio folder:
   ```
   cd /Users/pranil/Documents/dance-studio
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. You should see:
   ```
   VITE v6.4.1  ready in XXX ms
   ➜  Local:   http://localhost:5173/
   ```

5. Open browser to: **http://localhost:5173/**

6. **Test the chatbot:**
   - Look for chat bubble in bottom right corner
   - Click it to open
   - Type: "What classes do you offer?"
   - **You should see an intelligent AI response!**

7. Try more questions:
   - "How much are your classes?"
   - "Can I book a free trial?"
   - "Tell me about your instructors"
   - "What payment methods do you accept?"

**Your chatbot is now alive with real AI! 🎉**

---

### Step 4: Deploy to the World (Optional - When Ready)

When you want to make it live on the internet:

#### Option A: Vercel (Recommended)

1. Go to **https://vercel.com**
2. Sign up (free)
3. Click **"Import Project"**
4. Connect your GitHub repository
5. Add Environment Variable:
   - Name: `VITE_GROQ_API_KEY`
   - Value: Your API key from Step 1
6. Click **"Deploy"**
7. Your website is live! Share the URL

#### Option B: Netlify

1. Go to **https://netlify.com**
2. Sign up (free)
3. Click **"Add new site"**
4. Select **"Connect to Git"**
5. Choose your repository
6. Go to **Settings → Environment**
7. Add Variable:
   - Key: `VITE_GROQ_API_KEY`
   - Value: Your API key
8. Website automatically deploys and goes live

---

## What Should Happen

### When You Chat:
```
You: "What classes do you offer?"

AI: "We offer various dance classes including Ballet, Hip-Hop, 
Contemporary, Jazz, Salsa, Bollywood, and Zumba. Our classes 
run from Monday to Saturday with flexible timings. Would you 
like specific details about any dance style?"
```

### If API Key Missing:
```
You: "What classes do you offer?"

AI: "We offer various classes including Ballet, Hip-Hop, 
Contemporary, Jazz, Salsa, and Bollywood. Our classes run 
from Monday to Saturday with flexible timings."
(Fallback response - still helpful!)
```

---

## Troubleshooting

### Chatbot won't respond?

**Check 1: Did you add the API key?**
- Look at `.env` file
- Is `VITE_GROQ_API_KEY=gsk_...` there?
- Is there a key after the `=`?

**Check 2: Is the key correct?**
- Copy it again from console.groq.com
- Make sure it starts with `gsk_`
- No extra spaces

**Check 3: Did you restart the server?**
- Stop server (Ctrl+C in terminal)
- Run `npm run dev` again
- Refresh browser

**Check 4: Check browser console for errors**
- Press F12 in browser
- Go to Console tab
- Look for red errors
- Tell me what they say

### Dev server won't start?

**Solution:**
```
npm install
npm run dev
```

### Port 5173 already in use?

**Solution:**
```
# Kill the old process
lsof -ti:5173 | xargs kill -9

# Or try a different port
npm run dev -- --port 3000
```

---

## What's Included

Your website now has:

1. **AI Chatbot** ← This is what you just enabled
2. **Advanced Payment System** (Stripe)
3. **QR Code Attendance**
4. **Analytics Dashboard**
5. **Admin Panel**
6. **Dark Mode**
7. **Mobile App Features**
8. **Professional Design**

---

## Next Steps After Testing

### When Chatbot Works Perfectly:

1. **Optional: Customize the AI**
   - File: `src/services/groqService.js`
   - Look for "System Prompt"
   - Add more specific details about your studio
   - Restart server to test

2. **Deploy to Internet**
   - Follow Step 4 above (Vercel/Netlify)
   - Takes 5 minutes

3. **Share Your Website**
   - Send link to friends/family
   - Ask students to try the chatbot
   - Gather feedback

4. **Monitor Usage**
   - Check how many people use chatbot
   - Improve responses based on questions asked
   - Continuously improve

---

## Support

If stuck, refer to:
- `GROQ_SETUP_GUIDE.md` - Detailed setup
- `PRE_LAUNCH_CHECKLIST.md` - Full checklist
- `CHANGES_MADE.md` - What was changed
- `GROQ_INTEGRATION_SUMMARY.md` - Technical details

---

## Success Indicators

✅ Chatbot appears in bottom right
✅ Chat bubble opens when clicked
✅ AI responds to questions
✅ Responses are intelligent and relevant
✅ Fallback works if API key missing
✅ Mobile works on phone

**If all these work = You're ready to launch! 🚀**

---

## One More Thing...

**IMPORTANT:** Don't commit `.env` file to GitHub!

In VS Code:
1. Create `.gitignore` file (if doesn't exist)
2. Add this line: `.env`
3. Save

This prevents your API key from being uploaded to GitHub.

---

**You're all set! Enjoy your professional AI chatbot!** 🎉

Questions? Check the documentation files in your project.
