import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import enUS from 'antd/locale/en_US';
import viVN from 'antd/locale/vi_VN';
import './i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App as AntdApp } from 'antd';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { themeConfig } from './config/theme';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useAuthStore } from './store/useAuthStore';

// Mục đích: Khởi tạo Supabase session một lần ở root và cleanup subscription khi unmount
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    const unsubscribe = initAuth();
    return unsubscribe;
  }, [initAuth]);

  return <>{children}</>;
}

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const { i18n } = useTranslation();

  const antdLocale = useMemo(() => {
    return i18n.language === 'vi' ? viVN : enUS;
  }, [i18n.language]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={themeConfig} locale={antdLocale}>
          {/* AntdApp provides message, modal, notification hooks globally */}
          <AntdApp>
            <AuthInitializer>
              <RouterProvider router={router} />
            </AuthInitializer>
          </AntdApp>
        </ConfigProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
