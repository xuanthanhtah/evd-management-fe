import { useCallback, useState } from 'react';
import { Table, Button, Popconfirm, Input, Select, Tooltip, Skeleton, Empty, Typography } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { EvdStatusBadge } from './EvdStatusBadge';
import { useEvdList, useUpdateEvd, useDeleteEvd } from '../hooks/useEvdQueries';
import { useEvdPermissions } from '../hooks/useEvdPermissions';
import { useTranslation } from 'react-i18next';
import { useEvdUiStore } from '../store/useEvdUiStore';
import { EVD_STATUS_OPTIONS, EVD_CATEGORY_OPTIONS } from '../types/evd.types';
import type { EvdDocument, EvdListParams, UpdateEvdDto } from '../types/evd.types';

const { Text } = Typography;

interface EvdTableProps {
  params: EvdListParams;
  onPageChange: (page: number, pageSize: number) => void;
}

export const EvdTable = ({ params, onPageChange }: EvdTableProps) => {
  const { t } = useTranslation(['evd', 'common']);
  const { data, isLoading, isFetching } = useEvdList(params);
  const { canEdit, canDelete } = useEvdPermissions();

  const updateMutation = useUpdateEvd();
  const deleteMutation = useDeleteEvd();

  const { editingRowId, setEditingRowId, dirtyRows, setDirtyRow, clearDirtyRow } =
    useEvdUiStore();

  // Mục đích: Lưu lỗi validation cục bộ cho từng cell đang chỉnh sửa
  const [cellErrors, setCellErrors] = useState<Record<string, string>>({});

  const handleEditStart = useCallback(
    (record: EvdDocument) => {
      setEditingRowId(record.id);
      // Seed dirty row with current values so partial saves work
      setDirtyRow(record.id, {
        code: record.code,
        title: record.title,
        category: record.category,
        status: record.status,
      });
    },
    [setEditingRowId, setDirtyRow],
  );

  const handleEditCancel = useCallback(
    (id: string) => {
      setEditingRowId(null);
      clearDirtyRow(id);
      setCellErrors({});
    },
    [setEditingRowId, clearDirtyRow],
  );

  // Mục đích: Validate và gọi mutation cập nhật khi người dùng lưu dòng đang chỉnh sửa
  const handleEditSave = useCallback(
    async (record: EvdDocument) => {
      const dirty = dirtyRows[record.id] ?? {};
      const errors: Record<string, string> = {};

      if (!dirty.code?.trim()) errors[`${record.id}-code`] = 'Code is required';
      if (!dirty.title?.trim()) errors[`${record.id}-title`] = 'Title is required';

      if (Object.keys(errors).length > 0) {
        setCellErrors(errors);
        return;
      }

      setCellErrors({});
      await updateMutation.mutateAsync({ id: record.id, dto: dirty as UpdateEvdDto, queryParams: params });
      setEditingRowId(null);
      clearDirtyRow(record.id);
    },
    [dirtyRows, params, updateMutation, setEditingRowId, clearDirtyRow],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate({ id, queryParams: params });
    },
    [params, deleteMutation],
  );

  const handlePaginationChange = useCallback(
    (pagination: TablePaginationConfig) => {
      onPageChange(pagination.current ?? 1, pagination.pageSize ?? 20);
    },
    [onPageChange],
  );

  const columns: ColumnsType<EvdDocument> = [
    {
      title: t('evd:table.column.code'),
      dataIndex: 'code',
      key: 'code',
      width: 130,
      fixed: 'left',
      render: (val: string, record) => {
        const isEditing = editingRowId === record.id;
        if (!isEditing) {
          return (
            <Text
              strong
              className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded"
            >
              {val}
            </Text>
          );
        }
        return (
          <div>
            <Input
              id={`edit-code-${record.id}`}
              size="small"
              value={dirtyRows[record.id]?.code ?? val}
              status={cellErrors[`${record.id}-code`] ? 'error' : undefined}
              onChange={(e) => setDirtyRow(record.id, { code: e.target.value })}
              className="font-mono text-xs"
              maxLength={20}
            />
            {cellErrors[`${record.id}-code`] && (
              <div className="text-red-500 text-xs mt-0.5">
                {cellErrors[`${record.id}-code`]}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: t('evd:table.column.title'),
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (val: string, record) => {
        const isEditing = editingRowId === record.id;
        if (!isEditing) {
          return (
            <Tooltip title={val}>
              <span className="text-gray-800">{val}</span>
            </Tooltip>
          );
        }
        return (
          <div>
            <Input
              id={`edit-title-${record.id}`}
              size="small"
              value={dirtyRows[record.id]?.title ?? val}
              status={cellErrors[`${record.id}-title`] ? 'error' : undefined}
              onChange={(e) => setDirtyRow(record.id, { title: e.target.value })}
              maxLength={255}
            />
            {cellErrors[`${record.id}-title`] && (
              <div className="text-red-500 text-xs mt-0.5">
                {cellErrors[`${record.id}-title`]}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: t('evd:table.column.category'),
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (val: string, record) => {
        const isEditing = editingRowId === record.id;
        if (!isEditing) {
          return <span className="text-gray-600 text-sm">{val}</span>;
        }
        return (
          <Select
            id={`edit-category-${record.id}`}
            size="small"
            value={dirtyRows[record.id]?.category ?? val}
            onChange={(v) => setDirtyRow(record.id, { category: v as EvdDocument['category'] })}
            options={EVD_CATEGORY_OPTIONS}
            className="w-full"
          />
        );
      },
    },
    {
      title: t('evd:table.column.status'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (val: string, record) => {
        const isEditing = editingRowId === record.id;
        if (!isEditing) {
          return <EvdStatusBadge status={record.status} />;
        }
        return (
          <Select
            id={`edit-status-${record.id}`}
            size="small"
            value={dirtyRows[record.id]?.status ?? val}
            onChange={(v) => setDirtyRow(record.id, { status: v as EvdDocument['status'] })}
            options={EVD_STATUS_OPTIONS}
            className="w-full"
          />
        );
      },
    },
    {
      title: t('evd:table.column.created_by'),
      dataIndex: 'created_by_name',
      key: 'created_by_name',
      width: 130,
      render: (val: string) => (
        <span className="text-gray-500 text-sm">{val ?? '—'}</span>
      ),
    },
    {
      title: t('evd:table.column.created_at'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (val: string) => (
        <span className="text-gray-500 text-sm tabular-nums">
          {new Date(val).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      title: t('evd:table.column.actions'),
      key: 'actions',
      width: 110,
      fixed: 'right',
      render: (_: unknown, record: EvdDocument) => {
        const isEditing = editingRowId === record.id;
        const isSaving = updateMutation.isPending && updateMutation.variables?.id === record.id;

        if (isEditing) {
          return (
            <div className="flex items-center gap-1">
              <Tooltip title={t('evd:tooltip.save')}>
                <Button
                  id={`save-row-${record.id}`}
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  loading={isSaving}
                  onClick={() => handleEditSave(record)}
                />
              </Tooltip>
              <Tooltip title={t('evd:tooltip.cancel')}>
                <Button
                  id={`cancel-row-${record.id}`}
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => handleEditCancel(record.id)}
                />
              </Tooltip>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-1">
            {canEdit && (
              <Tooltip title={t('evd:tooltip.edit')}>
                <Button
                  id={`edit-row-${record.id}`}
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEditStart(record)}
                  className="text-blue-500 hover:text-blue-700"
                />
              </Tooltip>
            )}

            {canDelete && (
              <Popconfirm
                title={t('evd:popconfirm.delete_title')}
                description={t('evd:popconfirm.delete_desc')}
                onConfirm={() => handleDelete(record.id)}
                okText={t('common:action.delete')}
                cancelText={t('common:action.cancel')}
                okButtonProps={{ danger: true }}
                placement="topRight"
              >
                <Tooltip title={t('evd:tooltip.delete')}>
                  <Button
                    id={`delete-row-${record.id}`}
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    className="text-red-400 hover:text-red-600"
                    loading={
                      deleteMutation.isPending &&
                      deleteMutation.variables?.id === record.id
                    }
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} active paragraph={{ rows: 1, width: '100%' }} title={false} />
        ))}
      </div>
    );
  }

  return (
    <Table<EvdDocument>
      id="evd-documents-table"
      rowKey="id"
      columns={columns}
      dataSource={data?.data ?? []}
      loading={isFetching && !isLoading}
      scroll={{ x: 900 }}
      // Mục đích: Cho phép double-click vào dòng để vào chế độ chỉnh sửa inline
      onRow={(record) => ({
        onDoubleClick: () => {
          if (canEdit && editingRowId !== record.id) {
            handleEditStart(record);
          }
        },
        className:
          editingRowId === record.id
            ? 'bg-blue-50 ring-1 ring-inset ring-blue-200'
            : 'hover:bg-gray-50 transition-colors cursor-default',
      })}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-gray-400 text-sm">
                {t('evd:table.empty')}
              </span>
            }
          />
        ),
      }}
      pagination={{
        current: params.page,
        pageSize: params.pageSize,
        total: data?.count ?? 0,
        showSizeChanger: true,
        showTotal: (total, range) =>
          `${range[0]}–${range[1]} / ${total} ${t('evd:table.pagination')}`,
        pageSizeOptions: ['5', '10', '20', '50', '100'],
        className: 'px-4',
      }}
      onChange={handlePaginationChange}
      size="middle"
      className="rounded-lg overflow-hidden"
    />
  );
};
