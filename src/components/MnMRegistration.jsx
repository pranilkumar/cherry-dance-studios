import React, { useState, useEffect } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import '../styles/MnMRegistration.css';
import { supabase } from '../lib/supabaseClient';

// Replace with your Formspree form ID from formspree.io
const FORMSPREE_ID = 'xvzlzdnr';

const PACKAGES = [
  {
    value: 'mom_1kid',
    label: 'Mom + 1 Child',
    price: '$25',
    desc: 'One mom, one little dancer',
  },
  {
    value: 'mom_2kids',
    label: 'Mom + 2 Children',
    price: '$30',
    desc: 'Double the fun, double the love',
  },
  {
    value: 'mom_3kids',
    label: 'Mom + 3 Children',
    price: '$35',
    desc: 'Three times the joy!',
  },
];

const AGES = ['Under 1',1,2,3,4,5,6,7,8,9,10,11,'12+'];

const RadioGroup = ({ options, value, onChange, twoCol, errorKey, errors }) => (
  <div className={`mnm-options${twoCol ? ' two-col' : ''}`}>
    {options.map(opt => (
      <label key={opt.value} className={`mnm-option${value === opt.value ? ' selected' : ''}`}>
        <input type="radio" name={opt.name || opt.value} value={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} />
        <span className="mnm-option-dot" />
        <span className="mnm-option-text">{opt.label}</span>
        {opt.price && <span className="mnm-option-price">{opt.price}</span>}
      </label>
    ))}
    {errorKey && errors[errorKey] && <div className="mnm-inline-error">Please make a selection.</div>}
  </div>
);

const Field = ({ label, required, error, children }) => (
  <div className={`mnm-field${error ? ' has-error' : ''}`}>
    <label>{label}{required && <span className="req"> *</span>}</label>
    {children}
    {error && <div className="mnm-field-error">{error}</div>}
  </div>
);

const MnMRegistration = () => {
  const [form, setForm] = useState({
    parentName: '', phone: '', email: '',
    child1Name: '', child1Age: '',
    package: '', child2Name: '', child2Age: '', child3Name: '', child3Age: '',
    allergy: 'no', allergyText: '', source: '',
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Load Playfair Display font
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.parentName.trim()) e.parentName = 'Please enter your full name.';
    if (!form.phone || form.phone.length < 7) e.phone = 'Please enter a valid phone number.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Please enter a valid email address.';
    if (!form.child1Name.trim()) e.child1Name = "Please enter your child's name.";
    if (!form.child1Age) e.child1Age = "Please select your child's age.";
    if (!form.package) e.package = true;
    if (form.package === 'mom_2kids' || form.package === 'mom_3kids') {
      if (!form.child2Name.trim()) e.child2Name = "Please enter your second child's name.";
      if (!form.child2Age) e.child2Age = "Please select your second child's age.";
    }
    if (form.package === 'mom_3kids') {
      if (!form.child3Name.trim()) e.child3Name = "Please enter your third child's name.";
      if (!form.child3Age) e.child3Age = "Please select your third child's age.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      document.querySelector('.mnm-field.has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmitting(true);
    setSubmitError('');

    const selectedPkgLabel = form.package === 'mom_1kid' ? 'Mom + 1 Child — $25' : form.package === 'mom_2kids' ? 'Mom + 2 Children — $30' : 'Mom + 3 Children — $35';
    const body = {
      'Parent Name':    form.parentName.trim(),
      'Phone':          form.phone.trim(),
      'Email':          form.email.trim(),
      'Child 1 Name':   form.child1Name.trim(),
      'Child 1 Age':    form.child1Age,
      'Package':        selectedPkgLabel,
      'Child 2 Name':   form.package === 'mom_2kids' ? form.child2Name.trim() : 'N/A',
      'Child 2 Age':    form.package === 'mom_2kids' ? form.child2Age : 'N/A',
      'Food Allergies': form.allergy === 'yes' ? (form.allergyText.trim() || 'Yes (not specified)') : 'None',
      'Heard From':     form.source || 'Not specified',
      'Payment':        'E-transfer to cherrydancestudio.cds@gmail.com',
    };

    try {
      // Save to Supabase
      const { error: dbError } = await supabase
        .from('workshop_registrations')
        .insert([{
          parent_name:    form.parentName.trim(),
          phone:          form.phone,
          email:          form.email.trim(),
          child1_name:    form.child1Name.trim(),
          child1_age:     String(form.child1Age),
          package:        form.package,
          child2_name:    (form.package === 'mom_2kids' || form.package === 'mom_3kids') ? form.child2Name.trim() : null,
          child2_age:     (form.package === 'mom_2kids' || form.package === 'mom_3kids') ? String(form.child2Age) : null,
          child3_name:    form.package === 'mom_3kids' ? form.child3Name.trim() : null,
          child3_age:     form.package === 'mom_3kids' ? String(form.child3Age) : null,
          food_allergies: form.allergy === 'yes' ? (form.allergyText.trim() || 'Yes (not specified)') : null,
          heard_from:     form.source || null,
          payment_status: 'pending',
        }]);

      if (dbError) throw dbError;

      // Also send email via Formspree as backup notification
      const pkgLabel = form.package === 'mom_1kid' ? 'Mom + 1 Child — $25' : form.package === 'mom_2kids' ? 'Mom + 2 Children — $30' : 'Mom + 3 Children — $35';
      const has2 = form.package === 'mom_2kids' || form.package === 'mom_3kids';
      await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          'Parent Name':    form.parentName.trim(),
          'Phone':          form.phone,
          'Email':          form.email.trim(),
          'Child 1 Name':   form.child1Name.trim(),
          'Child 1 Age':    form.child1Age,
          'Package':        pkgLabel,
          'Child 2 Name':   has2 ? form.child2Name.trim() : 'N/A',
          'Child 2 Age':    has2 ? form.child2Age : 'N/A',
          'Child 3 Name':   form.package === 'mom_3kids' ? form.child3Name.trim() : 'N/A',
          'Child 3 Age':    form.package === 'mom_3kids' ? form.child3Age : 'N/A',
          'Food Allergies': form.allergy === 'yes' ? (form.allergyText.trim() || 'Yes (not specified)') : 'None',
          'Heard From':     form.source || 'Not specified',
        }),
      });

      setSubmitted(true);
    } catch {
      setSubmitError('Something went wrong. Please WhatsApp us at 613-890-3789 to register.');
    }
    setSubmitting(false);
  };

  const selectedPkg = PACKAGES.find(p => p.value === form.package);

  if (submitted) {
    return (
      <div className="mnm-page">
        <div className="mnm-wrap">
          <div className="mnm-success">
            <h2 className="mnm-success-title">You're In!</h2>
            <p className="mnm-success-msg">
              Thank you for registering, <strong>{form.parentName.split(' ')[0]}</strong>!
              We can't wait to dance with you and your little one.
            </p>
            <div className="mnm-success-details">
              <div className="mnm-success-row"><span>Date</span><strong>Saturday, May 9, 2026</strong></div>
              <div className="mnm-success-row"><span>Time</span><strong>5:00 PM – 7:00 PM</strong></div>
              <div className="mnm-success-row"><span>Package</span><strong>{selectedPkg?.label} — {selectedPkg?.price}</strong></div>
              <div className="mnm-success-row"><span>Payment</span><strong>E-transfer</strong></div>
              <div className="mnm-success-etransfer">
                Send e-transfer to <strong>cherrydancestudio.cds@gmail.com</strong><br/>
                Message: <strong>MnM – {form.parentName}</strong>
              </div>
            </div>
            <p className="mnm-success-footer">
              Questions? <a href="https://wa.me/16138903789">WhatsApp us at 613-890-3789</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mnm-page">
      <div className="mnm-wrap">

        {/* ── Header ── */}
        <div className="mnm-header">
          <div className="mnm-studio-badge">Cherry Dance Studios Presents</div>
          <div className="mnm-title-wrap">
            <span className="mnm-title-mnm">MnM</span>
          </div>
          <p className="mnm-event-subtitle">
            <em>Mom &amp; Me — Celebrate the bond through dance</em>
          </p>
          <div className="mnm-divider">
            <span className="mnm-divider-line" /><span className="mnm-divider-line" />
          </div>
          <div className="mnm-pills">
            <span className="mnm-pill">Sat, May 9 · 2026</span>
            <span className="mnm-pill">6:00 – 8:00 PM</span>

          </div>
          <div className="mnm-perks-row">
            <span className="mnm-perk">Video recording included</span>
            <span className="mnm-perk">Snacks included</span>
            <span className="mnm-perk">No experience needed</span>
          </div>
        </div>

        {/* ── Form Card ── */}
        <div className="mnm-card">
          <form onSubmit={handleSubmit} noValidate>

            {/* Parent Info */}
            <div className="mnm-section-heading">
              <span className="mnm-section-num">01</span>
              <span>Parent Information</span>
            </div>

            <Field label="Full Name" required error={errors.parentName}>
              <input type="text" value={form.parentName} onChange={e => set('parentName', e.target.value)} placeholder="e.g. Sarah Johnson" autoComplete="name" />
            </Field>

            <div className="mnm-row-2">
              <Field label="WhatsApp / Phone" required error={errors.phone}>
                <PhoneInput
                  country="ca"
                  value={form.phone}
                  onChange={val => set('phone', val)}
                  inputProps={{ name: 'phone', required: true }}
                  containerClass="mnm-phone-wrap"
                  inputClass={`mnm-phone-input${errors.phone ? ' has-error' : ''}`}
                  buttonClass="mnm-phone-btn"
                  enableSearch
                />
              </Field>
              <Field label="Email Address" required error={errors.email}>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="sarah@email.com" autoComplete="email" />
              </Field>
            </div>

            <div className="mnm-sep" />

            {/* Child Info */}
            <div className="mnm-section-heading">
              <span className="mnm-section-num">02</span>
              <span>Child Information</span>
            </div>

            <div className="mnm-row-2">
              <Field label="Child's Name" required error={errors.child1Name}>
                <input type="text" value={form.child1Name} onChange={e => set('child1Name', e.target.value)} placeholder="e.g. Emma" />
              </Field>
              <Field label="Child's Age" required error={errors.child1Age}>
                <select value={form.child1Age} onChange={e => set('child1Age', e.target.value)}>
                  <option value="">Select age</option>
                  {AGES.map(a => <option key={a}>{a}</option>)}
                </select>
              </Field>
            </div>

            <div className="mnm-sep" />

            {/* Package */}
            <div className="mnm-section-heading">
              <span className="mnm-section-num">03</span>
              <span>Select Your Package</span>
            </div>

            <div className={`mnm-pkg-grid${errors.package ? ' has-error' : ''}`}>
              {PACKAGES.map(pkg => (
                <label key={pkg.value} className={`mnm-pkg-card${form.package === pkg.value ? ' selected' : ''}`}>
                  <input type="radio" name="package" value={pkg.value} checked={form.package === pkg.value} onChange={() => set('package', pkg.value)} />
                  <div className="mnm-pkg-label">{pkg.label}</div>
                  <div className="mnm-pkg-desc">{pkg.desc}</div>
                  <div className="mnm-pkg-price">{pkg.price}</div>
                  {form.package === pkg.value && <div className="mnm-pkg-check">✓</div>}
                </label>
              ))}
            </div>
            {errors.package && <div className="mnm-inline-error">Please select a package.</div>}

            <div className="mnm-etransfer-info">
              Payment by e-transfer to: <strong>cherrydancestudio.cds@gmail.com</strong><br />
              Message: <strong>MnM – [Your Name]</strong>
            </div>

            {/* Second child */}
            {(form.package === 'mom_2kids' || form.package === 'mom_3kids') && (
              <div className="mnm-child2-section">
                <div className="mnm-child2-label">Second Child's Details</div>
                <div className="mnm-row-2">
                  <Field label="Second Child's Name" required error={errors.child2Name}>
                    <input type="text" value={form.child2Name} onChange={e => set('child2Name', e.target.value)} placeholder="e.g. Lily" />
                  </Field>
                  <Field label="Second Child's Age" required error={errors.child2Age}>
                    <select value={form.child2Age} onChange={e => set('child2Age', e.target.value)}>
                      <option value="">Select age</option>
                      {AGES.map(a => <option key={a}>{a}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
            )}

            {/* Third child */}
            {form.package === 'mom_3kids' && (
              <div className="mnm-child2-section">
                <div className="mnm-child2-label">Third Child's Details</div>
                <div className="mnm-row-2">
                  <Field label="Third Child's Name" required error={errors.child3Name}>
                    <input type="text" value={form.child3Name} onChange={e => set('child3Name', e.target.value)} placeholder="e.g. Zara" />
                  </Field>
                  <Field label="Third Child's Age" required error={errors.child3Age}>
                    <select value={form.child3Age} onChange={e => set('child3Age', e.target.value)}>
                      <option value="">Select age</option>
                      {AGES.map(a => <option key={a}>{a}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
            )}

            <div className="mnm-sep" />

            {/* Allergies */}
            <div className="mnm-section-heading">
              <span className="mnm-section-num">04</span>
              <span>Snack &amp; Allergy Info</span>
            </div>

            <div className="mnm-field">
              <label>Do your children have any food allergies?</label>
              <div className="mnm-options two-col" style={{ marginBottom: '10px' }}>
                {[
                  { value: 'no', label: 'No allergies' },
                  { value: 'yes', label: "Yes, I'll specify" },
                ].map(opt => (
                  <label key={opt.value} className={`mnm-option${form.allergy === opt.value ? ' selected' : ''}`}>
                    <input type="radio" name="allergy" value={opt.value} checked={form.allergy === opt.value} onChange={() => set('allergy', opt.value)} />
                    <span className="mnm-option-dot" />
                    <span className="mnm-option-text">{opt.label}</span>
                  </label>
                ))}
              </div>
              {form.allergy === 'yes' && (
                <textarea value={form.allergyText} onChange={e => set('allergyText', e.target.value)} placeholder="e.g. peanut allergy, dairy-free, gluten-free…" />
              )}
              <div className="mnm-note"><strong>Snacks are included</strong> for moms and kids — we want everyone safe and happy!</div>
            </div>

            <div className="mnm-sep" />

            {/* Source */}
            <div className="mnm-section-heading">
              <span className="mnm-section-num">05</span>
              <span>Just Curious! <span className="mnm-optional">(optional)</span></span>
            </div>
            <div className="mnm-field">
              <label>How did you hear about this event?</label>
              <div className="mnm-options two-col">
                {[
                  { value: 'instagram', label: 'Instagram' },
                  { value: 'whatsapp', label: 'WhatsApp' },
                  { value: 'friend', label: 'Friend/Family' },
                  { value: 'other', label: 'Other' },
                ].map(opt => (
                  <label key={opt.value} className={`mnm-option${form.source === opt.value ? ' selected' : ''}`}>
                    <input type="radio" name="source" value={opt.value} checked={form.source === opt.value} onChange={() => set('source', opt.value)} />
                    <span className="mnm-option-dot" />
                    <span className="mnm-option-text">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price summary */}
            {selectedPkg && (
              <div className="mnm-summary">
                <div className="mnm-summary-row">
                  <span>{selectedPkg.label}</span>
                  <strong>{selectedPkg.price}</strong>
                </div>
                <div className="mnm-summary-note">E-transfer to cherrydancestudio.cds@gmail.com</div>
              </div>
            )}

            {submitError && <div className="mnm-submit-error">{submitError}</div>}

            <button type="submit" className="mnm-submit-btn" disabled={submitting}>
              {submitting
                ? <span className="mnm-spinner">Registering…</span>
                : <>Reserve My Spot</>
              }
            </button>

          </form>
        </div>

        <p className="mnm-footer-note">
          Need help? <a href="https://wa.me/16138903789">WhatsApp 613-890-3789</a>
        </p>
      </div>
    </div>
  );
};

export default MnMRegistration;
