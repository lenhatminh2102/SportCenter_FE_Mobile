import { Text, View } from 'react-native';
import { colors } from '@/data/sport';
export function FlowSteps({ labels, current }: { labels: string[]; current: number }) {
  return <View accessibilityLabel={`Bước ${current + 1}: ${labels[current]}`} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{labels.map((label, index) => <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: index === current ? colors.primary : colors.surface }}><Text style={{ fontSize: 11, fontWeight: '700', color: index === current ? 'white' : colors.muted }}>{index < current ? '✓' : index + 1} {label}</Text></View>)}</View>;
}
