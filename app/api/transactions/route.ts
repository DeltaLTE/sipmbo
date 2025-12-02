import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";

// --- CONFIGURATION ---
// How much money = 1 point?
const POINTS_EARNING_RATE = 10000; // Rp 10.000 = 1 Point

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id_pelanggan, id_produk, quantity, metode_pembayaran } = body;

    if (!id_pelanggan || !id_produk || !quantity) {
      return NextResponse.json({ error: "Data transaksi tidak lengkap" }, { status: 400 });
    }

    // 1. Fetch Product (to get price & point cost)
    const product = await prisma.produk.findUnique({
      where: { id_produk: parseInt(id_produk) }
    });

    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    // 2. Fetch Customer (to check balance)
    const customer = await prisma.pelanggan.findUnique({
      where: { id_pelanggan: parseInt(id_pelanggan) }
    });

    if (!customer) {
      return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
    }

    // 3. Calculate Point Logic
    let pointsChange = 0;
    let isRedemption = false;

    // Check if this product is a REWARD (has a point cost)
    if (product.poin_pertukaran && product.poin_pertukaran > 0) {
      isRedemption = true;
      const totalPointCost = product.poin_pertukaran * quantity;

      // Check if customer has enough points
      if ((customer.total_poin || 0) < totalPointCost) {
        return NextResponse.json({ 
          error: `Poin tidak cukup. Butuh ${totalPointCost}, punya ${customer.total_poin}` 
        }, { status: 400 });
      }

      pointsChange = -totalPointCost; // SUBTRACT points
    } else {
      // Regular Purchase -> EARN points
      const totalPrice = Number(product.harga_satuan) * quantity;
      pointsChange = Math.floor(totalPrice / POINTS_EARNING_RATE); // ADD points
    }

    // 4. Execute Database Transaction (Atomic)
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Create Transaction Record
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

      // B. Update Customer Points
      const updatedCustomer = await tx.pelanggan.update({
        where: { id_pelanggan: parseInt(id_pelanggan) },
        data: {
          total_poin: {
            increment: pointsChange // Handles both + and - automatically
          }
        }
      });

      return { newTransaction, updatedCustomer };
    });

    return NextResponse.json({ 
      message: isRedemption ? "Redeem berhasil" : "Transaksi berhasil", 
      transaction: result.newTransaction,
      points: {
        earned: pointsChange > 0 ? pointsChange : 0,
        spent: pointsChange < 0 ? Math.abs(pointsChange) : 0,
        newBalance: result.updatedCustomer.total_poin
      }
    }, { status: 201 });

  } catch (e: any) {
    console.error("Transaction Error:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}