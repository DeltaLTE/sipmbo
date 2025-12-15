import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ error: "Data empty" }, { status: 400 });
    }

    // STRICT VALIDATION
    // Ensure every row has Date, Product, Quantity, Total
    const isValid = body.every((item: any) => item.date && item.product && item.quantity && item.total);

    if (!isValid) {
      await prisma.import_history.create({ data: { type: "Transaksi", count: 0, status: "Failed", filename: "Invalid Data Structure" } });
      return NextResponse.json({ error: "Data tidak valid. Kolom Date, Product, Quantity, Total wajib ada." }, { status: 400 });
    }

    const result = await prisma.transaksi.createMany({
      data: body.map((item: any) => ({
        tanggal_transaksi: new Date(item.date),
        nama_produk: item.product,
        quantity: parseInt(item.quantity, 10) || 1,
        total_harga: new Decimal(item.total || 0),
        metode_pembayaran: item.payment || 'Cash',
        status_pembayaran: 'Success',
      })),

    });

    await prisma.import_history.create({ data: { type: "Transaksi", count: result.count, status: "Success", filename: "CSV Import" } });

    return NextResponse.json({ message: `Success: ${result.count} imported`, count: result.count }, { status: 201 });
  } catch (e: any) {
    await prisma.import_history.create({ data: { type: "Transaksi", count: 0, status: "Failed", filename: "Server Error" } });
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}