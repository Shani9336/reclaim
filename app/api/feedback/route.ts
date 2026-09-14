import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, topic, message, type } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('[FEEDBACK RECEIVED]', {
      name: name || 'Anonymous',
      email: email || 'Not provided',
      topic: topic || 'General',
      message,
      type: type || 'feedback',
      createdAt: new Date().toISOString(),
    });

    // Notify Project Leader (Shani) and Admins in their notification bell
    try {
      const admins = await prisma.user.findMany({
        where: {
          OR: [
            { role: 'SUPER_ADMIN' },
            { role: 'ADMIN' },
            { email: 'shaniyadav777am@gmail.com' },
          ],
        },
        select: { id: true },
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'SYSTEM',
            title: `Feedback from ${name || 'Student'}: ${topic || 'General'}`,
            body: `${message.slice(0, 150)}${message.length > 150 ? '...' : ''} (Email: ${email || 'Not given'})`,
            link: '/admin',
          },
        });
      }
    } catch (dbErr) {
      console.error('[FEEDBACK NOTIFICATION ERROR]', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback! We read every message.',
    });
  } catch (error: any) {
    console.error('[POST /api/feedback] Error:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
