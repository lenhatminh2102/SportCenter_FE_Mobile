import { Redirect } from 'expo-router';
import { useAuth } from '@/context/auth';
import { roleHome } from '@/utils/staff-navigation';
export default function DashboardEntry() {
  const { user } = useAuth();
  return <Redirect href={user ? roleHome(user.role) : '/login'} />;
}
