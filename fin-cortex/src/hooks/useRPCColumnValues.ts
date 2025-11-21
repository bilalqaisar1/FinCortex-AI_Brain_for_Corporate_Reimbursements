"use client";

import { useCallback, useEffect, useState, useMemo, useRef } from "react";

type RPCRow = Record<string, string | null>;

interface ColumnConfig<TKeys extends string> {
  key: TKeys;
  columnName: string;
}

interface UseRPCColumnValuesOptions<TData extends Record<string, unknown>, TKeys extends keyof TData & string> {
  tableName: string;
  columns: Array<ColumnConfig<TKeys>>;
  transform?: (rows: RPCRow[]) => TData[];
  enabled?: boolean;
}

interface UseRPCColumnValuesReturn<TData> {
  data: TData[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRPCColumnValues<TData extends Record<string, unknown>, TKeys extends keyof TData & string>({
  tableName,
  columns,
  transform,
  enabled = true,
}: UseRPCColumnValuesOptions<TData, TKeys>): UseRPCColumnValuesReturn<TData> {
  const [data, setData] = useState<TData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  // Memoize columns to prevent unnecessary re-renders
  const columnsKey = useMemo(() => JSON.stringify(columns), [columns]);
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  // Memoize transform to prevent unnecessary re-renders
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const fetchColumns = useCallback(async () => {
    if (!enabled || columnsRef.current.length === 0) {
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/options/column-values", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          tableName,
          columns: columnsRef.current,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        const message = payload?.message || "Unable to load options.";
        throw new Error(message);
      }

      const rows = Array.isArray(payload.rows) ? (payload.rows as RPCRow[]) : [];
      const normalized = transformRef.current ? transformRef.current(rows) : (rows as unknown as TData[]);

      setData(normalized);
      setHasFetched(true);
    } catch (rpcError) {
      console.error("Failed to load RPC column values", rpcError);
      setError("Unable to load options. Please try again.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, tableName, columnsKey]);

  useEffect(() => {
    if (!hasFetched) {
      fetchColumns();
    }
  }, [fetchColumns, hasFetched]);

  return {
    data,
    loading,
    error,
    refresh: fetchColumns,
  };
}

