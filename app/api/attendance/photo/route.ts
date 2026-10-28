import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../src/lib/supabaseAdmin';

// POST — public, called by kiosk to upload a student's selfie
// Body: { studentId: string, photoData: string } — photoData is a base64 JPEG data URL
export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const { studentId, photoData } = await req.json();
  if (!studentId || !photoData) return NextResponse.json({ error: 'studentId and photoData required' }, { status: 400 });

  // Decode base64 data URL → buffer
  const base64 = photoData.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');

  const fileName = `${studentId}.jpg`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('student-photos')
    .upload(fileName, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabaseAdmin.storage
    .from('student-photos')
    .getPublicUrl(fileName);

  const photoUrl = urlData.publicUrl;

  // Save URL to students table
  const { error: dbError } = await supabaseAdmin
    .from('students')
    .update({ profile_photo_url: photoUrl })
    .eq('id', studentId);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ ok: true, photoUrl });
}
