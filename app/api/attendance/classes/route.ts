import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../src/lib/supabaseAdmin';
import { verifyAdminToken } from '../../../../src/lib/adminAuth';

// GET — public, used by the iPad kiosk app
// Reads from the existing class_batches table
export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const { data, error } = await supabaseAdmin
    .from('class_batches')
    .select('id, name, weekdays, start_time, end_time')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const classes = (data || []).map(c => ({
    id: c.id,
    name: c.name,
    schedule: [
      c.weekdays?.join(', '),
      c.start_time ? c.start_time.slice(0, 5) : null,
    ].filter(Boolean).join(' · ') || null,
  }));

  return NextResponse.json({ classes });
}

// Admin-only: kept for backward compatibility but class management is in /admin/classes
export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ error: 'Manage classes via /admin/classes' }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ error: 'Manage classes via /admin/classes' }, { status: 400 });
}
