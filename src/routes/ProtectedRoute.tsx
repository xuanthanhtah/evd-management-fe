import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from '@/store/useAuthStore';

// Mục đích: Ngăn redirect về /login khi session đang được restore từ Supabase
// Hiện spinner trong thời gian chờ để tránh flash of unauthenticated content (FOUC)
export const ProtectedRoute = () => {
  const { isAuthenticated, isInitializing } = useAuthStore();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
