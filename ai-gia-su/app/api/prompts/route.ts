import { NextRequest } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from("prompts")
      .select("*")
      .eq("status", "approved")
      .order("upvotes", { ascending: false })
      .order("created_at", { ascending: false });

    if (category && category !== "Tất cả") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data ?? []);
  } catch {
    return Response.json(
      { error: "Supabase chưa được cấu hình." },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, template, category, author_name } = body;

    if (!title?.trim() || !template?.trim() || !category) {
      return Response.json({ error: "Thiếu thông tin bắt buộc." }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("prompts")
      .insert({
        title: title.trim(),
        description: (description ?? "").trim(),
        template: template.trim(),
        category,
        author_name: (author_name ?? "").trim() || "Ẩn danh",
        status: "approved",
      })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data, { status: 201 });
  } catch {
    return Response.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}
