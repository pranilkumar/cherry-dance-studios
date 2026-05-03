# 🎯 Admin Dashboard - Quick Reference Card

## 🔐 Login
**URL:** http://localhost:5173/#/admin
**Email:** admin@cherrydance.com
**Password:** cherry123

---

## 📊 Dashboard Statistics
- **Total Students**: All active enrollments
- **Monthly Revenue**: Current month total (CAD)
- **Pending Payments**: Unpaid fees count
- **Upcoming Dues**: Next 7 days

---

## 👥 Student Management

### Add Student
1. Click "Add Student"
2. Fill required fields (*)
3. Set status (pending/active)
4. Save

### Edit Student
1. Click pencil icon
2. Update fields
3. Change status if needed
4. Save

### Search Students
- Type: Name, email, or phone
- Filter: By status
- Export: Download CSV

---

## 💰 Fee Management

### Create Fee
1. Click "Add Fee"
2. Select student
3. Choose fee type
4. Set amount & due date
5. Save

### Record Payment
1. Find fee record
2. Click checkmark (✓)
3. Enter payment details
4. Payment method
5. Transaction ID (optional)
6. Save

### Payment Status
- 🟢 **Paid**: Completed
- 🟡 **Pending**: Awaiting payment
- 🔴 **Overdue**: Past due date
- 🔵 **Partial**: Part paid

---

## 🔍 Search Tips
- **Students**: name, email, phone
- **Fees**: student, type, transaction
- Results update instantly
- Use filters for faster results

---

## 📤 Export Data
- Click "Export CSV" button
- Opens in Excel/Sheets
- All filtered data included
- Date stamped filename

---

## 🎨 Status Colors

### Students
- 🟢 **Active**: Currently enrolled
- ⚫ **Inactive**: Temporarily not attending
- 🟡 **Pending**: New registration
- 🔴 **Dropped**: Left program

### Payments
- 🟢 **Paid**: Payment received
- 🟡 **Pending**: Payment due
- 🔴 **Overdue**: Past due date
- 🔵 **Partial**: Part payment

---

## 🚨 Daily Tasks

### Morning Check
1. Login to dashboard
2. Review new registrations
3. Check upcoming dues
4. Note overdue payments

### Record Payments
1. Go to Fees page
2. Click ✓ on paid fees
3. Enter payment details
4. Save

### End of Day
1. Export fee data
2. Review pending items
3. Update student notes

---

## ⌨️ Keyboard Shortcuts
- **Tab**: Next field
- **Enter**: Submit form
- **Esc**: Close modal
- **Ctrl+F**: Browser search

---

## 🛠️ Common Actions

### Monthly Billing
Fees → Add Fee → Select all active students → Set monthly tuition → Due date: 1st

### New Student Approval
Dashboard → Recent Registrations → Edit → Change status to "active" → Save

### Overdue Follow-up
Fees → Filter: Pending → Sort by due date → Contact overdue students

### Generate Reports
Filter data → Export CSV → Open in Excel → Create report

---

## 🐛 Quick Fixes

### Can't login?
- Check credentials
- Clear browser cache
- Try: `localStorage.clear()` in console

### Data not loading?
- Check `.env` file exists
- Restart dev server
- Check Supabase connection

### Form not submitting?
- Check required fields (*)
- Check browser console
- Verify Supabase is active

---

## 📱 Mobile Access
- Responsive design
- Works on tablets
- Touch-friendly buttons
- Same features as desktop

---

## 🔒 Security Notes
- Change default password before production
- Don't share admin credentials
- Logout when done
- Use strong passwords

---

## 💡 Pro Tips
- Use search to find students quickly
- Export data regularly for backups
- Add notes for important details
- Set reminders for due dates
- Check dashboard daily

---

## 📞 Need Help?
- **Full Guide**: ADMIN_SETUP_GUIDE.md
- **Setup Status**: SETUP_COMPLETE.md
- **Quick Start**: QUICK_START.md
- **Supabase**: https://supabase.com/docs

---

**Print this card for quick reference!** 📋
