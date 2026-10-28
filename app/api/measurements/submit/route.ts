import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../src/lib/supabaseAdmin';

const WINDOW_MS  = 10 * 60 * 1000;
const MAX_REQS   = 5;
const ipMap      = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now    = Date.now();
  const record = ipMap.get(ip) ?? { count: 0, resetAt: now + WINDOW_MS };
  if (now > record.resetAt) { record.count = 0; record.resetAt = now + WINDOW_MS; }
  record.count++;
  ipMap.set(ip, record);
  return record.count > MAX_REQS;
}

function num(v: unknown): number | null {
  const n = parseFloat(String(v));
  return isFinite(n) && n > 0 ? n : null;
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }); }

  const {
    eventSlug, childName, parentName, phone,
    lehengaWaist, lehengaLength,
    blouseChest, blouseLowerBust, blouseWaist,
    blouseShoulder, blouseSleeve, blouseArmhole,
    blouseFront, blouseBack,
  } = body;

  const slug = String(eventSlug || '').trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
  const child  = String(childName  || '').trim();
  const parent = String(parentName || '').trim();
  const ph     = String(phone      || '').trim();

  if (!slug || !child || !parent || !ph) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const numFields = {
    lehenga_waist:     num(lehengaWaist),
    lehenga_length:    num(lehengaLength),
    blouse_chest:      num(blouseChest),
    blouse_lower_bust: num(blouseLowerBust),
    blouse_waist:      num(blouseWaist),
    blouse_shoulder:   num(blouseShoulder),
    blouse_sleeve:     num(blouseSleeve),
    blouse_armhole:    num(blouseArmhole),
    blouse_front:      num(blouseFront),
    blouse_back:       num(blouseBack),
  };

  if (Object.values(numFields).some(v => v === null)) {
    return NextResponse.json({ error: 'All measurements must be valid numbers.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('costume_measurements').insert({
    event_slug:  slug,
    child_name:  child,
    parent_name: parent,
    phone:       ph,
    ...numFields,
  });

  if (error) {
    console.error('[measurements/submit]', error);
    return NextResponse.json({ error: 'Failed to save. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
