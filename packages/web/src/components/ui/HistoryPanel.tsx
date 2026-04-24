"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, ChevronDown, ChevronUp, Trash2, X } from "lucide-react";
import type { HistoryRecord } from "@/lib/useCalculationHistory";

interface HistoryPanelProps<T> {
  history: HistoryRecord<T>[];
  onClear: () => void;
  onRemove: (id: string) => void;
  /** 点击一条记录时回调（可用于回填表单） */
  onSelect?: (record: HistoryRecord<T>) => void;
  title?: string;
  /** 每条记录额外渲染的详情（可选） */
  renderDetail?: (record: HistoryRecord<T>) => React.ReactNode;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HistoryPanel<T>({
  history,
  onClear,
  onRemove,
  onSelect,
  title = "计算历史",
  renderDetail,
}: HistoryPanelProps<T>) {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (history.length === 0 && !open) return null;

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle
            className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer select-none"
            onClick={() => setOpen((v) => !v)}
          >
            <History className="h-4 w-4" />
            {title}
            {history.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                {history.length}
              </span>
            )}
            {open ? (
              <ChevronUp className="h-4 w-4 ml-1 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-1 text-gray-400" />
            )}
          </CardTitle>

          {open && history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-gray-400 hover:text-red-500"
              onClick={onClear}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              清空
            </Button>
          )}
        </div>
      </CardHeader>

      {open && (
        <CardContent className="px-4 pb-4">
          {history.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无历史记录</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition-colors"
                >
                  <div
                    className="flex items-center justify-between px-3 py-2 cursor-pointer"
                    onClick={() =>
                      setExpandedId((id) => (id === record.id ? null : record.id))
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-400 shrink-0">
                          {formatTime(record.timestamp)}
                        </span>
                        <span className="text-xs text-gray-600 truncate">
                          {record.inputSummary}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-900 mt-0.5 truncate">
                        {record.resultSummary}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      {onSelect && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-blue-600 hover:text-blue-800 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(record);
                          }}
                        >
                          回填
                        </Button>
                      )}
                      <button
                        className="text-gray-300 hover:text-red-400 transition-colors p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(record.id);
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 展开详情 */}
                  {expandedId === record.id && (
                    <div className="border-t border-gray-200 px-3 py-2 text-xs text-gray-600 space-y-1 bg-white rounded-b-lg">
                      {renderDetail ? (
                        renderDetail(record)
                      ) : (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          {Object.entries(record.inputs).map(([k, v]) => (
                            <div key={k}>
                              <span className="text-gray-400">{k}：</span>
                              <span>{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
