import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        { error: "Data import harus berupa array dan tidak boleh kosong" },
        { status: 400 }
      );
    }

    const result = await prisma.notifikasi.createMany({
      data: body.map((item: any) => ({
        pesan: item.pesan,
        id_pelanggan: item.id_pelanggan || null,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json(
      { message: `Berhasil mengimport ${result.count} notifikasi`, count: result.count },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("Import error:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}