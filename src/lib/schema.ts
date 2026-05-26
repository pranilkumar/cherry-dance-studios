/*
SUPABASE DATABASE SCHEMA

Run these SQL commands in your Supabase SQL Editor to create the database structure:

-- 1. Students Table
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_name VARCHAR(255) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(20),
  preferred_class VARCHAR(100),
  preferred_weekday VARCHAR(20),
  preferred_time_slot VARCHAR(50),
  experience_level VARCHAR(50),
  enrollment_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, pending
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Fees Table
CREATE TABLE fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  fee_type VARCHAR(50) NOT NULL, -- monthly, quarterly, annual, registration
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue, cancelled
  payment_method VARCHAR(50), -- cash, card, upi, bank_transfer
  transaction_id VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Reviews Table (for parent feedback)
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  parent_name VARCHAR(255),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP
);

-- 4. Attendance Table (optional - for tracking attendance)
CREATE TABLE attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_date DATE NOT NULL,
  class_type VARCHAR(100),
  status VARCHAR(20) DEFAULT 'present', -- present, absent, late
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Admin Users Table
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_fees_student_id ON fees(student_id);
CREATE INDEX idx_fees_payment_status ON fees(payment_status);
CREATE INDEX idx_fees_due_date ON fees(due_date);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(class_date);

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Policies (Allow public read for reviews, admin full access for others)
-- For now, we'll allow all operations (you can restrict later with proper auth)
CREATE POLICY "Enable read access for all users" ON reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Enable insert access for all users" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable all access for authenticated users" ON students FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON fees FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON attendance FOR ALL USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fees_updated_at BEFORE UPDATE ON fees
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

*/

export const SUPABASE_SCHEMA_INFO = {
  tables: {
    students: {
      fields: [
        'id', 'parent_name', 'student_name', 'email', 'phone',
        'date_of_birth', 'gender', 'preferred_class', 'preferred_weekday',
        'preferred_time_slot', 'experience_level', 'enrollment_date',
        'status', 'notes', 'created_at', 'updated_at'
      ]
    },
    fees: {
      fields: [
        'id', 'student_id', 'fee_type', 'amount', 'due_date',
        'payment_date', 'payment_status', 'payment_method',
        'transaction_id', 'notes', 'created_at', 'updated_at'
      ]
    },
    reviews: {
      fields: [
        'id', 'student_id', 'parent_name', 'rating', 'review_text',
        'status', 'created_at', 'approved_at'
      ]
    },
    attendance: {
      fields: [
        'id', 'student_id', 'class_date', 'class_type', 'status',
        'notes', 'created_at'
      ]
    }
  }
};
