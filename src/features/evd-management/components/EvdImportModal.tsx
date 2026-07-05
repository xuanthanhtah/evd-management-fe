import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Modal,
  Upload,
  Button,
  Progress,
  Alert,
  Table,
  Tabs,
  App,
  Typography,
  Tag,
} from 'antd';
import {
  InboxOutlined,
  CloudUploadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useEvdUiStore } from '../store/useEvdUiStore';
import { batchInsertEvd } from '../services/evd.services';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/useAuthStore';
import { evdKeys } from '../hooks/useEvdQueries';
import type { ImportResult, InvalidImportRow, ImportRow } from '../types/evd.types';
import type { WorkerOutboundMessage } from '../types/evd.types';
import type { EvdListParams } from '../types/evd.types';

const { Dragger } = Upload;
const { Text } = Typography;

type Step = 'upload' | 'preview' | 'inserting' | 'done';

interface EvdImportModalProps {
  queryParams: EvdListParams;
}

export const EvdImportModal = ({ queryParams }: EvdImportModalProps) => {
  const { isImportModalOpen, closeImportModal } = useEvdUiStore();
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation(['evd', 'common']);
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>('upload');
  const [parseProgress, setParseProgress] = useState(0);
  const [insertProgress, setInsertProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  // Mục đích: Tạo và quản lý vòng đời Web Worker để tránh leak bộ nhớ
  const createWorker = useCallback(() => {
    if (workerRef.current) workerRef.current.terminate();
    const worker = new Worker(
      new URL('../workers/fileParser.worker.ts', import.meta.url),
      { type: 'module' },
    );
    workerRef.current = worker;
    return worker;
  }, []);

  // Dọn dẹp worker khi modal đóng
  useEffect(() => {
    if (!isImportModalOpen) {
      workerRef.current?.terminate();
      workerRef.current = null;
    }
  }, [isImportModalOpen]);

  const handleClose = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    closeImportModal();
    setStep('upload');
    setParseProgress(0);
    setInsertProgress(0);
    setImportResult(null);
    setErrorMessage(null);
  }, [closeImportModal]);

  const handleFileUpload = useCallback(
    (file: File) => {
      setStep('preview');
      setParseProgress(0);
      setErrorMessage(null);

      const worker = createWorker();

      worker.onmessage = (e: MessageEvent<WorkerOutboundMessage>) => {
        const msg = e.data;
        if (msg.type === 'progress') {
          setParseProgress(msg.percent);
        } else if (msg.type === 'done') {
          setParseProgress(100);
          setImportResult(msg.result);
        } else if (msg.type === 'error') {
          setErrorMessage(msg.message);
          setStep('upload');
        }
      };

      worker.postMessage({ type: 'parse', file });
      return false; // Prevent antd from auto-uploading
    },
    [createWorker],
  );

  // Mục đích: Chèn dữ liệu hợp lệ theo batch và cập nhật tiến trình realtime
  const handleConfirmInsert = useCallback(async () => {
    if (!importResult?.valid.length) return;

    if (!user?.id) {
      message.error(t('evd:import.session_expired'));
      return;
    }

    setStep('inserting');
    setInsertProgress(0);

    const dataToInsert = importResult.valid.map(row => ({
      code: row.code,
      title: row.title,
      category: row.category,
      status: row.status,
      created_by: user.id,
    }));

    try {
      await batchInsertEvd(dataToInsert, (inserted, total) => {
        setInsertProgress(Math.round((inserted / total) * 100));
      });

      setStep('done');
      queryClient.invalidateQueries({ queryKey: evdKeys.lists() });
      message.success(
        t('evd:import.import_success_toast', { count: importResult.valid.length }),
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : t('evd:import.import_failed');
      setErrorMessage(errMsg);
      setStep('preview');
      message.error(errMsg);
    }
  }, [importResult, queryClient, message, user?.id]);

  // ─── Virtualized Preview Table ──────────────────────────────────────────────

  const validRows = importResult?.valid ?? [];

  const rowVirtualizer = useVirtualizer({
    count: validRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // ─── Error Columns ───────────────────────────────────────────────────────────

  const errorColumns = [
    { title: 'Row', dataIndex: 'rowIndex', width: 70, key: 'rowIndex' },
    {
      title: t('evd:table.column.code'),
      dataIndex: ['row', 'code'],
      key: 'code',
      width: 110,
      render: (v: string) => <Text code>{v || '—'}</Text>,
    },
    {
      title: t('evd:table.column.title'),
      dataIndex: ['row', 'title'],
      key: 'title',
      ellipsis: true,
      render: (v: string) => v || '—',
    },
    {
      title: 'Errors',
      dataIndex: 'errors',
      key: 'errors',
      render: (errs: string[]) => (
        <div className="flex flex-col gap-1">
          {errs.map((e, i) => (
            <Tag key={i} color="error" className="text-xs whitespace-normal">
              {e}
            </Tag>
          ))}
        </div>
      ),
    },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────

  const renderUploadStep = () => (
    <div className="py-4">
      {errorMessage && (
        <Alert
          message={errorMessage}
          type="error"
          showIcon
          className="mb-4"
          closable
          onClose={() => setErrorMessage(null)}
        />
      )}
      <Dragger
        id="evd-import-dragger"
        accept=".csv,.xlsx,.xls"
        multiple={false}
        showUploadList={false}
        beforeUpload={handleFileUpload}
      >
        <p className="text-5xl text-blue-400 mb-3">
          <InboxOutlined />
        </p>
        <p className="text-base font-medium text-gray-700">
          {t('evd:import.drag_drop')}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          {t('evd:import.required_columns')} <Text code>code</Text>, <Text code>title</Text>,{' '}
          <Text code>category</Text>, <Text code>status</Text>
        </p>
      </Dragger>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs font-medium text-blue-800 mb-1">
          {t('evd:import.format_example')}
        </p>
        <pre className="text-xs text-blue-700 font-mono bg-white p-2 rounded border border-blue-100">
          {`code,title,category,status\nDOC-001,Contract Agreement,LEGAL,ACTIVE\nDOC-002,Q4 Budget,FINANCIAL,DRAFT`}
        </pre>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div>
      {parseProgress < 100 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <Text className="text-sm font-medium text-gray-600">
              {t('evd:import.parsing')}
            </Text>
            <Text className="text-sm tabular-nums">{parseProgress}%</Text>
          </div>
          <Progress
            percent={parseProgress}
            status="active"
            strokeColor={{ from: '#1890ff', to: '#52c41a' }}
          />
        </div>
      )}

      {importResult && (
        <>
          <div className="flex gap-3 mb-4">
            <div className="flex-1 p-3 bg-green-50 rounded-lg border border-green-100 text-center">
              <CheckCircleOutlined className="text-green-500 text-xl mb-1" />
              <div className="text-2xl font-bold text-green-700">
                {importResult.valid.length.toLocaleString()}
              </div>
              <div className="text-xs text-green-600">{t('evd:import.valid_rows')}</div>
            </div>
            <div className="flex-1 p-3 bg-red-50 rounded-lg border border-red-100 text-center">
              <WarningOutlined className="text-red-400 text-xl mb-1" />
              <div className="text-2xl font-bold text-red-600">
                {importResult.invalid.length.toLocaleString()}
              </div>
              <div className="text-xs text-red-500">{t('evd:import.invalid_rows')}</div>
            </div>
            <div className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-100 text-center">
              <div className="text-2xl font-bold text-gray-700">
                {importResult.totalRows.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">{t('evd:import.total_rows')}</div>
            </div>
          </div>

          <Tabs
            defaultActiveKey="valid"
            items={[
              {
                key: 'valid',
                label: (
                  <span>
                    {t('evd:import.valid_rows')}{' '}
                    <Tag color="success">{importResult.valid.length.toLocaleString()}</Tag>
                  </span>
                ),
                children: (
                  <div>
                    {/* Mục đích: Dùng virtualization để preview hàng trăm ngàn dòng mà không đóng băng trình duyệt */}
                    <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-gray-50 rounded-t-lg border border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <span>{t('evd:table.column.code')}</span>
                      <span className="col-span-2">{t('evd:table.column.title')}</span>
                      <span>{t('evd:table.column.status')}</span>
                    </div>
                    <div
                      ref={parentRef}
                      className="overflow-auto border border-t-0 border-gray-200 rounded-b-lg"
                      style={{ height: validRows.length > 0 ? 280 : 80 }}
                    >
                      <div
                        style={{
                          height: rowVirtualizer.getTotalSize(),
                          width: '100%',
                          position: 'relative',
                        }}
                      >
                        {virtualItems.map((virtualRow) => {
                          const row = validRows[virtualRow.index] as ImportRow;
                          return (
                            <div
                              key={virtualRow.key}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: virtualRow.size,
                                transform: `translateY(${virtualRow.start}px)`,
                              }}
                              className={`grid grid-cols-4 gap-2 px-3 items-center text-sm border-b border-gray-100 ${virtualRow.index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                }`}
                            >
                              <span className="font-mono text-xs text-blue-700 truncate">
                                {row.code}
                              </span>
                              <span className="col-span-2 truncate text-gray-700">
                                {row.title}
                              </span>
                              <EvdStatusTag status={row.status} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'invalid',
                label: (
                  <span>
                    {t('evd:import.invalid_rows')}{' '}
                    {importResult.invalid.length > 0 && (
                      <Tag color="error">{importResult.invalid.length.toLocaleString()}</Tag>
                    )}
                  </span>
                ),
                children: (
                  <Table<InvalidImportRow>
                    dataSource={importResult.invalid}
                    columns={errorColumns}
                    rowKey="rowIndex"
                    size="small"
                    scroll={{ y: 260 }}
                    pagination={false}
                    locale={{ emptyText: t('evd:import.no_errors') }}
                  />
                ),
              },
            ]}
          />
        </>
      )}
    </div>
  );

  const renderInsertingStep = () => (
    <div className="py-8 text-center">
      <CloudUploadOutlined className="text-5xl text-blue-400 mb-4" />
      <p className="text-base font-medium text-gray-700 mb-2">
        {t('evd:import.uploading')}
      </p>
      <p className="text-sm text-gray-400 mb-6">
        {t('evd:import.batching')}
      </p>
      <Progress
        percent={insertProgress}
        status={insertProgress < 100 ? 'active' : 'success'}
        strokeColor={{ from: '#1890ff', to: '#52c41a' }}
      />
      <p className="text-xs text-gray-400 mt-2 tabular-nums">
        {Math.round(((importResult?.valid.length ?? 0) * insertProgress) / 100).toLocaleString()}{' '}
        / {importResult?.valid.length.toLocaleString()} {t('evd:import.rows')}
      </p>
    </div>
  );

  const renderDoneStep = () => (
    <div className="py-8 text-center">
      <CheckCircleOutlined className="text-5xl text-green-500 mb-4" />
      <p className="text-xl font-semibold text-gray-800 mb-2">{t('evd:import.import_complete')}</p>
      <p className="text-sm text-gray-500">
        {importResult?.valid.length.toLocaleString()} {t('evd:import.success_msg')}
      </p>
    </div>
  );

  const stepContent: Record<Step, React.ReactNode> = {
    upload: renderUploadStep(),
    preview: renderPreviewStep(),
    inserting: renderInsertingStep(),
    done: renderDoneStep(),
  };

  const footerButtons = (
    <div className="flex justify-between items-center">
      <Button onClick={handleClose} disabled={step === 'inserting'}>
        {step === 'done' ? t('evd:import.btn_close') : t('evd:import.btn_cancel')}
      </Button>
      {step === 'preview' && importResult && importResult.valid.length > 0 && (
        <Button
          id="evd-import-confirm"
          type="primary"
          icon={<CloudUploadOutlined />}
          onClick={handleConfirmInsert}
          disabled={parseProgress < 100}
        >
          {t('evd:import.btn_import_valid', { count: importResult.valid.length.toLocaleString() })}
        </Button>
      )}
      {step === 'done' && (
        <Button type="primary" onClick={handleClose}>
          {t('evd:import.btn_done')}
        </Button>
      )}
    </div>
  );

  const STEP_TITLES: Record<Step, string> = {
    upload: t('evd:import.title_upload'),
    preview: t('evd:import.title_preview'),
    inserting: t('evd:import.title_inserting'),
    done: t('evd:import.title_done'),
  };

  // Needed inline here due to closure over importResult
  void queryParams;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-blue-600 rounded-full" />
          <span className="font-semibold text-gray-800">{STEP_TITLES[step]}</span>
        </div>
      }
      open={isImportModalOpen}
      onCancel={handleClose}
      footer={footerButtons}
      width={680}
      destroyOnClose
      closable={step !== 'inserting'}
      maskClosable={step !== 'inserting'}
    >
      {stepContent[step]}
    </Modal>
  );
};

// Mục đích: Badge nhỏ hiển thị status trong virtualized preview row
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'text-green-700 bg-green-50',
  INACTIVE: 'text-gray-600 bg-gray-100',
  DRAFT: 'text-yellow-700 bg-yellow-50',
};

const EvdStatusTag = ({ status }: { status: string }) => {
  const cls = STATUS_COLORS[status] ?? 'text-gray-600 bg-gray-100';
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {status}
    </span>
  );
};
