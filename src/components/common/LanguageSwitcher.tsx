import { Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { GlobalOutlined } from '@ant-design/icons';

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation('common');

  const handleChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  return (
    <div className="flex items-center gap-2">
      <GlobalOutlined style={{ color: 'white' }} />
      <Select
        id="language-switcher"
        value={i18n.language}
        onChange={handleChange}
        options={[
          { value: 'vi', label: t('language.vi') },
          { value: 'en', label: t('language.en') },
        ]}
        size="middle"
        variant="borderless"
        className="w-28 font-medium text-white"
        popupMatchSelectWidth={false}
        style={{
          color: "white"
        }}
      />
    </div>
  );
};
