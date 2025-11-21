import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

type ColumnInput = {
  key: string;
  columnName: string;
};

type RPCRow = Record<string, string | null>;

export async function POST(request: Request) {
  try {
    const { tableName, columns } = (await request.json()) as {
      tableName?: string;
      columns?: ColumnInput[];
    };

    if (!tableName || !Array.isArray(columns) || columns.length === 0) {
      return NextResponse.json(
        { success: false, message: "tableName and columns are required." },
        { status: 400 },
      );
    }

    const columnResults = await Promise.all(
      columns.map(async ({ key, columnName }) => {
        if (!key || !columnName) {
          throw new Error("Each column definition must include key and columnName.");
        }

        const { data, error } = await supabaseAdmin.rpc("get_column_data_json", {
          table_name: tableName,
          column_name: columnName,
        });

        if (error) {
          throw error;
        }

        const values = Array.isArray(data?.values)
          ? data.values.map((value: unknown) =>
              value === null || value === undefined ? null : String(value),
            )
          : [];

        return { key, values };
      }),
    );

    const rowCount =
      columnResults.length > 0 ? Math.max(...columnResults.map((column) => column.values.length)) : 0;

    const rows: RPCRow[] = rowCount
      ? Array.from({ length: rowCount }, (_, index) => {
          const row: RPCRow = {};

          columnResults.forEach(({ key, values }) => {
            row[key] = values[index] ?? null;
          });

          return row;
        }).filter((row) => Object.values(row).some((value) => value !== null))
      : [];

    return NextResponse.json({ success: true, rows });
  } catch (error) {
    console.error("Failed to fetch column values", error);
    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch column values",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}


