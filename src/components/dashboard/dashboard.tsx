import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useStaffShell } from '@/context/staff-shell';
import { loadDashboard } from '@/services/dashboard';
import { entityId, referenceLabel } from '@/services/operations';
import { isStaffRole, roleHome, type StaffRole } from '@/utils/staff-navigation';
import { useApiQuery } from '@/hooks/use-api-query';
import { AccessScreen, QueryStatus } from '@/components/sport/access';
import { Button } from '@/components/sport/ui';
import { ui } from '@/components/sport/styles';
import { coachStudentName } from '@/utils/coach-roster';
import { workflowDescriptions } from '@/utils/role-workflows';
import { colors } from '@/data/sport';
export function Dashboard({ role }: { role: StaffRole }) {
  const { user, token } = useAuth();
  const inStaffShell = useStaffShell();
  const { width } = useWindowDimensions();
  const userId = user?.id;
  const userRole = user?.role;
  const load = useCallback(async () => {
    if (!userId || !token || userRole !== role) throw new Error('Phiên đăng nhập đã kết thúc.');
    return loadDashboard(role, userId, token);
  }, [role, userId, userRole, token]);
  const query = useApiQuery(load, userRole === role && !!userId && !!token, false);
  const { reload } = query;
  useFocusEffect(useCallback(() => { reload(); }, [reload]));
  if (!user || !token) return <AccessScreen />;
  if (user.role !== role) return isStaffRole(user.role) ? <Redirect href={roleHome(user.role)} /> : <AccessScreen denied />;
  const data = query.data;
  const manager = role === 'CENTER_MANAGER';
  const openResource = (resource: string) => resource === 'members' ? router.push('/members') : resource === 'coach-students' ? router.push('/coach-students') : router.push({ pathname: '/workspace/[resource]', params: { resource } });
  const max = Math.max(1, ...(data?.week.map(day => day.count || 0) || []));
  const quickActions = manager ? [
    { label: 'Hồ sơ hội viên', resource: 'members' }, { label: 'Quản lý lớp học', resource: 'classes' }, { label: 'Quản lý lịch tập', resource: 'schedules' },
  ] : [
    { label: 'Kế hoạch tập luyện', resource: 'workout-plans' }, { label: 'Điểm danh lớp học', resource: 'attendances' }, { label: 'Cập nhật tiến độ', resource: 'lesson-progress' },
  ];
  return <SafeAreaView edges={inStaffShell ? ['bottom', 'left', 'right'] : ['top', 'bottom', 'left', 'right']} style={ui.page}><ScrollView refreshControl={<RefreshControl refreshing={query.loading} onRefresh={query.reload} />} contentContainerStyle={{ padding: 22, gap: 22, maxWidth: 1240, width: '100%', alignSelf: 'center', paddingBottom: 40 }}>
    <View style={[ui.between, { flexWrap: 'wrap' }]}><View style={{ gap: 6 }}><Text style={ui.eyebrow}>{manager ? 'TRUNG TÂM TRONG TẦM TAY' : 'MỖI BUỔI TẬP, MỘT BƯỚC TIẾN'}</Text><Text style={ui.title}>{manager ? 'Tổng quan vận hành' : 'Không gian huấn luyện'}</Text><Text style={ui.body}>{data?.today || 'Dữ liệu trực tiếp từ trung tâm'}</Text></View><Button secondary title={query.loading ? 'Đang tải…' : '↻ Làm mới'} disabled={query.loading} onPress={query.reload} /></View>
    <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: '#ffffff80', borderRadius: 22, padding: 24, gap: 12 }}><Text style={{ color: colors.primary, fontSize: 12, letterSpacing: 2, fontWeight: '700' }}>{manager ? 'MANAGER DASHBOARD' : 'COACH DASHBOARD'}</Text><Text style={{ color: colors.ink, fontSize: 25, fontWeight: '800', lineHeight: 34 }}>Chào {manager ? user.name : data?.name || user.name}!</Text><Text style={{ color: colors.muted, lineHeight: 24, fontSize: 15 }}>{manager ? 'Theo dõi hoạt động trung tâm và điều phối công việc trong ngày.' : 'Xem lịch dạy, chuẩn bị kế hoạch và đồng hành cùng học viên của bạn.'}</Text><View style={{ alignSelf: 'flex-start' }}><Button title={manager ? 'Quản lý lớp học →' : 'Xem lịch dạy →'} onPress={() => openResource(manager ? 'classes' : 'schedules')} /></View></View>
    <View style={ui.card}><Text style={ui.heading}>{workflowDescriptions[role].title}</Text>{workflowDescriptions[role].steps.map((step, index) => <Text key={step} style={ui.body}>{index + 1}. {step}</Text>)}<Button secondary title={manager ? 'Mở hướng dẫn và công cụ vận hành →' : 'Xem học viên lớp phụ trách →'} onPress={() => router.push(manager ? '/operations' : '/coach-students')} /></View>
    <QueryStatus loading={query.loading} error={query.error} retry={query.reload} />
    {!!data?.errors.length && <View style={[ui.card, { backgroundColor: '#fff8ec', borderColor: '#f1d7a6' }]}><Text style={ui.heading}>Một phần dữ liệu chưa tải được</Text>{data.errors.map(error => <Text key={error} style={ui.error}>{error}</Text>)}<Text style={ui.body}>Chỉ số thiếu dữ liệu hiển thị dấu —. Kéo xuống hoặc bấm làm mới để thử lại.</Text></View>}
    {data && <><View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -6 }}>{data.metrics.map((metric, index) => <View key={metric.label} style={{ width: width >= 1250 ? '25%' : '50%', padding: 6 }}><Pressable accessibilityRole="button" accessibilityLabel={`${metric.label}: ${metric.value ?? 'chưa tải được'}, mở chi tiết`} onPress={() => openResource(metric.resource)} style={({ pressed }) => [ui.card, { minHeight: 170, opacity: pressed ? 0.7 : 1 }]}><View style={{ width: 36, height: 36, borderRadius: 22, backgroundColor: ['#c18cdd', '#e59679', '#73a0df', '#efbf69'][index], alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: 'white', fontSize: 20 }}>{['♧', '▤', '◷', '◇'][index]}</Text></View><Text style={[ui.body, { fontSize: 13 }]}>{metric.label}</Text><Text style={{ color: colors.ink, fontSize: 32, fontWeight: '800' }}>{metric.value ?? '—'}</Text><Text style={[ui.link, { fontSize: 11 }]}>Xem chi tiết ↗</Text></Pressable></View>)}</View>
    <View style={ui.card}><View style={ui.between}><Text style={ui.heading}>Lịch 7 ngày tới</Text><Text style={{ color: colors.muted, fontSize: 11 }}>Số buổi · không tính đã hủy</Text></View>{data.week.every(day => day.count === null) ? <Text style={ui.body}>Chưa tải được lịch tập.</Text> : <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end', height: 160, marginTop: 10 }}>{data.week.map(day => <View key={day.day} style={{ flex: 1, alignItems: 'center', gap: 8 }}><Text style={{ fontSize: 12, color: colors.primary, fontWeight: '700' }}>{day.count ?? '—'}</Text><View style={{ width: '80%', height: Math.max(2, (day.count || 0) / max * 100), borderRadius: 6, backgroundColor: day.count ? ['#edb496', '#c9a2d9', '#f05a28', '#e6ac8c', '#cfa9d8', '#ee925f', '#f3c89d'][data.week.indexOf(day)] : colors.border }} /><Text style={{ fontSize: 10, color: colors.muted }}>{day.day.slice(8)}/{day.day.slice(5, 7)}</Text></View>)}</View>}</View>
    <View style={{ flexDirection: width >= 1200 ? 'row' : 'column', gap: 20 }}><View style={[ui.card, { flex: 1 }]}><View style={ui.between}><Text style={ui.heading}>{manager ? 'Lịch lớp sắp tới' : 'Buổi dạy sắp tới'}</Text><Pressable accessibilityRole="button" onPress={() => openResource('schedules')} style={{ paddingVertical: 12 }}><Text style={ui.link}>Xem tất cả</Text></Pressable></View>{!data.sessions.length && <Text style={ui.body}>{data.week.every(day => day.count === null) ? 'Chưa tải được lịch.' : 'Chưa có buổi đã lên lịch từ hôm nay.'}</Text>}{data.sessions.map(session => <View key={entityId(session)} style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 14, gap: 6 }}><Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>{String(session.date).slice(0, 10)} · {String(session.startTime)} – {String(session.endTime)}</Text><Text style={ui.heading}>{referenceLabel(session.classId)}</Text><Text style={ui.body}>{referenceLabel(session.lessonId)}</Text></View>)}</View>
    <View style={[ui.card, { flex: 1 }]}><Text style={ui.heading}>Thao tác nhanh</Text><Text style={ui.body}>Đi thẳng tới công việc cần làm.</Text>{quickActions.map(action => <Button key={action.resource} secondary title={action.label} onPress={() => router.push(action.resource === 'members' ? '/members/edit' : { pathname: '/workspace/[resource]/edit', params: { resource: action.resource } })} />)}</View></View>
    {!manager && <View style={ui.card}><Text style={ui.heading}>Học viên mới đăng ký</Text>{data.enrollments.slice(0, 5).map(item => <View key={entityId(item)} style={{ gap: 5, paddingVertical: 10 }}><Text style={ui.heading}>{coachStudentName(item)}</Text><Text style={ui.body}>{referenceLabel(item.class)} · {item.status === 'CONFIRMED' ? 'Đã xác nhận' : 'Chờ thanh toán'}</Text></View>)}{!data.enrollments.length && <Text style={ui.body}>Chưa có đăng ký để hiển thị hoặc dữ liệu chưa tải được.</Text>}<Button secondary title="Xem tất cả học viên →" onPress={() => router.push('/coach-students')} /></View>}
    <View style={ui.card}><Text style={ui.heading}>{manager ? 'Hoạt động gần đây' : 'Kết quả mới của học viên'}</Text>{!data.activity.length && <Text style={ui.body}>Chưa có dữ liệu để hiển thị.</Text>}{data.activity.map(item => <View key={entityId(item)} style={{ paddingVertical: 12, gap: 5, borderTopWidth: 1, borderTopColor: colors.border }}><Text style={{ color: colors.ink, fontWeight: '600', lineHeight: 23 }}>{String(manager ? item.action : item.result)}</Text><Text style={ui.body}>{referenceLabel(manager ? item.userId : item.memberId)}</Text></View>)}</View></>}
  </ScrollView></SafeAreaView>;
}
