import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ error: "Data import kosong" }, { status: 400 });
    }

    // STRICT VALIDATION
    const isValid = body.every((item: any) => item.name && item.category);

    if (!isValid) {
      await prisma.import_history.create({ data: { type: "Produk", count: 0, status: "Failed", filename: "Invalid Data" } });
      return NextResponse.json({ error: "Data tidak valid. Nama dan Kategori wajib diisi." }, { status: 400 });
    }

    const result = await prisma.produk.createMany({
      data: body.map((item: any) => ({
        nama_produk: item.name,
        kategori_produk: item.category,
        catatan_produk: item.notes,
        poin_pertukaran: parseInt(item.points, 10) || 0,
        harga_satuan: item.price ? new Decimal(item.price) : null,
      })),
      skipDuplicates: true, 
    });

    await prisma.import_history.create({ data: { type: "Produk", count: result.count, status: "Success", filename: "CSV Import" } });

    return NextResponse.json({ message: `Success: ${result.count} imported`, count: result.count }, { status: 201 });
  } catch (e: any) {
    await prisma.import_history.create({ data: { type: "Produk", count: 0, status: "Failed", filename: "Server Error" } });
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}