import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ error: "Data empty" }, { status: 400 });
    }

    const result = await prisma.poin.createMany({
      data: body.map((item: any) => ({
        nama_reward: item.nama_reward,
        points_required: parseInt(item.points_required, 10),
        stok: parseInt(item.stok, 10)
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ message: `Imported ${result.count} rewards` }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}