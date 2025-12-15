import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ error: "Data import kosong" }, { status: 400 });
    }

    // STRICT VALIDATION: Check every row
    const isValid = body.every((item: any) => item.name && item.email);

    if (!isValid) {
      await prisma.import_history.create({ data: { type: "Pelanggan", count: 0, status: "Failed", filename: "Invalid Data" } });
      return NextResponse.json({ error: "Data tidak valid. Nama dan Email wajib diisi." }, { status: 400 });
    }

    const result = await prisma.pelanggan.createMany({
      data: body.map((item: any) => ({
        nama_pelanggan: item.name,
        email_pelanggan: item.email,
        no_telepon_pelanggan: item.phone || '',
        total_poin: parseInt(item.points, 10) || 0
      })),
      skipDuplicates: true,
    });

    await prisma.import_history.create({ data: { type: "Pelanggan", count: result.count, status: "Success", filename: "CSV Import" } });

    return NextResponse.json({ message: `Success: ${result.count} imported`, count: result.count }, { status: 201 });
  } catch (e: any) {
    await prisma.import_history.create({ data: { type: "Pelanggan", count: 0, status: "Failed", filename: "Server Error" } });
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}