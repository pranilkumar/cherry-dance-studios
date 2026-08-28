import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return NextResponse.json({ success: true }); // skip if not configured

  let token: string;
  try {
    ({ token } = await request.json());
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 });
  }

  if (!token) return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 });

  const res = await fetch(
    `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`,
    { method: 'POST' }
  );
  const data = await res.json();

  // reCAPTCHA v3 gives a score 0–1; ≥ 0.5 is considered human
  if (!data.success || data.score < 0.5) {
    return NextResponse.json({ success: false, score: data.score ?? 0 }, { status: 400 });
  }
  return NextResponse.json({ success: true, score: data.score });
}
