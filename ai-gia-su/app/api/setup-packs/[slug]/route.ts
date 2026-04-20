import { NextRequest } from "next/server";
import { getPackBySlug } from "@/lib/setupPacks";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const pack = await getPackBySlug(params.slug);
    if (!pack) return Response.json({ error: "Không tìm thấy." }, { status: 404 });
    return Response.json(pack);
  } catch {
    return Response.json({ error: "Lỗi tải dữ liệu." }, { status: 500 });
  }
}
