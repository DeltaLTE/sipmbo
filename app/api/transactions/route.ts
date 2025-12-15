import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";

const POINTS_EARNING_RATE = 10000;

// GET: Fetch Transactions List
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { nama_produk: { contains: search } },
        { status_pembayaran: { contains: search } }
      ];
    }

    const transactions = await prisma.transaksi.findMany({
      where: whereClause,
      orderBy: { tanggal_transaksi: 'desc' },
      take: 100 // Limit to last 100 for performance
    });

    const formatted = transactions.map(t => ({
      id: t.id_transaksi,
      date: t.tanggal_transaksi,
      product: t.nama_produk,
      quantity: t.quantity,
      total: Number(t.total_harga),
      payment: t.metode_pembayaran
    }));

    return NextResponse.json({ data: formatted });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Add Transaction (With Smart Point Logic)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id_pelanggan, id_produk, quantity, metode_pembayaran } = body;

    // ... (This is the same smart logic I gave you before, reused here for completeness)
    const product = await prisma.produk.findUnique({ where: { id_produk: parseInt(id_produk) } });
    const customer = await prisma.pelanggan.findUnique({ where: { id_pelanggan: parseInt(id_pelanggan) } });

    if (!product || !customer) return NextResponse.json({ error: "Data not found" }, { status: 404 });

    let pointsChange = 0;
    if (product.poin_pertukaran && product.poin_pertukaran > 0) {
      const cost = product.poin_pertukaran * quantity;
      if ((customer.total_poin || 0) < cost) return NextResponse.json({ error: "Insufficient points" }, { status: 400 });
      pointsChange = -cost;
    } else {
      pointsChange = Math.floor((Number(product.harga_satuan) * quantity) / POINTS_EARNING_RATE);
    }

    const result = await prisma.$transaction(async (tx) => {
      const newTransaction = await tx.transaksi.create({
        data: {
          id_pelanggan: parseInt(id_pelanggan),
          id_produk: parseInt(id_produk),
          quantity: parseInt(quantity),
          nama_produk: product.nama_produk,
          total_harga: new Decimal(Number(product.harga_satuan) * quantity),
          metode_pembayaran: metode_pembayaran || "Cash",
          status_pembayaran: "Success",
          tanggal_transaksi: new Date(),
        }
      });
      await tx.pelanggan.update({
        where: { id_pelanggan: parseInt(id_pelanggan) },
        data: { total_poin: { increment: pointsChange } }
      });
      return newTransaction;
    });

    return NextResponse.json({ message: "Success", data: result }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Remove Transaction
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.transaksi.delete({
      where: { id_transaksi: parseInt(id) }
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}