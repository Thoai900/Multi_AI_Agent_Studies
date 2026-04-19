import { NextRequest } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient();

    const { data: prompt, error: fetchErr } = await supabase
      .from("prompts")
      .select("upvotes")
      .eq("id", params.id)
      .single();

    if (fetchErr || !prompt) {
      return Response.json({ error: "Prompt không tồn tại." }, { status: 404 });
    }

    const { error } = await supabase
      .from("prompts")
      .update({ upvotes: prompt.upvotes + 1 })
      .eq("id", params.id);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ upvotes: prompt.upvotes + 1 });
  } catch {
    return Response.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}
