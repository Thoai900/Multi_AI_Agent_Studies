import { getAllPacks } from "@/lib/setupPacks";

export async function GET() {
  try {
    const packs = await getAllPacks();
    return Response.json(packs);
  } catch {
    return Response.json({ error: "Lỗi tải danh sách." }, { status: 500 });
  }
}
