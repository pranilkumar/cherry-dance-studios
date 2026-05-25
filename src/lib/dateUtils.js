/**
 * Shared date/time utilities used across portal components.
 * Import from here rather than duplicating in each file.
 */

/** Format a HH:MM time string as 12-hour AM/PM. */
export function fmt24(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** Parse "YYYY-MM-DD" as a local-time date (avoids UTC timezone shift). */
export function parseLocalDate(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** Return the age in full years from a "YYYY-MM-DD" date-of-birth string. */
export function calcAge(dobIso) {
  const d = parseLocalDate(dobIso);
  if (!d) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

/** Map weekday name → JS getDay() integer. */
export const DAY_NUM = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};

/**
 * Returns the next scheduled class Date for a batch object, or null.
 * Used in PortalClasses — pair with formatNextClass() for display.
 */
export function getNextClassDate(batch) {
  if (!batch?.weekdays?.length || !batch.start_time) return null;
  const [hStr, mStr] = batch.start_time.split(':');
  const hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr, 10);
  const now = new Date();
  const todayDow = now.getDay();
  let minDaysAway = null;
  for (const day of batch.weekdays) {
    const dow = DAY_NUM[day];
    if (dow == null) continue;
    let daysAway = (dow - todayDow + 7) % 7;
    if (daysAway === 0) {
      const classTime = new Date(now);
      classTime.setHours(hours, minutes, 0, 0);
      if (classTime <= now) daysAway = 7;
    }
    if (minDaysAway === null || daysAway < minDaysAway) minDaysAway = daysAway;
  }
  if (minDaysAway === null) return null;
  const next = new Date(now);
  next.setDate(now.getDate() + minDaysAway);
  next.setHours(hours, minutes, 0, 0);
  next.setSeconds(0, 0);
  return next;
}

/**
 * Format a Date (from getNextClassDate) into { dayLabel, timeLabel, diffDays }.
 * e.g. { dayLabel: 'Tomorrow', timeLabel: '4:30 PM', diffDays: 1 }
 */
export function formatNextClass(date) {
  if (!date) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const day = new Date(date); day.setHours(0, 0, 0, 0);
  const diffDays = Math.round((day - now) / (1000 * 60 * 60 * 24));
  const dayLabel =
    diffDays === 0 ? 'Today' :
    diffDays === 1 ? 'Tomorrow' :
    date.toLocaleDateString('en-CA', { weekday: 'long' });
  const timeLabel = date.toLocaleTimeString('en-CA', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
  return { dayLabel, timeLabel, diffDays };
}

/**
 * Returns next class info for a student with a populated class_batch relation.
 * Returns { next: Date, daysAway: number, h: number, m: number, batchName: string }
 * Used in PortalDashboard.
 */
export function calcNextClass(student) {
  const batch = student.class_batch;
  if (!batch?.weekdays?.length || !batch.start_time) return null;
  const [h, m] = batch.start_time.split(':').map(Number);
  const now = new Date();
  const dow = now.getDay();
  let minDays = null;
  for (const day of batch.weekdays) {
    let d = (DAY_NUM[day] - dow + 7) % 7;
    if (d === 0) {
      const t = new Date(now); t.setHours(h, m, 0, 0);
      if (t <= now) d = 7;
    }
    if (minDays === null || d < minDays) minDays = d;
  }
  if (minDays === null) return null;
  const next = new Date(now);
  next.setDate(now.getDate() + minDays);
  next.setHours(h, m, 0, 0);
  return { next, daysAway: minDays, h, m, batchName: batch.name };
}
