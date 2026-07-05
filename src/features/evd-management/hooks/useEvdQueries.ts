import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import {
  fetchEvdList,
  createEvdDocument,
  updateEvdDocument,
  deleteEvdDocument,
} from '../services/evd.services';
import { useEvdPermissions } from './useEvdPermissions';
import type {
  EvdListParams,
  EvdListResponse,
  EvdDocument,
  CreateEvdDto,
  UpdateEvdDto,
} from '../types/evd.types';

// ─── Query Key Factory ────────────────────────────────────────────────────────

export const evdKeys = {
  all: ['evd'] as const,
  lists: () => [...evdKeys.all, 'list'] as const,
  list: (params: EvdListParams) => [...evdKeys.lists(), params] as const,
};

// ─── List Query ───────────────────────────────────────────────────────────────

export function useEvdList(params: EvdListParams) {
  const { isStaff, currentUserId } = useEvdPermissions();

  return useQuery<EvdListResponse>({
    queryKey: evdKeys.list(params),
    queryFn: () => fetchEvdList(params, currentUserId ?? undefined, isStaff),
    placeholderData: (prev) => prev,
  });
}

// ─── Create Mutation ──────────────────────────────────────────────────────────

export function useCreateEvd() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation('evd');

  return useMutation<EvdDocument, Error, CreateEvdDto>({
    mutationFn: createEvdDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evdKeys.lists() });
      message.success(t('messages.create_success'));
    },
    onError: (err) => {
      console.error(err);
      message.error(t('messages.create_failed'));
    },
  });
}

// ─── Update Mutation (with Optimistic Update) ─────────────────────────────────

interface UpdateEvdVariables {
  id: string;
  dto: UpdateEvdDto;
  queryParams: EvdListParams;
}

// Mục đích: Cập nhật lạc quan (optimistic update) để UI phản hồi ngay lập tức trước khi nhận kết quả từ server
export function useUpdateEvd() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation('evd');

  return useMutation<EvdDocument, Error, UpdateEvdVariables, { previousData: EvdListResponse | undefined }>({
    mutationFn: ({ id, dto }) => updateEvdDocument(id, dto),

    onMutate: async ({ id, dto, queryParams }) => {
      const queryKey = evdKeys.list(queryParams);

      // Hủy các query đang chạy để tránh ghi đè dữ liệu optimistic
      await queryClient.cancelQueries({ queryKey });

      // Lưu snapshot hiện tại để rollback nếu có lỗi
      const previousData = queryClient.getQueryData<EvdListResponse>(queryKey);

      // Cập nhật cache ngay lập tức với dữ liệu mới
      queryClient.setQueryData<EvdListResponse>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((doc) =>
            doc.id === id ? { ...doc, ...dto, updated_at: new Date().toISOString() } : doc,
          ),
        };
      });

      return { previousData };
    },

    onError: (err, { queryParams }, context) => {
      // Rollback về dữ liệu cũ khi request thất bại
      if (context?.previousData) {
        queryClient.setQueryData(evdKeys.list(queryParams), context.previousData);
      }
      console.error(err);
      message.error(t('messages.update_failed'));
    },

    onSettled: (_data, _err, { queryParams }) => {
      queryClient.invalidateQueries({ queryKey: evdKeys.list(queryParams) });
    },

    onSuccess: () => {
      message.success(t('messages.update_success'));
    },
  });
}

// ─── Delete Mutation (with Optimistic Remove) ─────────────────────────────────

interface DeleteEvdVariables {
  id: string;
  queryParams: EvdListParams;
}

// Mục đích: Xóa lạc quan (optimistic delete) để xóa dòng khỏi UI ngay lập tức
export function useDeleteEvd() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation('evd');

  return useMutation<void, Error, DeleteEvdVariables, { previousData: EvdListResponse | undefined }>({
    mutationFn: ({ id }) => deleteEvdDocument(id),

    onMutate: async ({ id, queryParams }) => {
      const queryKey = evdKeys.list(queryParams);
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<EvdListResponse>(queryKey);

      queryClient.setQueryData<EvdListResponse>(queryKey, (old) => {
        if (!old) return old;
        return {
          count: Math.max(0, old.count - 1),
          data: old.data.filter((doc) => doc.id !== id),
        };
      });

      return { previousData };
    },

    onError: (err, { queryParams }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(evdKeys.list(queryParams), context.previousData);
      }
      console.error(err);
      message.error(t('messages.delete_failed'));
    },

    onSettled: (_data, _err, { queryParams }) => {
      queryClient.invalidateQueries({ queryKey: evdKeys.list(queryParams) });
    },

    onSuccess: () => {
      message.success(t('messages.delete_success'));
    },
  });
}
