import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// GET - Fetch all customers
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    const customers = await prisma.pelanggan.findMany({
      where: search ? {
        OR: [
          { nama_pelanggan: { contains: search } },
          { email_pelanggan: { contains: search } },
          { no_telepon_pelanggan: { contains: search } }
        ]
      } : {},
      orderBy: { id_pelanggan: 'desc' }
    });

    // Transform to match frontend format
    const transformedCustomers = customers.map(customer => ({
      id: customer.id_pelanggan,
      name: customer.nama_pelanggan || '',
      email: customer.email_pelanggan || '',
      phone: customer.no_telepon_pelanggan || '',
      points: customer.total_poin || 0
    }));

    return Response.json({ data: transformedCustomers }, { status: 200 });
  } catch (e: any) {
    console.error('GET Customer Error:', e);
    return Response.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

// POST - Create new customer
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, points } = body;

    if (!name || !phone) {
      return Response.json(
        { error: "Nama dan nomor telepon wajib diisi" },
        { status: 400 }
      );
    }

    // Check if phone number already exists
    const existingCustomer = await prisma.pelanggan.findFirst({
      where: { no_telepon_pelanggan: phone }
    });

    if (existingCustomer) {
      return Response.json(
        { error: "Nomor telepon sudah terdaftar" },
        { status: 400 }
      );
    }

    const newCustomer = await prisma.pelanggan.create({
      data: {
        nama_pelanggan: name,
        email_pelanggan: email || null,
        no_telepon_pelanggan: phone,
        total_poin: points || 0
      }
    });

    const transformed = {
      id: newCustomer.id_pelanggan,
      name: newCustomer.nama_pelanggan || '',
      email: newCustomer.email_pelanggan || '',
      phone: newCustomer.no_telepon_pelanggan || '',
      points: newCustomer.total_poin || 0
    };

    return Response.json(
      { message: "Pelanggan berhasil ditambahkan", data: transformed },
      { status: 201 }
    );
  } catch (e: any) {
    console.error('POST Customer Error:', e);
    return Response.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

// PUT - Update customer
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, email, phone, points } = body;

    if (!id) {
      return Response.json({ error: "ID pelanggan wajib diisi" }, { status: 400 });
    }

    // Check if phone number is used by another customer
    if (phone) {
      const existingCustomer = await prisma.pelanggan.findFirst({
        where: { 
          no_telepon_pelanggan: phone,
          NOT: { id_pelanggan: parseInt(id) }
        }
      });

      if (existingCustomer) {
        return Response.json(
          { error: "Nomor telepon sudah digunakan pelanggan lain" },
          { status: 400 }
        );
      }
    }

    const updatedCustomer = await prisma.pelanggan.update({
      where: { id_pelanggan: parseInt(id) },
      data: {
        nama_pelanggan: name,
        email_pelanggan: email || null,
        no_telepon_pelanggan: phone,
        total_poin: points || 0
      }
    });

    const transformed = {
      id: updatedCustomer.id_pelanggan,
      name: updatedCustomer.nama_pelanggan || '',
      email: updatedCustomer.email_pelanggan || '',
      phone: updatedCustomer.no_telepon_pelanggan || '',
      points: updatedCustomer.total_poin || 0
    };

    return Response.json(
      { message: "Pelanggan berhasil diupdate", data: transformed },
      { status: 200 }
    );
  } catch (e: any) {
    console.error('PUT Customer Error:', e);
    if (e.code === 'P2025') {
      return Response.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
    }
    return Response.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

// DELETE - Delete customer
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "ID pelanggan wajib diisi" }, { status: 400 });
    }

    // Check if customer has transactions
    const customerWithTransactions = await prisma.pelanggan.findUnique({
      where: { id_pelanggan: parseInt(id) },
      include: {
        _count: {
          select: { transaksi: true }
        }
      }
    });

    if (customerWithTransactions && customerWithTransactions._count.transaksi > 0) {
      return Response.json(
        { error: "Tidak bisa menghapus pelanggan yang memiliki riwayat transaksi" },
        { status: 400 }
      );
    }

    await prisma.pelanggan.delete({
      where: { id_pelanggan: parseInt(id) }
    });

    return Response.json(
      { message: "Pelanggan berhasil dihapus" },
      { status: 200 }
    );
  } catch (e: any) {
    console.error('DELETE Customer Error:', e);
    if (e.code === 'P2025') {
      return Response.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
    }
    return Response.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}