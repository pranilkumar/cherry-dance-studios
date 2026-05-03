import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import '../styles/Register.css';
import { supabase } from '../lib/supabaseClient';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY = {
  parentName: '',
  email: '',
  phone: '',
  childName: '',
  childDob: '',
  preferredClass: '',
  preferredDay: '',
  preferredTime: '',
  experience: 'Beginner',
  notes: '',
};

const Register = () => {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.parentName.trim()) e.parentName = 'Your name is required.';
    if (!form.email.trim()) {
      e.email = 'Email is required.';
    } else if (!EMAIL_RE.test(form.email)) {
      e.email = 'Please enter a valid email address.';
    }
    if (!form.phone || form.phone.length < 7) e.phone = 'A valid phone number is required.';
    if (!form.childName.trim()) e.childName = "Child's name is required.";
    if (!form.childDob) e.childDob = "Child's date of birth is required.";
    if (!form.preferredClass) e.preferredClass = 'Please select a dance style.';
    if (!form.preferredDay) e.preferredDay = 'Please select a preferred day.';
    if (!form.preferredTime) e.preferredTime = 'Please select a preferred time.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('submitting');
    try {
      const { error } = await supabase
        .from('registrations')
        .insert([{
          parent_name:        form.parentName,
          student_name:       form.childName,
          email:              form.email,
          phone:              form.phone,
          date_of_birth:      form.childDob,
          preferred_class:    form.preferredClass,
          preferred_weekday:  form.preferredDay,
          preferred_time_slot: form.preferredTime,
          experience_level:   form.experience,
          notes:              form.notes || null,
          status:             'pending',
        }]);
      if (error) throw error;
      setStatus('success');
      setForm(EMPTY);
      setErrors({});
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="register" className="register-section">
      <Container>
        <div className="register-header">
          <h2 className="register-title">Enrol Your Child</h2>
          <p className="register-sub">Fill in the form below and we'll reach out within 24 hours to confirm your spot.</p>
        </div>

        <div className="register-wrap">
          {status === 'success' ? (
            <div className="reg-success">
              <div className="reg-success-check">&#10003;</div>
              <h3>We've received your enquiry!</h3>
              <p>Thank you, <strong>{form.parentName || 'there'}</strong>. We'll be in touch soon to confirm your child's enrolment.</p>
              <button className="reg-btn" onClick={() => setStatus('idle')}>Submit Another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>

              {/* Section 01 – Parent */}
              <div className="reg-section">
                <div className="reg-section-head">
                  <span className="reg-num">01</span>
                  <span>Parent / Guardian</span>
                </div>

                <div className="reg-grid-2">
                  <div className={`reg-field${errors.parentName ? ' err' : ''}`}>
                    <label>Full Name <span className="req">*</span></label>
                    <input
                      type="text"
                      value={form.parentName}
                      onChange={e => set('parentName', e.target.value)}
                      placeholder="e.g. Sarah Johnson"
                      autoComplete="name"
                    />
                    {errors.parentName && <div className="reg-error">{errors.parentName}</div>}
                  </div>

                  <div className={`reg-field${errors.email ? ' err' : ''}`}>
                    <label>Email Address <span className="req">*</span></label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      placeholder="sarah@email.com"
                      autoComplete="email"
                    />
                    {errors.email && <div className="reg-error">{errors.email}</div>}
                  </div>
                </div>

                <div className={`reg-field${errors.phone ? ' err' : ''}`}>
                  <label>Phone / WhatsApp <span className="req">*</span></label>
                  <PhoneInput
                    country="ca"
                    value={form.phone}
                    onChange={val => set('phone', val)}
                    inputProps={{ name: 'phone', required: true }}
                    containerClass="reg-phone-wrap"
                    inputClass={`reg-phone-input${errors.phone ? ' err' : ''}`}
                    buttonClass="reg-phone-btn"
                    enableSearch
                  />
                  {errors.phone && <div className="reg-error">{errors.phone}</div>}
                </div>
              </div>

              {/* Section 02 – Child */}
              <div className="reg-section">
                <div className="reg-section-head">
                  <span className="reg-num">02</span>
                  <span>About Your Child</span>
                </div>

                <div className="reg-grid-2">
                  <div className={`reg-field${errors.childName ? ' err' : ''}`}>
                    <label>Child's Full Name <span className="req">*</span></label>
                    <input
                      type="text"
                      value={form.childName}
                      onChange={e => set('childName', e.target.value)}
                      placeholder="e.g. Emma"
                    />
                    {errors.childName && <div className="reg-error">{errors.childName}</div>}
                  </div>

                  <div className={`reg-field${errors.childDob ? ' err' : ''}`}>
                    <label>Date of Birth <span className="req">*</span></label>
                    <input
                      type="date"
                      value={form.childDob}
                      onChange={e => set('childDob', e.target.value)}
                    />
                    {errors.childDob && <div className="reg-error">{errors.childDob}</div>}
                  </div>
                </div>
              </div>

              {/* Section 03 – Class Preferences */}
              <div className="reg-section">
                <div className="reg-section-head">
                  <span className="reg-num">03</span>
                  <span>Class Preferences</span>
                </div>

                <div className={`reg-field${errors.preferredClass ? ' err' : ''}`}>
                  <label>Dance Style <span className="req">*</span></label>
                  <select value={form.preferredClass} onChange={e => set('preferredClass', e.target.value)}>
                    <option value="">Select a style…</option>
                    <option value="Bollywood">Bollywood Dance</option>
                    <option value="Hip-Hop">Hip-Hop</option>
                    <option value="Contemporary">Contemporary</option>
                    <option value="Freestyle">Freestyle & Choreo</option>
                  </select>
                  {errors.preferredClass && <div className="reg-error">{errors.preferredClass}</div>}
                </div>

                <div className="reg-grid-2">
                  <div className={`reg-field${errors.preferredDay ? ' err' : ''}`}>
                    <label>Preferred Day <span className="req">*</span></label>
                    <select value={form.preferredDay} onChange={e => set('preferredDay', e.target.value)}>
                      <option value="">Select a day…</option>
                      <option>Monday</option>
                      <option>Tuesday</option>
                      <option>Wednesday</option>
                      <option>Thursday</option>
                      <option>Friday</option>
                    </select>
                    {errors.preferredDay && <div className="reg-error">{errors.preferredDay}</div>}
                  </div>

                  <div className={`reg-field${errors.preferredTime ? ' err' : ''}`}>
                    <label>Preferred Time <span className="req">*</span></label>
                    <select value={form.preferredTime} onChange={e => set('preferredTime', e.target.value)}>
                      <option value="">Select a time…</option>
                      <option value="5:45pm-6:30pm">5:45 PM – 6:30 PM</option>
                      <option value="6:00pm-7:00pm">6:00 PM – 7:00 PM</option>
                      <option value="6:30pm-7:30pm">6:30 PM – 7:30 PM</option>
                      <option value="7:00pm-8:00pm">7:00 PM – 8:00 PM</option>
                    </select>
                    {errors.preferredTime && <div className="reg-error">{errors.preferredTime}</div>}
                  </div>
                </div>

                <div className="reg-field">
                  <label>Experience Level</label>
                  <div className="reg-exp-grid">
                    {['Beginner', 'Some Experience', 'Experienced'].map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        className={`reg-exp-card${form.experience === lvl ? ' selected' : ''}`}
                        onClick={() => set('experience', lvl)}
                      >
                        <span className="reg-exp-title">{lvl}</span>
                        <span className="reg-exp-sub">
                          {lvl === 'Beginner' ? 'New to dance' : lvl === 'Some Experience' ? '1–2 years' : '3+ years'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 04 – Notes */}
              <div className="reg-section reg-section--last">
                <div className="reg-section-head">
                  <span className="reg-num">04</span>
                  <span>Anything Else?</span>
                </div>
                <div className="reg-field">
                  <label>Additional Notes <span className="reg-optional">(optional)</span></label>
                  <textarea
                    value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                    placeholder="Questions, health info, scheduling constraints…"
                    rows={3}
                  />
                </div>
              </div>

              {status === 'error' && (
                <div className="reg-submit-error">Something went wrong. Please try again or contact us directly.</div>
              )}

              <button type="submit" className="reg-btn" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Sending…' : 'Send Enquiry'}
              </button>

              <p className="reg-note">We'll contact you within 24 hours to confirm availability and fees.</p>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
};

export default Register;
