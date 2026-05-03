-- Cherry Dance Studios - Registration to Student Workflow
-- Run this in Supabase SQL Editor

-- 1. Create Registrations Table (for enquiries)
CREATE TABLE registrations (
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
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, converted
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  converted_to_student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  converted_at TIMESTAMP
);

-- 2. Add indexes for registrations
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_email ON registrations(email);
CREATE INDEX idx_registrations_created ON registrations(created_at DESC);

-- 3. Enable RLS on registrations
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- 4. Allow public insert (for registration form)
CREATE POLICY "Enable insert for all users" ON registrations 
  FOR INSERT WITH CHECK (true);

-- 5. Allow authenticated users to read/update
CREATE POLICY "Enable all access for authenticated users" ON registrations 
  FOR ALL USING (true);

-- 6. Add trigger for updated_at on registrations
CREATE TRIGGER update_registrations_updated_at 
  BEFORE UPDATE ON registrations
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Create function to convert registration to student
CREATE OR REPLACE FUNCTION convert_registration_to_student(
  registration_id UUID,
  enrollment_date TIMESTAMP DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
  new_student_id UUID;
  reg_record RECORD;
BEGIN
  -- Get registration data
  SELECT * INTO reg_record FROM registrations WHERE id = registration_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registration not found';
  END IF;
  
  IF reg_record.status = 'converted' THEN
    RAISE EXCEPTION 'Registration already converted';
  END IF;
  
  -- Insert into students table
  INSERT INTO students (
    parent_name,
    student_name,
    email,
    phone,
    date_of_birth,
    gender,
    preferred_class,
    preferred_weekday,
    preferred_time_slot,
    experience_level,
    status,
    enrollment_date,
    notes
  ) VALUES (
    reg_record.parent_name,
    reg_record.student_name,
    reg_record.email,
    reg_record.phone,
    reg_record.date_of_birth,
    reg_record.gender,
    reg_record.preferred_class,
    reg_record.preferred_weekday,
    reg_record.preferred_time_slot,
    reg_record.experience_level,
    'active',
    enrollment_date,
    reg_record.notes
  )
  RETURNING id INTO new_student_id;
  
  -- Update registration status
  UPDATE registrations 
  SET 
    status = 'converted',
    converted_to_student_id = new_student_id,
    converted_at = NOW()
  WHERE id = registration_id;
  
  RETURN new_student_id;
END;
$$ LANGUAGE plpgsql;
