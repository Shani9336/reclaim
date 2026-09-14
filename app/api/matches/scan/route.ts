import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { scanAllDatabaseMatches } from '@/lib/matchingEngine';

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await scanAllDatabaseMatches();

    return NextResponse.json({
      success: true,
      matchesFound: count,
      message: `Scanned all items and synced ${count} matches!`,
    });
  } catch (error: any) {
    console.error('[POST /api/matches/scan]', error);
    return NextResponse.json({ error: error.message || 'Scan failed' }, { status: 500 });
  }
}
