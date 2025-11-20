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

    // Use createMany to insert multiple customers
    const result = await prisma.pelanggan.createMany({
      data: body.map((item: any) => ({
        // Map the JSON fields to your Prisma schema fields
        nama_pelanggan: item.name,
        email_pelanggan: item.email,
        no_telepon_pelanggan: item.phone,
        total_poin: parseInt(item.points, 10) || 0
      })),
      skipDuplicates: true, // Skip if email/phone causes unique constraint violation
    });

    return NextResponse.json(
      { message: `Berhasil mengimport ${result.count} pelanggan`, count: result.count },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("Import error:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}