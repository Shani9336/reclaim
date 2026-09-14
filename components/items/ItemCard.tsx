import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Clock, Tag, Award } from 'lucide-react';
import { cn, formatDate, timeAgo, truncate, getStatusClass } from '@/lib/utils';

interface ItemCardProps {
  item: {
    id: string;
    type: 'LOST' | 'FOUND';
    title: string;
    description: string;
    category: string;
    color?: string | null;
    brand?: string | null;
    images: string[];
    tags: string[];
    status: string;
    reward?: string | null;
    locationText?: string | null;
    dateLost?: string | null;
    dateFound?: string | null;
    createdAt: string;
    user?: { id: string; name?: string | null; image?: string | null };
    space?: { id: string; name: string } | null;
  };
  className?: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  ELECTRONICS: '📱',
  DOCUMENTS: '📄',
  WALLET: '👛',
  KEYS: '🗝️',
  BAGS: '👜',
  JEWELRY: '💍',
  CLOTHING: '👕',
  OTHER: '📦',
};

export function ItemCard({ item, className }: ItemCardProps) {
  const date = item.dateLost || item.dateFound;
  const isLost = item.type === 'LOST';

  return (
    <Link href={`/items/${item.id}`}>
      <Card
        className={cn(
          'group overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer border hover:border-primary/30',
          className
        )}
      >
        {/* Image */}
        <div className="relative h-48 bg-muted overflow-hidden">
          {item.images[0] ? (
            <Image
              src={item.images[0]}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-4xl bg-gradient-to-br from-muted to-muted/50">
              {CATEGORY_EMOJI[item.category] || '📦'}
            </div>
          )}

          {/* Overlays */}
          <div className="absolute top-2 left-2 flex gap-1.5">
            <Badge variant={isLost ? 'destructive' : 'success'} className="text-xs">
              {isLost ? '🔍 Lost' : '✅ Found'}
            </Badge>
          </div>

          <div className="absolute top-2 right-2">
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', getStatusClass(item.status))}>
              {item.status}
            </span>
          </div>

          {item.reward && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="warning" className="text-xs gap-1">
                <Award className="h-3 w-3" />
                {item.reward}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Category + color */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {CATEGORY_EMOJI[item.category]} {item.category}
            </span>
            {item.color && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{item.color}</span>
              </>
            )}
            {item.brand && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{item.brand}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors line-clamp-1">
            {item.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {truncate(item.description, 120)}
          </p>

          {/* Meta */}
          <div className="space-y-1.5">
            {item.locationText && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{item.locationText}</span>
              </div>
            )}
            {date && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                <span>{isLost ? 'Lost' : 'Found'} {formatDate(date)}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex items-center gap-1 mt-3 flex-wrap">
              {item.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-muted rounded-full text-xs text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">+{item.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Posted time */}
          <p className="text-xs text-muted-foreground mt-3">{timeAgo(item.createdAt)}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
