import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/auth';
import { referenceLabel } from '@/services/operations';
import { loadCoachRoster } from '@/services/coach-roster';
import { coachStudentName, type CoachStudent } from '@/utils/coach-roster';
import { useApiQuery } from '@/hooks/use-api-query';
import { AccessScreen } from '@/components/sport/access';
import { ListPage } from '@/components/sport/list-page';
import { Button, Field } from '@/components/sport/ui';
import { ui } from '@/components/sport/styles';
export default function CoachStudents() {
  const { user, token } = useAuth(); const { classId } = useLocalSearchParams<{ classId?: string }>();
  const [search, setSearch] = useState(''); const [status, setStatus] = useState('ALL');
  const role = user?.role;
  const load = useCallback(async () => {
    if (!token || role !== 'COACH') throw new Error('Phiên huấn luyện viên đã kết thúc.');
    return loadCoachRoster(token);
  }, [token, role]);
  const query = useApiQuery(load, !!token && role === 'COACH', false); const { reload } = query;
  useFocusEffect(useCallback(() => { reload(); }, [reload]));
  if (!user || !token) return <AccessScreen />;
  if (user.role !== 'COACH') return <AccessScreen denied />;
  const roster = (query.data || []).filter(item => !classId || item.class.id === classId || item.class._id === classId);
  const items = roster.filter(item => (status === 'ALL' || item.status === status) && `${coachStudentName(item)} ${referenceLabel(item.class)} ${String(item.member?.phone || '')}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')));
  return <ListPage title="Học viên đăng ký lớp" description="Tên hội viên xuất hiện sau khi lưu đăng ký vào lớp bạn phụ trách. Trạng thái chờ thanh toán được hiển thị riêng; danh sách điểm danh vẫn chỉ gồm người đã xác nhận." items={items} loading={query.loading} error={query.error} reload={reload} controls={<View style={{ gap: 12 }}><Text style={ui.body}>{query.data ? `${new Set(roster.map(item => item.memberId)).size} học viên · ${roster.length} đăng ký` : 'Đang lấy dữ liệu học viên'}</Text><Field label="Tìm học viên hoặc lớp" value={search} onChangeText={setSearch} placeholder="Nhập tên, lớp hoặc số điện thoại" /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{[['ALL', 'Tất cả'], ['PENDING_PAYMENT', 'Chờ thanh toán'], ['CONFIRMED', 'Đã xác nhận']].map(([value, label]) => <Button key={value} secondary={status !== value} title={label} onPress={() => setStatus(value)} />)}</View><Button secondary disabled={query.loading} title="Làm mới danh sách học viên" onPress={reload} /></View>} renderItem={record => {
    const item = record as CoachStudent;
    return <View style={ui.card}><Text style={ui.heading}>{coachStudentName(item)}</Text><Text style={ui.body}>Lớp: {referenceLabel(item.class)}</Text>{!!item.member?.phone && <Text style={ui.body}>Điện thoại: {String(item.member.phone)}</Text>}<Text style={ui.eyebrow}>{item.status === 'CONFIRMED' ? '✓ ĐÃ XÁC NHẬN' : '◷ CHỜ THANH TOÁN'}</Text>{!!item.registeredAt && <Text style={ui.body}>Đăng ký: {new Date(String(item.registeredAt)).toLocaleDateString('vi-VN')}</Text>}</View>;
  }} />;
}
