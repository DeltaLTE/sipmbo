import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        { error: "Data import harus berupa array dan tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Map the incoming data to the prisma schema
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

    return NextResponse.json(
      { message: `Berhasil mengimport ${result.count} produk`, count: result.count },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("Import error:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}