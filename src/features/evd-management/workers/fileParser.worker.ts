import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { ImportRow, InvalidImportRow, ImportResult } from '../types/evd.types';

// Mục đích: Xác thực một dòng đã parse và trả về danh sách lỗi nếu có
function validateRow(row: ImportRow, rowIndex: number): string[] {
  const errors: string[] = [];

  if (!row.code || row.code.trim() === '') {
    errors.push(`Row ${rowIndex}: Code is required`);
  } else if (!/^[A-Z0-9-_]+$/i.test(row.code)) {
    errors.push(`Row ${rowIndex}: Code must be alphanumeric with - and _ only`);
  }

  if (!row.title || row.title.trim() === '') {
    errors.push(`Row ${rowIndex}: Title is required`);
  } else if (row.title.length > 255) {
    errors.push(`Row ${rowIndex}: Title must not exceed 255 characters`);
  }

  const validCategories = ['LEGAL', 'FINANCIAL', 'TECHNICAL', 'HR', 'OTHER'];
  if (!row.category || !validCategories.includes(row.category.toUpperCase())) {
    errors.push(
      `Row ${rowIndex}: Category must be one of: ${validCategories.join(', ')}`,
    );
  }

  const validStatuses = ['ACTIVE', 'INACTIVE', 'DRAFT'];
  if (!row.status || !validStatuses.includes(row.status.toUpperCase())) {
    errors.push(
      `Row ${rowIndex}: Status must be one of: ${validStatuses.join(', ')}`,
    );
  }

  return errors;
}

// Mục đích: Nhận file từ main thread, parse bằng PapaParse hoặc XLSX tùy định dạng và gửi kết quả về
self.addEventListener('message', async (event: MessageEvent<{ type: string; file: File }>) => {
  if (event.data.type !== 'parse') return;

  const file = event.data.file;
  const valid: ImportRow[] = [];
  const invalid: InvalidImportRow[] = [];
  let rowIndex = 0;
  let totalRows = 0;

  const processRow = (rawRow: any) => {
    rowIndex++;
    const normalizedRow: ImportRow = {
      code: (rawRow.code?.toString() ?? '').trim().toUpperCase(),
      title: (rawRow.title?.toString() ?? '').trim(),
      category: (rawRow.category?.toString() ?? '').trim().toUpperCase(),
      status: (rawRow.status?.toString() ?? '').trim().toUpperCase(),
    };

    const errors = validateRow(normalizedRow, rowIndex);
    if (errors.length === 0) {
      valid.push(normalizedRow);
    } else {
      invalid.push({ row: normalizedRow, rowIndex, errors });
    }
  };

  try {
    if (file.name.toLowerCase().endsWith('.csv')) {
      Papa.parse<any>(file, {
        header: true,
        skipEmptyLines: true,
        chunkSize: 1024 * 64, // 64KB chunks
        chunk(results) {
          totalRows += results.data.length;
          for (const row of results.data) {
            processRow(row);
          }
          const percent = Math.min(
            99,
            Math.round((rowIndex / Math.max(totalRows, 1)) * 100),
          );
          self.postMessage({ type: 'progress', percent, processed: rowIndex, total: totalRows });
        },
        complete() {
          const result: ImportResult = { valid, invalid, totalRows: rowIndex };
          self.postMessage({ type: 'done', result });
        },
        error(err: Error) {
          self.postMessage({ type: 'error', message: err.message });
        },
      });
    } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
      self.postMessage({ type: 'progress', percent: 10, processed: 0, total: 0 });
      const arrayBuffer = await file.arrayBuffer();

      self.postMessage({ type: 'progress', percent: 50, processed: 0, total: 0 });
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json<any>(worksheet);

      self.postMessage({ type: 'progress', percent: 80, processed: 0, total: 0 });
      totalRows = json.length;
      for (const row of json) {
        processRow(row);
      }

      const result: ImportResult = { valid, invalid, totalRows: rowIndex };
      self.postMessage({ type: 'done', result });
    } else {
      self.postMessage({ type: 'error', message: 'Unsupported file format. Please upload CSV or XLSX.' });
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error parsing file');
    self.postMessage({ type: 'error', message: err.message });
  }
});
