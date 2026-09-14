import { prisma } from '@/lib/prisma';

interface MatchCandidate {
  id: string;
  title: string;
  description: string;
  category: string;
  color?: string | null;
  brand?: string | null;
  locationText?: string | null;
  tags: string[];
  dateLost?: Date | null;
  dateFound?: Date | null;
  userId: string;
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after', 'beneath', 'under',
  'above', 'the', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that',
  'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
  'has', 'had', 'do', 'does', 'did', 'some', 'there', 'area', 'near'
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
}

function calculateJaccard(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Normalizes common color names to canonical groups
 */
function normalizeColor(color?: string | null): string {
  if (!color) return '';
  const c = color.toLowerCase().trim();
  if (c.includes('dark blue') || c.includes('navy') || c.includes('sky blue')) return 'blue';
  if (c.includes('grey') || c.includes('silver')) return 'gray';
  if (c.includes('golden') || c.includes('rose gold')) return 'gold';
  return c;
}

/**
 * Calculates a composite similarity score (0.0 to 1.0) between a lost and found item
 */
export function computeMatchScore(lost: MatchCandidate, found: MatchCandidate) {
  // 1. Category Score (25%)
  const categoryScore = lost.category === found.category ? 1.0 : 0.0;

  // 2. Title & Text Similarity (40%)
  const lostTitleTokens = tokenize(lost.title);
  const foundTitleTokens = tokenize(found.title);
  const titleJaccard = calculateJaccard(lostTitleTokens, foundTitleTokens);

  const lostAllTokens = tokenize(`${lost.title} ${lost.description} ${lost.tags.join(' ')}`);
  const foundAllTokens = tokenize(`${found.title} ${found.description} ${found.tags.join(' ')}`);
  const textJaccard = calculateJaccard(lostAllTokens, foundAllTokens);

  // Substring check for high-value title words (e.g. "iphone", "wildcraft", "wallet")
  let substringBonus = 0;
  for (const token of lostTitleTokens) {
    if (found.title.toLowerCase().includes(token) || found.description.toLowerCase().includes(token)) {
      substringBonus = Math.max(substringBonus, 0.5);
    }
  }

  const textScore = Math.min(1.0, titleJaccard * 0.5 + textJaccard * 0.3 + substringBonus * 0.2);

  // 3. Brand Score (15%)
  let brandScore = 0.5;
  if (lost.brand && found.brand) {
    brandScore = lost.brand.toLowerCase() === found.brand.toLowerCase() ? 1.0 : 0.0;
  } else if (lost.brand || found.brand) {
    const brand = (lost.brand || found.brand)!.toLowerCase();
    if (lost.title.toLowerCase().includes(brand) || found.title.toLowerCase().includes(brand) ||
        lost.description.toLowerCase().includes(brand) || found.description.toLowerCase().includes(brand)) {
      brandScore = 0.9;
    }
  }

  // 4. Color Score (10%)
  let colorScore = 0.5;
  const lostColor = normalizeColor(lost.color);
  const foundColor = normalizeColor(found.color);
  if (lostColor && foundColor) {
    colorScore = lostColor === foundColor ? 1.0 : 0.0;
  } else if (lostColor || foundColor) {
    const col = lostColor || foundColor;
    if (lost.description.toLowerCase().includes(col) || found.description.toLowerCase().includes(col)) {
      colorScore = 0.85;
    }
  }

  // 5. Location Proximity (10%)
  let locationScore = 0.5;
  if (lost.locationText && found.locationText) {
    const lostLocTokens = tokenize(lost.locationText);
    const foundLocTokens = tokenize(found.locationText);
    const locJaccard = calculateJaccard(lostLocTokens, foundLocTokens);
    locationScore = locJaccard > 0 ? Math.min(1.0, 0.5 + locJaccard) : 0.4;
  }

  // Final Weighted Composite
  // If category does NOT match, heavily penalize overall score
  const categoryMultiplier = categoryScore === 1.0 ? 1.0 : 0.2;

  const rawScore =
    textScore * 0.45 +
    categoryScore * 0.25 +
    brandScore * 0.15 +
    colorScore * 0.08 +
    locationScore * 0.07;

  const score = Math.round(Math.min(1.0, rawScore * categoryMultiplier) * 100) / 100;

  return {
    score,
    reasoning: {
      text: Math.round(textScore * 100) / 100,
      category: categoryScore,
      brand: Math.round(brandScore * 100) / 100,
      color: Math.round(colorScore * 100) / 100,
      location: Math.round(locationScore * 100) / 100,
    },
  };
}

/**
 * Runs matching for a specific item against all opposite items in the database.
 * Upserts matches with score >= 0.40 into the database and generates in-app notifications.
 */
export async function runLocalMatching(itemId: string) {
  try {
    const targetItem = await prisma.item.findUnique({ where: { id: itemId } });
    if (!targetItem) return [];

    const isLost = targetItem.type === 'LOST';
    const oppositeType = isLost ? 'FOUND' : 'LOST';

    const candidates = await prisma.item.findMany({
      where: {
        type: oppositeType,
        status: 'OPEN',
      },
    });

    const generatedMatches = [];

    for (const candidate of candidates) {
      const lostItem = isLost ? targetItem : candidate;
      const foundItem = isLost ? candidate : targetItem;

      const { score, reasoning } = computeMatchScore(lostItem, foundItem);

      // Save if similarity score is 45% or above
      if (score >= 0.45) {
        const match = await prisma.match.upsert({
          where: {
            lostItemId_foundItemId: {
              lostItemId: lostItem.id,
              foundItemId: foundItem.id,
            },
          },
          create: {
            lostItemId: lostItem.id,
            foundItemId: foundItem.id,
            score,
            reasoning,
            status: 'PENDING',
          },
          update: {
            score,
            reasoning,
          },
        });

        generatedMatches.push(match);

        // Notify both lost owner and finder
        const targetPercent = Math.round(score * 100);
        await prisma.notification.createMany({
          data: [
            {
              userId: lostItem.userId,
              type: 'MATCH_FOUND',
              title: `Match Found! ${targetPercent}% match for "${lostItem.title}"`,
              body: `We found a potential match: "${foundItem.title}". Check details in My Matches!`,
              link: '/matches',
            },
            {
              userId: foundItem.userId,
              type: 'MATCH_FOUND',
              title: `Match Found! ${targetPercent}% match for "${foundItem.title}"`,
              body: `A lost report matches your found item: "${lostItem.title}". Check details in My Matches!`,
              link: '/matches',
            },
          ],
          skipDuplicates: true,
        });
      }
    }

    return generatedMatches;
  } catch (err) {
    console.error('[runLocalMatching] Error:', err);
    return [];
  }
}

/**
 * Scans ALL lost items against ALL found items in the database and updates matches.
 */
export async function scanAllDatabaseMatches() {
  const lostItems = await prisma.item.findMany({ where: { type: 'LOST', status: 'OPEN' } });
  const foundItems = await prisma.item.findMany({ where: { type: 'FOUND', status: 'OPEN' } });

  let matchesCount = 0;

  for (const lost of lostItems) {
    for (const found of foundItems) {
      const { score, reasoning } = computeMatchScore(lost, found);
      if (score >= 0.45) {
        await prisma.match.upsert({
          where: {
            lostItemId_foundItemId: {
              lostItemId: lost.id,
              foundItemId: found.id,
            },
          },
          create: {
            lostItemId: lost.id,
            foundItemId: found.id,
            score,
            reasoning,
            status: 'PENDING',
          },
          update: {
            score,
            reasoning,
          },
        });
        matchesCount++;
      }
    }
  }

  return matchesCount;
}
