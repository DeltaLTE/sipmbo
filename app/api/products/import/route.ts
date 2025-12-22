import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();

    if (!Array.isArray(rawBody) || rawBody.length === 0) {
      return NextResponse.json({ error: "Data import kosong" }, { status: 400 });
    }

    const successfulRows = [];
    const failedRows = [];

    // 1. LOOP & VALIDATE
    for (const [index, item] of rawBody.entries()) {
      // Basic Validation
      if (!item.name || !item.category) {
        failedRows.push({ index, reason: "Missing Name or Category", data: item });
        continue;
      }

      // Safe Type Conversion
      // Prisma Decimal needs a string or number, but NOT NaN
      let priceVal = 0;
      if (item.price) {
        const parsed = parseFloat(item.price);
        priceVal = isNaN(parsed) ? 0 : parsed;
      }

      let pointVal = 0;
      if (item.points) {
         const parsed = parseInt(item.points, 10);
         pointVal = isNaN(parsed) ? 0 : parsed;
      }

      successfulRows.push({
        nama_produk: item.name,
        kategori_produk: item.category,
        catatan_produk: item.notes || "",
        poin_pertukaran: pointVal,
        harga_satuan: new Decimal(priceVal),
      });
    }

    if (successfulRows.length === 0) {
      return NextResponse.json({ 
        error: "Tidak ada data valid ditemukan.", 
        failedDetails: failedRows 
      }, { status: 400 });
    }

    // 2. INSERT TO DB
    const result = await prisma.produk.createMany({
      data: successfulRows,
      skipDuplicates: true, 
    });

    // Log History
    await prisma.import_history.create({ 
      data: { 
        type: "Produk", 
        count: result.count, 
        status: failedRows.length > 0 ? "Partial Success" : "Success", 
        filename: "CSV Import" 
      } 
    });

    return NextResponse.json({ 
      message: `Sukses: ${result.count} data masuk.`, 
      count: result.count,
      failed: failedRows.length,
      failedDetails: failedRows
    }, { status: 201 });

  } catch (e: any) {
    console.error("Product Import Error:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}