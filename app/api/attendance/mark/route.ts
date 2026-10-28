import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../src/lib/supabaseAdmin';

// POST — public, called by the iPad kiosk when a student taps their name
export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const { studentId, classId } = await req.json();
  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 });

  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

  const { error } = await supabaseAdmin
    .from('attendance_records')
    .upsert(
      { student_id: studentId, class_id: classId || null, date: today },
      { onConflict: 'student_id,date', ignoreDuplicates: true }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — public, allow unmarking (in case of accidental tap)
export async function DELETE(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const { studentId } = await req.json();
  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 });

  const today = new Date().toLocaleDateString('en-CA');

  const { error } = await supabaseAdmin
    .from('attendance_records')
    .delete()
    .eq('student_id', studentId)
    .eq('date', today);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
