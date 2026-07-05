import { useCallback, useState, useEffect } from 'react';
import { Input, Select, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { SearchOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons';
import { useDebounce } from '@/hooks/useDebounce';
import { EVD_STATUS_OPTIONS, EVD_CATEGORY_OPTIONS } from '../types/evd.types';
import type { EvdListParams, EvdStatus, EvdCategory } from '../types/evd.types';

interface EvdSearchBarProps {
  params: EvdListParams;
  onFilterChange: (patch: Partial<EvdListParams>) => void;
}

export const EvdSearchBar = ({ params, onFilterChange }: EvdSearchBarProps) => {
  const { t } = useTranslation(['evd', 'common']);
  // Mục đích: Quản lý local state cho input và dùng hook useDebounce theo yêu cầu
  const [searchValue, setSearchValue] = useState(params.search || '');
  const debouncedSearch = useDebounce(searchValue, 500);

  // Sync state with URL params when cleared externally
  useEffect(() => {
    setSearchValue(params.search || '');
  }, [params.search]);

  // Trigger filter change when debounced value updates
  useEffect(() => {
    if (debouncedSearch !== (params.search || '')) {
      onFilterChange({ search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, params.search, onFilterChange]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchValue(e.target.value);
    },
    [],
  );

  const handleStatusChange = useCallback(
    (value: EvdStatus | '') => {
      onFilterChange({ status: value, page: 1 });
    },
    [onFilterChange],
  );

  const handleCategoryChange = useCallback(
    (value: EvdCategory | '') => {
      onFilterChange({ category: value, page: 1 });
    },
    [onFilterChange],
  );

  const handleClearFilters = useCallback(() => {
    onFilterChange({ search: '', status: '', category: '', page: 1 });
  }, [onFilterChange]);

  const hasActiveFilters = !!(params.search || params.status || params.category);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      <Input
        id="evd-search-input"
        placeholder={t('evd:filter.search_placeholder')}
        prefix={<SearchOutlined className="text-gray-400" />}
        value={searchValue}
        onChange={handleSearchChange}
        allowClear
        className="w-full sm:w-72"
        size="middle"
      />

      <div className="flex gap-2 flex-wrap">
        <Select
          id="evd-status-filter"
          placeholder={
            <span className="flex items-center gap-1">
              <FilterOutlined />
              {t('evd:filter.status')}
            </span>
          }
          value={params.status || undefined}
          onChange={handleStatusChange}
          allowClear
          onClear={() => handleStatusChange('')}
          className="w-36"
          options={EVD_STATUS_OPTIONS}
        />

        <Select
          id="evd-category-filter"
          placeholder={
            <span className="flex items-center gap-1">
              <FilterOutlined />
              {t('evd:filter.category')}
            </span>
          }
          value={params.category || undefined}
          onChange={handleCategoryChange}
          allowClear
          onClear={() => handleCategoryChange('')}
          className="w-40"
          options={EVD_CATEGORY_OPTIONS}
        />

        {hasActiveFilters && (
          <Button
            icon={<ClearOutlined />}
            onClick={handleClearFilters}
            size="middle"
            className="text-gray-500"
          >
            {t('common:action.clear')}
          </Button>
        )}
      </div>
    </div>
  );
};
