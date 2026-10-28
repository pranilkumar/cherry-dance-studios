import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../src/lib/supabaseAdmin';
import { verifyAdminToken } from '../../../../src/lib/adminAuth';

// GET — public, used by iPad kiosk. Pass ?classId=<uuid>
// Reads from the existing students table
export async function GET(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const classId = req.nextUrl.searchParams.get('classId');
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 });

  let query = supabaseAdmin
    .from('students')
    .select('id, student_name, profile_photo_url')
    .eq('status', 'active')
    .order('student_name');

  if (classId !== 'all') query = query.eq('class_batch_id', classId);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const students = (data || []).map(s => ({ id: s.id, name: s.student_name, photoUrl: s.profile_photo_url || null }));
  return NextResponse.json({ students });
}

// Student management is handled in /admin/students
export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ error: 'Manage students via /admin/students' }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ error: 'Manage students via /admin/students' }, { status: 400 });
}
