import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Size check (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalExt = file.name.split('.').pop() || 'png';
    const safeExt = originalExt.toLowerCase().replace(/[^a-z0-9]/g, '');
    const filename = `${crypto.randomUUID()}.${safeExt || 'png'}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({
      secure_url: fileUrl,
      public_id: filename,
      format: safeExt,
      width: 800,
      height: 600,
    });
  } catch (error: any) {
    console.error('Local upload failed:', error);
    return NextResponse.json(
      { error: 'File upload failed. Please try again.' },
      { status: 500 }
    );
  }
}
