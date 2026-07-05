import type { ThemeConfig } from 'antd';

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#4338CA', // Deep Indigo
    borderRadius: 8,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    colorInfo: '#4338CA',
    colorBgLayout: '#F9FAFB', // Off-white background
  },
  components: {
    Button: {
      colorPrimary: '#4338CA',
      algorithm: true, // Enable algorithm
    },
    Table: {
      headerBg: '#F3F4F6', // Slightly darker gray for headers
      headerColor: '#4B5563',
      headerBorderRadius: 8,
    },
    Menu: {
      itemSelectedBg: '#EEF2FF', // Indigo 50
      itemSelectedColor: '#4338CA',
      itemHoverBg: '#F3F4F6',
      itemBorderRadius: 8,
    },
  },
};
