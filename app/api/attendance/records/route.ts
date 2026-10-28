import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../src/lib/supabaseAdmin';
import { verifyAdminToken } from '../../../../src/lib/adminAuth';

// GET — admin only. Optional ?classId=&date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const classId = req.nextUrl.searchParams.get('classId');
  const date    = req.nextUrl.searchParams.get('date');

  let query = supabaseAdmin
    .from('attendance_records')
    .select(`
      id, date, marked_at,
      student:attendance_students(id, name),
      class:attendance_classes(id, name)
    `)
    .order('date', { ascending: false })
    .order('marked_at', { ascending: true });

  if (classId) query = query.eq('class_id', classId);
  if (date)    query = query.eq('date', date);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ records: data });
}
