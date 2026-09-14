import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/health — health check for monitoring and Railway
export async function GET() {
  const start = Date.now();

  try {
    // Check DB connectivity
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - start;

    // Check matching service
    let matcherStatus = 'unknown';
    try {
      const matcherResponse = await fetch(
        `${process.env.MATCHING_SERVICE_URL}/health`,
        { signal: AbortSignal.timeout(3000) }
      );
      matcherStatus = matcherResponse.ok ? 'ok' : 'degraded';
    } catch {
      matcherStatus = 'unavailable';
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      services: {
        database: { status: 'ok', latencyMs: dbLatency },
        matcher: { status: matcherStatus },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 503 }
    );
  }
}
