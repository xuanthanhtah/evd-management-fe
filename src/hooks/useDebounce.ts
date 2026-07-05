import { useState, useEffect } from 'react';

/**
 * Mục đích: Hook debounce giá trị để hạn chế số lần re-render hoặc gọi API liên tục.
 * Trả về giá trị đã được debounce sau khoảng thời gian delay.
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
