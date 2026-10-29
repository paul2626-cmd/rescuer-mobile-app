import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Camera, Map as NativeMap, Marker, UserLocation } from '@maplibre/maplibre-react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { C, useThemeMode } from './theme';
import { Txt } from './ui';
import { formatAddress } from './format';

const CARTO_KEY = process.env.EXPO_PUBLIC_CARTO_KEY ?? '';
const PHILIPPINES_BOUNDS = [[114, 4.5], [127, 21.5]] as any;

function cartoStyle(theme: 'dark' | 'light') {
  if (!CARTO_KEY) return 'https://demotiles.maplibre.org/style.json';
  const style = theme === 'dark' ? 'dark-matter-gl-style' : 'positron-gl-style';
  return `https://basemaps.cartocdn.com/gl/${style}/style.json?key=${CARTO_KEY}`;
}

export function AssignmentMap({ incident, team }: { incident: any; team?: any }) {
  const theme = useThemeMode();
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [locationError, setLocationError] = useState('');
  const lat = Number(incident?.latitude);
  const lng = Number(incident?.longitude);
  const hasIncident = incident?.latitude != null && incident?.longitude != null && Number.isFinite(lat) && Number.isFinite(lng);
  const baseLat = Number(team?.base_latitude);
  const baseLng = Number(team?.base_longitude);
  const hasBase = team?.base_latitude != null && team?.base_longitude != null && Number.isFinite(baseLat) && Number.isFinite(baseLng);

  async function locateMe() {
    setLocationError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationError('Allow location access to show your position on the incident map.');
        return;
      }
      const result = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = result.coords;
      if (latitude < 4.5 || latitude > 21.5 || longitude < 114 || longitude > 127) {
        setLocationError('Your current location is outside the Philippines map coverage.');
        return;
      }
      setLocation(result.coords);
    } catch {
      setLocationError('Current location is unavailable. Check that location services are on.');
    }
  }

  if (!hasIncident) {
    return (
      <View>
        <View style={{ height: 150, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border, borderRadius: 14, backgroundColor: C.panel, alignItems: 'center', justifyContent: 'center', gap: 9 }}>
          <Ionicons name="locate-outline" size={21} color={C.muted} />
          <Txt muted size={12} style={{ textAlign: 'center' }}>No coordinates recorded for this incident.</Txt>
        </View>
        <Txt muted size={11} style={{ marginTop: 8 }}>⌖  {formatAddress(incident)}</Txt>
      </View>
    );
  }

  return (
    <View>
      <View style={{ height: 240, borderRadius: 15, overflow: 'hidden', backgroundColor: C.panel2 }}>
        <NativeMap
          mapStyle={cartoStyle(theme as 'dark' | 'light')}
          style={{ flex: 1 }}
          dragPan
          touchZoom
          doubleTapZoom
          compass={false}
          logo
          attribution
        >
          <Camera
            initialViewState={{ center: [lng, lat], zoom: 14 } as any}
            maxBounds={PHILIPPINES_BOUNDS}
            minZoom={5}
            maxZoom={18}
          />
          <Marker id="incident" lngLat={[lng, lat]} anchor="bottom">
            <View style={{ width: 26, height: 32, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 22, height: 22, borderRadius: 12, backgroundColor: C.red, borderWidth: 3, borderColor: '#ffffff', alignItems: 'center', justifyContent: 'center', elevation: 5 }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#ffffff' }} />
              </View>
            </View>
          </Marker>
          {hasBase ? (
            <Marker id="team-base" lngLat={[baseLng, baseLat]} anchor="center">
              <View style={{ width: 19, height: 19, borderRadius: 10, backgroundColor: C.green, borderWidth: 3, borderColor: '#ffffff', elevation: 4 }} />
            </Marker>
          ) : null}
          {location ? <Marker id="rescuer-location" lngLat={[location.longitude, location.latitude]} anchor="center"><View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#4285f4', borderWidth: 4, borderColor: '#ffffff', elevation: 5 }} /></Marker> : null}
          <UserLocation animated accuracy minDisplacement={12} />
        </NativeMap>
        <Pressable accessibilityRole="button" accessibilityLabel="Show my location" onPress={locateMe} style={({ pressed }) => ({ position: 'absolute', right: 11, top: 11, width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: C.panel, borderColor: C.border, borderWidth: 1, opacity: pressed ? 0.7 : 0.95 })}>
          <Ionicons name="locate-outline" size={19} color={C.text} />
        </Pressable>
      </View>
      {locationError ? <Txt size={11} style={{ color: C.warning, marginTop: 6 }}>{locationError}</Txt> : null}
      <Txt muted size={11} style={{ marginTop: 8 }}>⌖  {formatAddress(incident)}</Txt>
    </View>
  );
}
