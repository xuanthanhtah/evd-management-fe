import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { MainLayout } from '@/layouts/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { EvdManagementPage } from '@/features/evd-management/pages/EvdManagementPage';


export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      {
        path: '',
        element: <LoginPage />,
      },
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute />, // Wrap MainLayout with ProtectedRoute
    children: [
      {
        path: '',
        element: <MainLayout />,
        children: [
          {
            path: '/',
            element: <Navigate to="/evd-management" replace />,
          },
          {
            path: 'evd-management',
            element: <EvdManagementPage />,
          },

        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/evd-management" replace />, // Catch all
  },
]);
