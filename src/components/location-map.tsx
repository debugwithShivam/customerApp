import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Constants from 'expo-constants';
import { Platform, StyleSheet, Text, View } from 'react-native';

export type MapPin = { latitude: number; longitude: number };
type Props = { center: MapPin; selected: MapPin | null; onSelect: (pin: MapPin) => void };

export function LocationMap({ center, selected, onSelect }: Props) {
  const mapsEnabled = Constants.expoConfig?.extra?.googleMapsAndroidEnabled === true;
  if (Platform.OS === 'android' && !mapsEnabled) {
    return <View style={styles.frame}><Text style={styles.unavailable}>Google Maps is unavailable because this build has no configured Android Maps API key. Use address search or rebuild with the key configured.</Text></View>;
  }

  const focus = selected ?? center;
  return <View style={styles.frame}>
    <MapView
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      region={{ ...focus, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
      onPress={({ nativeEvent }) => onSelect(nativeEvent.coordinate)}
    >
      {selected ? <Marker coordinate={selected} title="Delivery location" draggable onDragEnd={({ nativeEvent }) => onSelect(nativeEvent.coordinate)} /> : null}
    </MapView>
  </View>;
}

const styles = StyleSheet.create(
  {
    frame:
    {
      height: 210,
      width: '100%',
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 10,
      backgroundColor: '#1d292a'
    },
    map: { flex: 1 },
    unavailable: { color: '#f5f8f8', fontSize: 12, lineHeight: 18, textAlign: 'center', paddingHorizontal: 18 }
  }
);
