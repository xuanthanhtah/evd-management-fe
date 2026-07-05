import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Typography, Divider, Tag } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { EvdSearchBar } from '../components/EvdSearchBar';
import { EvdTable } from '../components/EvdTable';
import { EvdCreateModal } from '../components/EvdCreateModal';
import { EvdImportModal } from '../components/EvdImportModal';
import { useEvdUiStore } from '../store/useEvdUiStore';
import { useEvdPermissions } from '../hooks/useEvdPermissions';
import { useEvdList } from '../hooks/useEvdQueries';
import type { EvdListParams } from '../types/evd.types';

const { Title } = Typography;

// Mục đích: Đọc và đồng bộ tham số lọc với URL search params để hỗ trợ chia sẻ link và điều hướng browser
function useEvdParams(): [EvdListParams, (patch: Partial<EvdListParams>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const params: EvdListParams = {
    search: searchParams.get('search') ?? '',
    status: (searchParams.get('status') as EvdListParams['status']) ?? '',
    category: (searchParams.get('category') as EvdListParams['category']) ?? '',
    page: parseInt(searchParams.get('page') ?? '1', 10),
    pageSize: parseInt(searchParams.get('pageSize') ?? '20', 10),
  };

  const updateParams = useCallback(
    (patch: Partial<EvdListParams>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([key, value]) => {
          if (value === '' || value === undefined || value === null) {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        });
        return next;
      });
    },
    [setSearchParams],
  );

  return [params, updateParams];
}

export const EvdManagementPage = () => {
  const { t } = useTranslation('evd');
  const [params, updateParams] = useEvdParams();
  const { data } = useEvdList(params);
  const { canCreate, canImport } = useEvdPermissions();
  const { openCreateModal, openImportModal } = useEvdUiStore();

  const handlePageChange = useCallback(
    (page: number, pageSize: number) => {
      updateParams({ page, pageSize });
    },
    [updateParams],
  );

  return (
    <div className="flex flex-col min-h-full">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <Title level={4} className="!mb-0 !mt-0 !text-gray-800">
              {t('page.title')}
            </Title>
            <Tag color="blue" className="rounded-full border-blue-200 bg-blue-50 text-blue-700 px-3">
              {data?.count || 0} {t('table.pagination')}
            </Tag>
          </div>
          <p className="text-gray-500 text-sm">
            {t('page.subtitle')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {canImport && (
            <Button
              id="evd-import-btn"
              icon={<UploadOutlined />}
              onClick={openImportModal}
              className="border-indigo-200 text-indigo-700 hover:text-indigo-800 hover:border-indigo-300 hover:bg-indigo-50 font-medium"
            >
              {t('action.import')}
            </Button>
          )}
          {canCreate && (
            <Button
              id="evd-add-btn"
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 font-medium"
            >
              {t('action.add')}
            </Button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="mb-4">
        <EvdSearchBar params={params} onFilterChange={updateParams} />
      </div>

      <Divider className="!my-3" />

      {/* Table — wrapped in ErrorBoundary to isolate fetch failures */}
      <div className="flex-1 overflow-hidden">
        <ErrorBoundary>
          <EvdTable params={params} onPageChange={handlePageChange} />
        </ErrorBoundary>
      </div>

      {/* Modals */}
      <EvdCreateModal />
      <EvdImportModal queryParams={params} />
    </div>
  );
};
