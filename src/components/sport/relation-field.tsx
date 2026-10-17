import { useCallback, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { request } from '@/services/api';
import { entityId, referenceLabel, type Entity } from '@/services/operations';
import { useApiQuery } from '@/hooks/use-api-query';
import { Button, Field } from './ui';
import { QueryStatus } from './access';
import { ui } from './styles';
export function RelationField({ label, path, token, value, onChange, disabled, error, initialLabel, filter, onSelect, optional, transformItems }: {
  label: string; path: string; token: string; value: string; onChange: (value: string) => void; disabled: boolean; error?: string; initialLabel?: string; filter?: (item: Entity) => boolean; onSelect?: (item: Entity) => void; optional?: boolean;
  transformItems?: (items: Entity[]) => Entity[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const load = useCallback(() => request<Entity[]>(path, { token }), [path, token]);
  const query = useApiQuery(load, open);
  const title = (item: Entity) => String(item.name || item.title || item.fullName || (item.courseId ? referenceLabel(item.courseId) : entityId(item)));
  const items = (transformItems ? transformItems(query.data || []) : query.data || []).filter(item => !filter || filter(item)).filter(item => `${title(item)} ${entityId(item)}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));
  return <View style={{ gap: 8 }}><Text style={ui.heading}>{label}</Text><Button secondary title={(value && (selectedLabel || initialLabel)) || (value ? 'Đã chọn · đổi lựa chọn' : `Chọn ${label.toLowerCase()}`)} disabled={disabled} onPress={() => setOpen(true)} />{optional && value && <Button secondary title="Bỏ lựa chọn" disabled={disabled} onPress={() => { onChange(''); setSelectedLabel(''); }} />}{!!error && <Text style={ui.error}>{error}</Text>}<Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}><SafeAreaView style={ui.page}><FlatList contentContainerStyle={ui.content} data={items} keyExtractor={entityId} keyboardShouldPersistTaps="handled" ListHeaderComponent={<View style={{ gap: 14, marginBottom: 16 }}><Text style={ui.title}>Chọn {label.toLowerCase()}</Text><Button secondary title="Đóng" onPress={() => setOpen(false)} /><Field label="Tìm kiếm" value={search} onChangeText={setSearch} /><QueryStatus loading={query.loading} error={query.error} retry={query.reload} /></View>} ListEmptyComponent={!query.loading && !query.error ? <Text style={ui.body}>Chưa có dữ liệu phù hợp. Tạo bản ghi liên quan trước.</Text> : null} ItemSeparatorComponent={() => <View style={{ height: 10 }} />} renderItem={({ item }) => <Pressable accessibilityRole="button" style={ui.card} onPress={() => { onChange(entityId(item)); setSelectedLabel(title(item)); onSelect?.(item); setOpen(false); }}><Text style={ui.heading}>{title(item)}</Text><Text style={[ui.body, { fontSize: 12 }]}>{entityId(item)}</Text></Pressable>} /></SafeAreaView></Modal></View>;
}
