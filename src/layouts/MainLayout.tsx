import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/useAuthStore';
import { useLocation } from 'react-router-dom';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { useTranslation } from 'react-i18next';


const { Header, Sider, Content } = Layout;

export const MainLayout = () => {
  const { t } = useTranslation('common');
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Mục đích: Xác định menu item đang active dựa trên pathname hiện tại
  const selectedKey = location.pathname.split('/')[1] || 'evd-management';


  // Mục đích: Gọi Supabase signOut rồi mới redirect để tránh redirect race condition
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userMenu = {
    items: [
      {
        key: 'logout',
        label: t('menu.logout'),
        icon: <LogoutOutlined />,
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout className="h-screen overflow-hidden" hasSider>
      <Sider trigger={null} collapsible collapsed={collapsed} width={256} theme="dark" className="bg-gray-900 border-r border-gray-800 z-10 shadow-2xl !h-full">
        <div className="flex flex-col h-full">
          <div className={`h-16 flex items-center border-b border-gray-800 shrink-0 ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 min-w-[32px] rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50 shrink-0">
                <span className="text-white font-bold text-sm leading-none">EV</span>
              </div>
              {!collapsed && (
                <h1 className="text-lg font-bold text-gray-100 truncate tracking-tight">
                  Enterprise
                </h1>
              )}
            </div>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-lg !text-white hover:!text-white hover:!bg-gray-800 w-10 h-10 flex items-center justify-center shrink-0"
            />
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <Menu
              mode="inline"
              theme="dark"
              selectedKeys={[selectedKey]}
              className="bg-transparent border-r-0 px-2"
              items={[
                {
                  key: 'evd-management',
                  icon: <FileTextOutlined className="text-lg" />,
                  label: <span className="font-medium">{t('menu.documents')}</span>,
                  onClick: () => navigate('/evd-management'),
                  className: '!rounded-lg',
                },
              ]}
            />
          </div>
        </div>
      </Sider>
      <Layout className="h-full overflow-hidden">
        <Header className="bg-white p-0 flex justify-end items-center pr-6 border-b border-gray-200 z-0 h-16 leading-[4rem] shrink-0">
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block leading-tight">
              <div className="text-sm font-semibold text-gray-200">{user?.user_metadata?.display_name ?? user?.email}</div>
              <div className="text-xs text-gray-400 font-medium capitalize">{user?.role?.toLowerCase()}</div>
            </div>
            <Dropdown menu={userMenu} placement="bottomRight" arrow trigger={['click']}>
              <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center cursor-pointer font-bold transition-colors hover:bg-indigo-200">
                {user?.user_metadata?.display_name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </Dropdown>
            </div>
          </div>
        </Header>
        <Content className="flex-1 overflow-auto m-6 p-0 md:p-6 md:bg-white md:rounded-xl md:shadow-sm md:border md:border-gray-200">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
