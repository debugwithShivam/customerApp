import { StyleSheet, Text, View } from 'react-native';

export type MapPin = { latitude: number; longitude: number };
type Props = { center: MapPin; selected: MapPin | null; onSelect: (pin: MapPin) => void };

export function LocationMap(_props: Props) {
  return <View style={styles.frame}><Text style={styles.notice}>Open the Android or iOS app to pick a delivery location on the map.</Text></View>;
}

const styles = StyleSheet.create({
  frame: { height: 210, width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 10, backgroundColor: '#1d292a', alignItems: 'center', justifyContent: 'center', padding: 20 },
  notice: { color: '#f5f8f8', textAlign: 'center', fontSize: 11 }
});
