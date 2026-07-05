import { useEffect } from 'react';
import { Modal, Form, Input, Select, Button, App } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/useAuthStore';
import { useEvdUiStore } from '../store/useEvdUiStore';
import { useCreateEvd } from '../hooks/useEvdQueries';
import { createEvdSchema, EVD_STATUS_OPTIONS, EVD_CATEGORY_OPTIONS } from '../types/evd.types';
import type { CreateEvdFormValues } from '../types/evd.types';

export const EvdCreateModal = () => {
  const { t } = useTranslation('evd');
  const { isCreateModalOpen, closeCreateModal } = useEvdUiStore();
  const user = useAuthStore((state) => state.user);
  const { message } = App.useApp();
  const createMutation = useCreateEvd();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateEvdFormValues>({
    resolver: zodResolver(createEvdSchema),
    defaultValues: {
      code: '',
      title: '',
      category: undefined,
      status: 'DRAFT',
    },
  });

  // Mục đích: Reset form mỗi khi modal mở để tránh dữ liệu cũ bị giữ lại
  useEffect(() => {
    if (isCreateModalOpen) reset();
  }, [isCreateModalOpen, reset]);

  const onSubmit = async (values: CreateEvdFormValues) => {
    if (!user?.id) {
      message.error(t('create.session_expired'));
      return;
    }

    const payload = {
      ...values,
      created_by: user.id,
    };

    await createMutation.mutateAsync(payload);
    closeCreateModal();
    reset();
  };

  const handleCancel = () => {
    closeCreateModal();
    reset();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-blue-600 rounded-full" />
          <span className="font-semibold text-gray-800">{t('create.title')}</span>
        </div>
      }
      open={isCreateModalOpen}
      onCancel={handleCancel}
      footer={null}
      width={520}
      destroyOnClose
    >
      <Form
        layout="vertical"
        onFinish={handleSubmit(onSubmit)}
        className="mt-4 space-y-1"
      >
        {/* Code Field */}
        <Form.Item
          label={<span className="font-medium text-gray-700">{t('create.code')}</span>}
          validateStatus={errors.code ? 'error' : ''}
          help={errors.code?.message ? t(errors.code.message) : undefined}
          required
        >
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="create-evd-code"
                placeholder={t('create.code_placeholder')}
                maxLength={20}
                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                className="font-mono"
              />
            )}
          />
        </Form.Item>

        {/* Title Field */}
        <Form.Item
          label={<span className="font-medium text-gray-700">{t('create.title_label')}</span>}
          validateStatus={errors.title ? 'error' : ''}
          help={errors.title?.message ? t(errors.title.message) : undefined}
          required
        >
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="create-evd-title"
                placeholder={t('create.title_placeholder')}
                maxLength={255}
                showCount
              />
            )}
          />
        </Form.Item>

        {/* Category Field */}
        <Form.Item
          label={<span className="font-medium text-gray-700">{t('create.category')}</span>}
          validateStatus={errors.category ? 'error' : ''}
          help={errors.category?.message ? t(errors.category.message) : undefined}
          required
        >
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                id="create-evd-category"
                placeholder={t('create.category_placeholder')}
                options={EVD_CATEGORY_OPTIONS}
                className="w-full"
              />
            )}
          />
        </Form.Item>

        {/* Status Field */}
        <Form.Item
          label={<span className="font-medium text-gray-700">{t('create.status')}</span>}
          validateStatus={errors.status ? 'error' : ''}
          help={errors.status?.message ? t(errors.status.message) : undefined}
          required
        >
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                id="create-evd-status"
                options={EVD_STATUS_OPTIONS}
                className="w-full"
              />
            )}
          />
        </Form.Item>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button id="create-evd-cancel" onClick={handleCancel}>
            {t('create.btn_cancel')}
          </Button>
          <Button
            id="create-evd-submit"
            type="primary"
            htmlType="submit"
            loading={isSubmitting || createMutation.isPending}
          >
            {t('create.btn_submit')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
