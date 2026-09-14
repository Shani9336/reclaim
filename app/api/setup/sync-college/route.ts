import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { Role, SpaceType } from '@prisma/client';
import { scanAllDatabaseMatches } from '@/lib/matchingEngine';

export async function GET(_req: NextRequest) {
  try {
    const summary: Record<string, any> = {};

    // 1. Ensure Shani is created/promoted to SUPER_ADMIN
    const leaderEmail = 'shaniyadav777am@gmail.com';
    let leader = await prisma.user.findUnique({
      where: { email: leaderEmail },
    });

    if (!leader) {
      const hashedPassword = hashPassword('password123');
      leader = await prisma.user.create({
        data: {
          name: 'Shani (Project Leader)',
          email: leaderEmail,
          password: hashedPassword,
          role: Role.SUPER_ADMIN,
          image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=shani',
          showEmail: true,
        },
      });
      summary.leader = 'Created Shani as SUPER_ADMIN (Password: password123)';
    } else {
      leader = await prisma.user.update({
        where: { id: leader.id },
        data: {
          role: Role.SUPER_ADMIN,
          name: leader.name || 'Shani (Project Leader)',
        },
      });
      summary.leader = 'Updated Shani to SUPER_ADMIN';
    }

    // 2. Update Space to Devkiba College
    const campusSpace = await prisma.space.findFirst({
      where: {
        OR: [
          { name: { contains: 'Patil', mode: 'insensitive' } },
          { type: SpaceType.CAMPUS },
        ],
      },
    });

    let spaceId = campusSpace?.id;
    if (campusSpace) {
      await prisma.space.update({
        where: { id: campusSpace.id },
        data: {
          name: 'Devkiba College',
          description: 'Devkiba Mohansinhji Chauhan College of Commerce & Science, Silvassa',
          address: 'Devkiba College Campus, Silvassa',
          city: 'Silvassa',
          state: 'Dadra and Nagar Haveli',
          lat: 20.2707,
          lng: 73.0083,
          adminId: leader.id,
        },
      });
      summary.space = 'Updated Space to Devkiba College, Silvassa';
    } else {
      const newSpace = await prisma.space.create({
        data: {
          name: 'Devkiba College',
          type: SpaceType.CAMPUS,
          description: 'Devkiba Mohansinhji Chauhan College of Commerce & Science, Silvassa',
          address: 'Devkiba College Campus, Silvassa',
          city: 'Silvassa',
          state: 'Dadra and Nagar Haveli',
          lat: 20.2707,
          lng: 73.0083,
          adminId: leader.id,
        },
      });
      spaceId = newSpace.id;
      summary.space = 'Created new Devkiba College Space';
    }

    // 3. Update all existing items referencing DY Patil or Nerul
    const allItems = await prisma.item.findMany();
    let updatedItemCount = 0;

    for (const item of allItems) {
      let changed = false;
      let newLocation = item.locationText || '';
      let newTitle = item.title;
      let newDescription = item.description;

      if (newLocation.includes('DY Patil') || newLocation.includes('Nerul')) {
        newLocation = newLocation
          .replace(/DY Patil University/g, 'Devkiba College')
          .replace(/DY Patil/g, 'Devkiba College')
          .replace(/Nerul/g, 'Silvassa');
        changed = true;
      }

      if (newTitle.includes('DY Patil')) {
        newTitle = newTitle.replace(/DY Patil University/g, 'Devkiba College').replace(/DY Patil/g, 'Devkiba');
        changed = true;
      }

      if (newDescription.includes('DY Patil')) {
        newDescription = newDescription.replace(/DY Patil University/g, 'Devkiba College').replace(/DY Patil/g, 'Devkiba College');
        changed = true;
      }

      if (changed || (spaceId && !item.spaceId)) {
        await prisma.item.update({
          where: { id: item.id },
          data: {
            locationText: newLocation || 'Devkiba College Campus, Silvassa',
            title: newTitle,
            description: newDescription,
            locationLat: 20.2707,
            locationLng: 73.0083,
            ...(spaceId ? { spaceId } : {}),
          },
        });
        updatedItemCount++;
      }
    }
    summary.updatedItems = `Updated ${updatedItemCount} items to reference Devkiba College`;

    // 4. Refresh all matches
    const matchCount = await scanAllDatabaseMatches();
    summary.matchesRescanned = matchCount;

    // 5. Test Feedback Submission
    try {
      const fbRes = await fetch('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Shani (Tester)',
          email: 'shaniyadav777am@gmail.com',
          topic: 'The app is great! 🎉',
          message: 'Testing feedback card - everything is working perfectly!',
          type: 'feedback',
        }),
      });
      summary.feedbackTest = await fbRes.json();
    } catch (e: any) {
      summary.feedbackTestError = e.message;
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully migrated platform data to Devkiba College & initialized Project Leader',
      summary,
    });
  } catch (error: any) {
    console.error('[GET /api/setup/sync-college]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
