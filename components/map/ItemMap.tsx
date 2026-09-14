'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';

// Leaflet types
interface MapItem {
  id: string;
  type: 'LOST' | 'FOUND';
  title: string;
  category: string;
  locationText?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  status: string;
}

interface ItemMapProps {
  items: MapItem[];
}

// Default center: Devkiba College, Silvassa
const DEFAULT_CENTER: [number, number] = [20.2707, 73.0083];
const DEFAULT_ZOOM = 14;

export default function ItemMap({ items }: ItemMapProps) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Dynamically import Leaflet (client-side only)
    import('leaflet').then((L) => {
      if (!mapContainerRef.current || mapRef.current) return;

      // Fix Leaflet default marker icons (broken in webpack)
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Create map
      const map = L.map(mapContainerRef.current).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      mapRef.current = map;

      // OpenStreetMap tiles (free, no API key needed)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Custom icons for lost vs found
      const lostIcon = L.divIcon({
        html: `<div style="
          background: #ef4444;
          border: 2px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "><span style="transform: rotate(45deg); font-size: 12px;">🔍</span></div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -30],
      });

      const foundIcon = L.divIcon({
        html: `<div style="
          background: #22c55e;
          border: 2px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "><span style="transform: rotate(45deg); font-size: 12px;">✅</span></div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -30],
      });

      // Add markers for items with coordinates
      const markersAdded: [number, number][] = [];

      items.forEach((item) => {
        if (!item.locationLat || !item.locationLng) return;

        const icon = item.type === 'LOST' ? lostIcon : foundIcon;
        const marker = L.marker([item.locationLat, item.locationLng], { icon });

        // Popup with item info + link
        const typeLabel = item.type === 'LOST' ? '🔍 Lost' : '✅ Found';
        const categoryLabel = item.category.charAt(0) + item.category.slice(1).toLowerCase();
        marker.bindPopup(`
          <div style="font-family: Inter, sans-serif; min-width: 180px;">
            <div style="font-size: 11px; color: ${item.type === 'LOST' ? '#ef4444' : '#22c55e'}; font-weight: 600; margin-bottom: 4px;">
              ${typeLabel} · ${categoryLabel}
            </div>
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 6px; color: #111827;">
              ${item.title}
            </div>
            ${item.locationText ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">📍 ${item.locationText}</div>` : ''}
            <a href="/items/${item.id}" style="
              display: inline-block;
              background: #4F46E5;
              color: white;
              padding: 4px 12px;
              border-radius: 6px;
              font-size: 12px;
              text-decoration: none;
              font-weight: 500;
            ">View details →</a>
          </div>
        `);

        marker.addTo(map);
        markersAdded.push([item.locationLat, item.locationLng]);
      });

      // Fit map bounds to all markers if there are some
      if (markersAdded.length > 0) {
        const bounds = L.latLngBounds(markersAdded);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    });

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [items]);

  return (
    <div
      ref={mapContainerRef}
      className="h-[600px] w-full rounded-xl overflow-hidden border shadow-sm z-0"
      style={{ minHeight: '400px' }}
    />
  );
}
