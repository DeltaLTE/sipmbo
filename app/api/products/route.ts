import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Helper to transform DB data to frontend-friendly format
const transformProduct = (product: any) => ({
  id: product.id_produk,
  name: product.nama_produk || '',
  category: product.kategori_produk || '',
  notes: product.catatan_produk || '',
  points: product.poin_pertukaran || 0,
  price: product.harga_satuan ? Number(product.harga_satuan) : null,
});

// GET - Fetch all products
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    // Build where clause based on search
    let whereClause = {};
    
    if (search) {
      // Check if search is a number (for ID search)
      const searchAsNumber = parseInt(search);
      
      if (!isNaN(searchAsNumber)) {
        // If it's a valid number, search by ID or text fields
        whereClause = {
          OR: [
            { id_produk: searchAsNumber },
            { nama_produk: { contains: search } },
            { kategori_produk: { contains: search } },
          ]
        };
      } else {
        // If not a number, only search text fields
        whereClause = {
          OR: [
            { nama_produk: { contains: search } },
            { kategori_produk: { contains: search } },
          ]
        };
      }
    }

    const products = await prisma.produk.findMany({
      where: whereClause,
      orderBy: { id_produk: 'asc' } // Order by ID
    });

    const transformed = products.map(transformProduct);
    return NextResponse.json({ data: transformed }, { status: 200 });
  } catch (e: any) {
    console.error('GET Product Error:', e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

// POST - Create new product
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, category, notes, points, price } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: "Nama dan kategori produk wajib diisi" },
        { status: 400 }
      );
    }
    
    // Convert types for Prisma
    const priceValue = price ? parseFloat(price) : null;
    const pointsValue = points ? parseInt(points) : 0;

    const newProduct = await prisma.produk.create({
      data: {
        // id_produk is auto-generated in your screenshot (e.g., 000000001)
        // If it's not auto-incrementing, we'd need a different approach
        // But assuming it's an auto-increment or default string
        nama_produk: name,
        kategori_produk: category,
        catatan_produk: notes || null,
        poin_pertukaran: pointsValue,
        harga_satuan: priceValue
      }
    });

    return NextResponse.json(
      { message: "Produk berhasil ditambahkan", data: transformProduct(newProduct) },
      { status: 201 }
    );
  } catch (e: any) {
    console.error('POST Product Error:', e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

// PUT - Update product
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, category, notes, points, price } = body;

    if (!id) {
      return NextResponse.json({ error: "ID produk wajib diisi" }, { status: 400 });
    }

    const priceValue = price ? parseFloat(price) : null;
    const pointsValue = points ? parseInt(points) : 0;

    const updatedProduct = await prisma.produk.update({
      where: { id_produk: id },
      data: {
        nama_produk: name,
        kategori_produk: category,
        catatan_produk: notes || null,
        poin_pertukaran: pointsValue,
        harga_satuan: priceValue
      }
    });

    return NextResponse.json(
      { message: "Produk berhasil diupdate", data: transformProduct(updatedProduct) },
      { status: 200 }
    );
  } catch (e: any) {
    console.error('PUT Product Error:', e);
    if (e.code === 'P2025') {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

// DELETE - Delete product
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID produk wajib diisi" }, { status: 400 });
    }

    // Convert id to integer since id_produk is an integer field
    const productId = parseInt(id);
    
    if (isNaN(productId)) {
      return NextResponse.json({ error: "ID produk tidak valid" }, { status: 400 });
    }

    // Try to delete directly - let database constraints handle protection
    // If you have foreign key constraints, the DB will throw an error if product is in use
    await prisma.produk.delete({
      where: { id_produk: productId }
    });

    return NextResponse.json(
      { message: "Produk berhasil dihapus" },
      { status: 200 }
    );
  } catch (e: any) {
    console.error('DELETE Product Error:', e);
    
    // Handle foreign key constraint violations
    if (e.code === 'P2003') {
      return NextResponse.json(
        { error: "Tidak bisa menghapus produk yang memiliki riwayat transaksi" },
        { status: 400 }
      );
    }
    
    // Handle product not found
    if (e.code === 'P2025') {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }
    
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}