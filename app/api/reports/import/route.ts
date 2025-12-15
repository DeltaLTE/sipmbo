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

    // Map CSV data to the 'transaksi' table using the actual CSV headers
    const result = await prisma.transaksi.createMany({
      data: body.map((item: any) => ({
        // Mapped from CSV column 'tanggal_transaksi'
        tanggal_transaksi: item.tanggal_transaksi ? new Date(item.tanggal_transaksi) : new Date(),
        
        // Mapped from CSV column 'nama_produk'
        nama_produk: item.nama_produk,
        
        // Mapped from CSV column 'quantity'
        quantity: parseInt(item.quantity, 10) || 1,
        
        // Mapped from CSV column 'total_harga'
        // Using total_harga from CSV, defaulting to 0
        total_harga: new Decimal(item.total_harga || 0),
        
        // Mapped from CSV column 'metode_pembayaran'
        metode_pembayaran: item.metode_pembayaran || 'Tunai',
        
        // Mapped from CSV column 'status_pembayaran'
        status_pembayaran: item.status_pembayaran || 'Lunas', 
        
        // id_pelanggan and id_produk are ignored for createMany as they are auto-increment/not required for reporting
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