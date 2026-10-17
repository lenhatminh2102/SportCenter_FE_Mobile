import type { ReactElement } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useStaffShell } from '@/context/staff-shell';
import { entityId, type Entity } from '@/services/operations';
import { QueryStatus } from './access';
import { ui } from './styles';
export function ListPage({ title, description, items, loading, error, reload, controls, renderItem, empty = 'Chưa có dữ liệu.' }: {
  title: string; description: string; items: Entity[]; loading: boolean; error: Error | null; reload: () => void;
  controls?: ReactElement; renderItem: (item: Entity) => ReactElement; empty?: string;
}) {
  const staff = useStaffShell();
  return <SafeAreaView edges={staff ? ['bottom', 'left', 'right'] : ['top', 'bottom', 'left', 'right']} style={ui.page}><FlatList data={items} keyExtractor={entityId} contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled" refreshing={loading} onRefresh={reload} ListHeaderComponent={<View style={{ gap: 16, marginBottom: 22 }}><Link href="/operations" style={ui.link}>← Không gian của tôi</Link><Text style={ui.eyebrow}>ACTIVEHUB · KẾT NỐI TRUNG TÂM</Text><Text style={ui.title}>{title}</Text><Text style={ui.body}>{description}</Text>{controls}<QueryStatus loading={loading} error={error} retry={reload} /></View>} ListEmptyComponent={!loading && !error ? <View style={ui.card}><Text style={ui.heading}>{empty}</Text><Text style={ui.body}>Kéo xuống để cập nhật thông tin mới nhất.</Text></View> : null} ItemSeparatorComponent={() => <View style={{ height: 14 }} />} renderItem={({ item }) => renderItem(item)} /></SafeAreaView>;
}
