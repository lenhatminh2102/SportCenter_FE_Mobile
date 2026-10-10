import { StyleSheet } from 'react-native';
import { colors } from '@/data/sport';
export const ui = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 22, gap: 20, width: '100%', maxWidth: 640, alignSelf: 'center', paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  card: { backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 12 },
  title: { fontSize: 29, fontWeight: '800', color: colors.ink, lineHeight: 37 },
  heading: { fontSize: 20, fontWeight: '700', color: colors.ink },
  body: { fontSize: 15, color: colors.muted, lineHeight: 24 },
  link: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  error: { color: '#b91c1c', fontSize: 13, lineHeight: 20 },
});
