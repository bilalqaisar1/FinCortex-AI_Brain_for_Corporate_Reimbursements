import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

type CategoryPayload = {
  category_id: number;
  category_name: string;
  subcategories: { subcategory_id: number; subcategory_name: string }[];
};

export async function POST(request: Request) {
  try {
    const { admin_uuid } = (await request.json()) as {
      admin_uuid?: string;
    };

    if (!admin_uuid) {
      return NextResponse.json(
        { success: false, message: "admin_uuid is required." },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin.rpc(
      "get_expense_categories_with_subcategories",
      {
        p_admin_uuid: admin_uuid,
      },
    );

    if (error) {
      throw error;
    }

    const categories: CategoryPayload[] = Array.isArray(data) ? data : [];

    console.log("\n==============================================");
    console.log("🔍 DEBUG - /api/options/column-values FINAL OUTPUT");
    console.log("==============================================");
    console.log(`admin_uuid: ${admin_uuid}`);
    console.log(`categories count: ${categories.length}`);
    categories.forEach((cat, idx) => {
      console.log(
        `${idx + 1}. ${cat.category_name} (id: ${cat.category_id}) | subcategories: ${cat.subcategories?.length ?? 0}`,
      );
    });
    console.log("==============================================\n");

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error("Failed to fetch categories with subcategories", error);
    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch categories with subcategories",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}


