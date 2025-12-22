import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();

    if (!Array.isArray(rawBody) || rawBody.length === 0) {
      return NextResponse.json({ error: "Data empty" }, { status: 400 });
    }

    // 1. FILTER EMPTY ROWS
    // Clean the data first to avoid failing on a trailing empty CSV line
    const cleanBody = rawBody.filter((item: any) => 
      item.tanggal_transaksi && item.total_harga
    );

    if (cleanBody.length === 0) {
      return NextResponse.json({ error: "Tidak ada data valid ditemukan." }, { status: 400 });
    }

    // 2. STRICT VALIDATION
    // Check against the ACTUAL CSV headers from the dummy data
    const isValid = cleanBody.every((item: any) => 
      item.tanggal_transaksi && 
      item.nama_produk && 
      item.total_harga &&
      item.id_pelanggan && // Critical for linking to customers
      item.id_produk       // Critical for linking to inventory
    );

    if (!isValid) {
      await prisma.import_history.create({ 
        data: { type: "Transaksi", count: 0, status: "Failed", filename: "Invalid Data Structure" } 
      });
      return NextResponse.json({ 
        error: "Data tidak valid. Pastikan kolom id_pelanggan, id_produk, tanggal_transaksi, dll sesuai template CSV." 
      }, { status: 400 });
    }

    // 3. MAPPING & INSERTION
    // We map the CSV columns to the Prisma schema fields
    const result = await prisma.transaksi.createMany({
      data: cleanBody.map((item: any) => ({
        // Relations
        id_pelanggan: parseInt(item.id_pelanggan, 10),
        id_produk: parseInt(item.id_produk, 10),
        
        // Data Fields
        tanggal_transaksi: new Date(item.tanggal_transaksi),
        nama_produk: item.nama_produk,
        quantity: parseInt(item.quantity, 10) || 1,
        total_harga: new Decimal(item.total_harga || 0),
        metode_pembayaran: item.metode_pembayaran || 'Cash',
        status_pembayaran: item.status_pembayaran || 'Success',
      })),
      skipDuplicates: true, 
    });

    await prisma.import_history.create({ 
      data: { type: "Transaksi", count: result.count, status: "Success", filename: "CSV Import" } 
    });

    return NextResponse.json({ message: `Success: ${result.count} imported`, count: result.count }, { status: 201 });
    
  } catch (e: any) {
    console.error("Import Error:", e); // Helpful for debugging
    await prisma.import_history.create({ 
      data: { type: "Transaksi", count: 0, status: "Failed", filename: "Server Error" } 
    });
    
    // Catch Foreign Key errors specifically (Prisma code P2003)
    if (e.code === 'P2003') {
       return NextResponse.json({ error: "Gagal: ID Pelanggan atau ID Produk tidak ditemukan di database." }, { status: 400 });
    }

    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}