export const INCIDENT_TYPES = [
  { value: 'FLOOD', label: 'Flood' },
  { value: 'FIRE', label: 'Fire' },
  { value: 'EARTHQUAKE', label: 'Earthquake' },
  { value: 'LANDSLIDE', label: 'Landslide' },
  { value: 'SEVERE_WEATHER', label: 'Severe weather' },
  { value: 'MEDICAL_EMERGENCY', label: 'Medical emergency' },
  { value: 'ROAD_INCIDENT', label: 'Road incident' },
  { value: 'MISSING_OR_STRANDED_PERSON', label: 'Missing or stranded person' },
  { value: 'UTILITY_HAZARD', label: 'Utility hazard' },
  { value: 'OTHER', label: 'Other' },
];

export const RESCUE_STEPS = [
  { status: 'ASSIGNED', label: 'Assigned' },
  { status: 'ACCEPTED', label: 'Accepted' },
  { status: 'EN_ROUTE', label: 'En route' },
  { status: 'ON_SCENE', label: 'On scene' },
  { status: 'IN_PROGRESS', label: 'In progress' },
  { status: 'RESOLVED', label: 'Resolved' },
];

const statusLabels: Record<string, string> = {
  ASSIGNED: 'Assigned',
  ACCEPTED: 'Accepted',
  EN_ROUTE: 'En route',
  ON_SCENE: 'On scene',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  PENDING: 'Awaiting response',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
};

export function incidentLabel(value?: string | null) {
  if (!value) return 'Incident';
  return INCIDENT_TYPES.find((item) => item.value === value)?.label ?? value.replaceAll('_', ' ');
}

export function statusLabel(value?: string | null) {
  if (!value) return 'Unknown status';
  return statusLabels[value] ?? value.replaceAll('_', ' ');
}

export function formatDuration(seconds?: number | null) {
  if (seconds == null || !Number.isFinite(Number(seconds))) return '—';
  const minutes = Math.max(0, Math.round(Number(seconds) / 60));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

export function formatWhen(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatAddress(item: any) {
  const parts = [
    item?.barangay?.name ?? item?.barangay_name ?? item?.location?.barangay_name,
    item?.landmark ?? item?.location?.landmark,
    item?.address_text ?? item?.location?.address_text,
  ].filter((part) => typeof part === 'string' && part.trim().length > 0);
  return [...new Set(parts)].join(', ') || 'Location not recorded';
}

export function distanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const radians = (value: number) => (value * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = radians(toLat - fromLat);
  const dLng = radians(toLng - fromLng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(fromLat)) * Math.cos(radians(toLat)) * Math.sin(dLng / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
