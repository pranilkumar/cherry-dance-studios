import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../src/lib/supabaseAdmin';

// GET — public, returns student IDs that have attendance today for a given class
// Used by the iPad kiosk to pre-populate the grid
export async function GET(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const classId = req.nextUrl.searchParams.get('classId');
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 });

  const today = new Date().toLocaleDateString('en-CA');

  const { data, error } = await supabaseAdmin
    .from('attendance_records')
    .select('student_id')
    .eq('class_id', classId)
    .eq('date', today);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ present: (data || []).map(r => r.student_id) });
}
