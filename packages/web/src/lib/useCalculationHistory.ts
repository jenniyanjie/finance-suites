/**
 * useCalculationHistory — 通用计算历史 Hook
 *
 * 使用方式：
 *   const { history, addRecord, clearHistory } = useCalculationHistory<MyResult>('cagr', 20);
 *
 * 每个 calcKey 对应独立的 localStorage key：
 *   finance-calc-history-<calcKey>
 *
 * 保留最新 maxRecords 条，FIFO淘汰旧记录。
 */

"use client";

import { useState, useEffect, useCallback } from "react";

export interface HistoryRecord<T = Record<string, unknown>> {
  /** 唯一ID */
  id: string;
  /** 记录时间戳 */
  timestamp: number;
  /** 计算参数（人类可读标签） */
  inputSummary: string;
  /** 结果摘要（人类可读标签） */
  resultSummary: string;
  /** 完整参数数据 */
  inputs: Record<string, unknown>;
  /** 完整结果数据 */
  result: T;
}

const STORAGE_PREFIX = "finance-calc-history-";

function loadFromStorage<T>(key: string): HistoryRecord<T>[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryRecord<T>[];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, records: HistoryRecord<T>[]): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(records));
  } catch {
    // localStorage 可能在 SSR 或隐私模式下不可用，静默忽略
  }
}

export function useCalculationHistory<T = Record<string, unknown>>(
  calcKey: string,
  maxRecords = 20,
) {
  const [history, setHistory] = useState<HistoryRecord<T>[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 客户端初始化时加载
  useEffect(() => {
    setHistory(loadFromStorage<T>(calcKey));
    setLoaded(true);
  }, [calcKey]);

  const addRecord = useCallback(
    (record: Omit<HistoryRecord<T>, "id" | "timestamp">) => {
      const newRecord: HistoryRecord<T> = {
        ...record,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
      };

      setHistory((prev) => {
        const updated = [newRecord, ...prev].slice(0, maxRecords);
        saveToStorage(calcKey, updated);
        return updated;
      });
    },
    [calcKey, maxRecords],
  );

  const removeRecord = useCallback(
    (id: string) => {
      setHistory((prev) => {
        const updated = prev.filter((r) => r.id !== id);
        saveToStorage(calcKey, updated);
        return updated;
      });
    },
    [calcKey],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_PREFIX + calcKey);
    } catch {
      // ignore
    }
  }, [calcKey]);

  return { history, addRecord, removeRecord, clearHistory, loaded };
}
