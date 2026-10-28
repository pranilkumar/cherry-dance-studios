import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../src/lib/supabaseAdmin';
import { verifyAdminToken } from '../../../../src/lib/adminAuth';

// GET — public, used by iPad kiosk. Pass ?classId=<uuid>
export async function GET(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const classId = req.nextUrl.searchParams.get('classId');
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('attendance_students')
    .select('id, name')
    .eq('class_id', classId)
    .eq('active', true)
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ students: data });
}

// POST — admin only, add a student
export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const { classId, name } = await req.json();
  if (!classId || !name?.trim()) return NextResponse.json({ error: 'classId and name required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('attendance_students')
    .insert({ class_id: classId, name: name.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ student: data });
}

// DELETE — admin only, deactivate a student
export async function DELETE(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const { id } = await req.json();
  const { error } = await supabaseAdmin
    .from('attendance_students')
    .update({ active: false })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
