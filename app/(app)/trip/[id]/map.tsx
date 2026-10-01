import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTrip } from '../../../../src/hooks/useTrips';
import { useHotels, useActivities, useItinerary } from '../../../../src/hooks/useTripData';
import { font, radius, shadow, spacing, Palette } from '../../../../src/theme';
import { useTheme } from '../../../../src/theme/useTheme';
import { fmtDate } from '../../../../src/lib/format';
import { ItineraryType } from '../../../../src/lib/types';

interface MapPoint {
  id: string;
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  type: ItineraryType;
  time?: string;
  dayDate?: string;
}

const TYPE_META: Record<ItineraryType, { icon: string; color: string; label: string }> = {
  activity: { icon: 'sparkles', color: '#2563EB', label: 'Activity' },
  transport: { icon: 'train', color: '#0EA5E9', label: 'Transport' },
  food: { icon: 'restaurant', color: '#F97316', label: 'Food' },
  stay: { icon: 'bed', color: '#7C3AED', label: 'Stay' },
  other: { icon: 'ellipsis-horizontal', color: '#64748B', label: 'Other' },
};

export default function MapView() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip } = useTrip(id);
  const { data: hotels = [] } = useHotels(id);
  const { data: activities = [] } = useActivities(id);
  const { data: itinerary = [] } = useItinerary(id);
  const mapRef = React.useRef<HTMLDivElement | null>(null);
  const leafletMap = React.useRef<any>(null);
  const markersRef = React.useRef<any[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const points = React.useMemo<MapPoint[]>(() => {
    if (!trip) return [];
    const pts: MapPoint[] = [];
    const seen = new Set<string>();

    for (const h of hotels.filter((h) => h.tripId === trip.id && h.lat != null && h.lng != null)) {
      seen.add(h.id);
      pts.push({ id: `hotel-${h.id}`, name: h.name, subtitle: h.location || '', lat: h.lat!, lng: h.lng!, type: 'stay', dayDate: h.checkIn, time: h.checkInTime });
    }
    for (const a of activities.filter((a) => a.tripId === trip.id && a.lat != null && a.lng != null)) {
      seen.add(a.id);
      pts.push({ id: `activity-${a.id}`, name: a.name, subtitle: a.location || '', lat: a.lat!, lng: a.lng!, type: 'activity', dayDate: a.activityDate, time: a.time });
    }
    for (const it of itinerary.filter((i) => i.tripId === trip.id && i.lat != null && i.lng != null && !i.sourceId)) {
      pts.push({ id: `itin-${it.id}`, name: it.title, subtitle: it.location || '', lat: it.lat!, lng: it.lng!, type: it.type, dayDate: it.dayDate, time: it.time });
    }

    pts.sort((a, b) => {
      const d = (a.dayDate || '').localeCompare(b.dayDate || '');
      if (d !== 0) return d;
      return (a.time || '99').localeCompare(b.time || '99');
    });
    return pts;
  }, [trip, hotels, activities, itinerary]);

  React.useEffect(() => {
    if (Platform.OS !== 'web' || !mapRef.current || points.length === 0) return;
    if (leafletMap.current) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;
      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);

      const bounds: [number, number][] = [];
      const lineCoords: [number, number][] = [];
      const markers: any[] = [];

      points.forEach((p) => {
        const meta = TYPE_META[p.type];
        const icon = L.divIcon({
          className: '',
          iconSize: [32, 40],
          iconAnchor: [16, 40],
          popupAnchor: [0, -40],
          html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${meta.color};display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
            <span style="transform:rotate(45deg);font-size:14px;color:#fff;font-family:system-ui;">●</span>
          </div>`,
        });
        const marker = L.marker([p.lat, p.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${p.name}</b><br/>${p.subtitle}`);
        marker._pointId = p.id;
        marker.on('click', () => setSelectedId(p.id));
        markers.push(marker);
        bounds.push([p.lat, p.lng]);
        lineCoords.push([p.lat, p.lng]);
      });

      if (lineCoords.length > 1) {
        L.polyline(lineCoords, { color: '#64748B', weight: 2, dashArray: '6 4', opacity: 0.6 }).addTo(map);
      }
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }

      leafletMap.current = map;
      markersRef.current = markers;
    };
    document.head.appendChild(script);

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [points]);

  const focusPoint = (p: MapPoint) => {
    setSelectedId(p.id);
    if (leafletMap.current) {
      leafletMap.current.setView([p.lat, p.lng], 14, { animate: true });
      const marker = markersRef.current.find((m: any) => m._pointId === p.id);
      if (marker) marker.openPopup();
    }
  };

  if (!trip) return null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Map', headerTintColor: colors.text, headerStyle: { backgroundColor: colors.surface } }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {points.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="map-outline" size={48} color={colors.textFaint} />
            <Text style={styles.emptyTitle}>No pins yet</Text>
            <Text style={styles.emptySub}>Add locations with the search field in hotels, activities, or itinerary to see them on the map.</Text>
          </View>
        ) : (
          <>
            {Platform.OS === 'web' && (
              <View style={styles.mapWrap}>
                <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
              </View>
            )}

            <View style={styles.legend}>
              {(['stay', 'activity', 'food', 'transport', 'other'] as ItineraryType[]).filter((t) => points.some((p) => p.type === t)).map((t) => (
                <View key={t} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: TYPE_META[t].color }]} />
                  <Text style={styles.legendText}>{TYPE_META[t].label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.listTitle}>{points.length} place{points.length !== 1 ? 's' : ''}</Text>
            {points.map((p) => {
              const meta = TYPE_META[p.type];
              const active = selectedId === p.id;
              return (
                <Pressable key={p.id} style={[styles.card, active && { borderColor: meta.color }]} onPress={() => focusPoint(p)}>
                  <View style={[styles.cardIcon, { backgroundColor: meta.color }]}>
                    <Ionicons name={meta.icon as any} size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName} numberOfLines={1}>{p.name}</Text>
                    {!!p.subtitle && <Text style={styles.cardSub} numberOfLines={1}>{p.subtitle}</Text>}
                    {!!p.dayDate && <Text style={styles.cardDay}>{fmtDate(p.dayDate, 'ddd, MMM D')}</Text>}
                  </View>
                  {!!p.time && <Text style={styles.cardTime}>{p.time}</Text>}
                </Pressable>
              );
            })}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  mapWrap: { width: '100%', height: 380, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md } as any,
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: spacing.md, paddingVertical: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: font.size.xs, color: colors.textMuted },
  listTitle: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text, marginBottom: spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1.5, borderColor: colors.border, ...shadow.card },
  cardIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text },
  cardSub: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 1 },
  cardDay: { fontSize: font.size.xs, color: colors.textFaint, marginTop: 2 },
  cardTime: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.textMuted },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text, marginTop: spacing.md },
  emptySub: { fontSize: font.size.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, maxWidth: 280 },
});
