import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';

export type MapPin = { latitude: number; longitude: number };
type Props = { center: MapPin; selected: MapPin | null; onSelect: (pin: MapPin) => void };

export function LocationMap({ center, selected, onSelect }: Props) {
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

const styles = StyleSheet.create({ frame: { height: 210, width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 10, backgroundColor: '#1d292a' }, map: { flex: 1 } });
