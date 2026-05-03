# Admin Dashboard Setup Guide

## 🚀 Quick Start (15 minutes)

### Step 1: Create Supabase Account (5 min)

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub or email
4. Create a new project:
   - Project name: "cherry-dance-studio"
   - Database password: (save this somewhere safe!)
   - Region: Choose closest to Ottawa (US East or Canada)
5. Wait 2-3 minutes for project to be ready

### Step 2: Get Your Credentials (2 min)

1. In Supabase dashboard, go to **Project Settings** (⚙️ icon)
2. Click **API** in left sidebar
3. Copy these two values:
   - **Project URL** (looks like: https://abc123.supabase.co)
   - **anon public** key (long string starting with eyJ...)

### Step 3: Configure Your App (2 min)

1. In your project folder, create `.env` file (copy from `.env.example`)
2. Paste your credentials:
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```
3. Save the file

### Step 4: Create Database Tables (5 min)

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New query**
3. Copy the entire SQL from `src/lib/schema.js` (the big comment block)
4. Paste it in the SQL editor
5. Click **Run** (or press Cmd+Enter)
6. You should see "Success. No rows returned"

### Step 5: Test Your Setup (1 min)

1. Restart your dev server:
```bash
npm run dev
```

2. Fill out the registration form on your website
3. Submit it
4. Go to Supabase dashboard > **Table Editor** > **students**
5. You should see your first student record! 🎉

---

## 📊 Admin Dashboard Access

### Option 1: Simple Password Protection (Easiest)

I've created a simple admin login page at:
```
http://localhost:5174/admin
```

**Default credentials:**
- Email: admin@cherrydance.com
- Password: cherry123

**To change the password:**
Edit `src/components/admin/AdminLogin.jsx` and update the credentials.

### Option 2: Supabase Authentication (More Secure)

We can set up proper Supabase Auth later if needed. For now, the simple password is fine for getting started.

---

## 🎯 What You Can Do Now

### Student Management
- **View all students**: `/admin/students`
- **Add new student**: Click "Add Student" button
- **Edit student**: Click edit icon on any student
- **Delete student**: Click delete icon
- **Search students**: Use search bar
- **Filter by status**: Active, Pending, Inactive

### Fee Management
- **View all fees**: `/admin/fees`
- **Add fee**: Click "Add Fee" button
- **Record payment**: Click "Mark as Paid" button
- **View payment history**: See all transactions
- **Track overdue payments**: Automatically highlighted
- **Generate reports**: Monthly revenue, pending payments

### Review Management
- **View pending reviews**: `/admin/reviews`
- **Approve review**: Shows on public website
- **Reject review**: Hides from website
- **Edit review**: Modify text if needed

---

## 📱 Admin Dashboard Features

### Dashboard Overview (`/admin/dashboard`)
- Total students count
- Active enrollments
- Pending payments
- Total revenue this month
- Recent registrations
- Upcoming payment dues
- Quick actions

### Student Management (`/admin/students`)
- Complete student database
- Parent & student information
- Contact details
- Class preferences
- Enrollment date
- Payment status
- Notes field for custom info
- Export to CSV
- Bulk operations

### Fee Management (`/admin/fees`)
- Fee tracking per student
- Payment status (Pending/Paid/Overdue)
- Due dates with reminders
- Payment methods tracking
- Transaction IDs
- Monthly/quarterly/annual fees
- Payment history
- Revenue reports
- Overdue alerts

### Reports (`/admin/reports`)
- Monthly revenue
- Class-wise enrollment
- Payment collection rate
- Overdue payments list
- Student growth chart
- Export reports to PDF/Excel

---

## 🔐 Security Best Practices

### For Production Deployment:

1. **Change default admin password** immediately
2. **Use environment variables** for all sensitive data
3. **Enable RLS (Row Level Security)** in Supabase
4. **Set up proper authentication** with Supabase Auth
5. **Use HTTPS** (automatic on Vercel/Netlify)
6. **Backup database** regularly (Supabase has auto-backups)

---

## 🚀 Deployment (After Testing Locally)

### Deploy to Vercel (Recommended - Free)

1. Push your code to GitHub
2. Go to https://vercel.com
3. Import your repository
4. Add environment variables:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
5. Click Deploy
6. Your site will be live at `your-site.vercel.app`

### Deploy to Netlify (Alternative - Free)

1. Push code to GitHub
2. Go to https://netlify.com
3. Import repository
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Add environment variables in Site Settings
7. Deploy

---

## 📞 Support & Next Steps

### Immediate Next Steps:
1. ✅ Test registration form → Check Supabase
2. ✅ Login to admin dashboard
3. ✅ Add a few test students manually
4. ✅ Create fee records
5. ✅ Test payment tracking

### Future Enhancements:
- Email notifications for payments
- SMS reminders for classes
- Automated payment reminders
- Student/parent portal
- Attendance tracking
- Performance reports
- WhatsApp integration
- AI chatbot integration

### Need Help?
- Check Supabase docs: https://supabase.com/docs
- React Router: https://reactrouter.com
- Bootstrap: https://react-bootstrap.github.io

---

## 🎓 Database Structure Quick Reference

**students** → All student information
**fees** → Payment tracking linked to students
**reviews** → Parent feedback (public after approval)
**attendance** → Class attendance records (optional)

All tables are linked via `student_id` foreign key.

---

**You're all set! 🎉**

Your dance studio now has a professional management system!
