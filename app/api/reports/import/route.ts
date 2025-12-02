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

    // Map CSV data to the 'transaksi' table
    const result = await prisma.transaksi.createMany({
      data: body.map((item: any) => ({
        // Parse Date (Expects YYYY-MM-DD)
        tanggal_transaksi: item.date ? new Date(item.date) : new Date(),
        
        nama_produk: item.product,
        quantity: parseInt(item.quantity, 10) || 1,
        
        // Parse Currency
        total_harga: new Decimal(item.total || 0),
        
        metode_pembayaran: item.payment || 'Cash',
        status_pembayaran: 'Success', // Default to success for imported history
        
        // Optional: You could try to map id_produk/id_pelanggan if provided,
        // but for raw reports, the text fields above are sufficient.
      })),
      skipDuplicates: true,
    });

    return NextResponse.json(
      { message: `Berhasil mengimport ${result.count} transaksi`, count: result.count },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("Import error:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}