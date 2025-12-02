import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET - Fetch all notifications, or by id_pesan, id_pelanggan, or search
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idPesan = searchParams.get('id_pesan');
    const idPelanggan = searchParams.get('id_pelanggan');
    const search = searchParams.get('search');

    if (idPesan) {
      // Fetch specific notification by its ID
      const notifikasi = await prisma.notifikasi.findUnique({
        where: { id_pesan: parseInt(idPesan) },
        include: { pelanggan: true }, // Optionally include customer details
      });

      if (!notifikasi) {
        return NextResponse.json({ error: 'Notifikasi tidak ditemukan' }, { status: 404 });
      }
      return NextResponse.json(notifikasi);
    }

    let whereClause: any = {};

    if (idPelanggan) {
      // Fetch all notifications for a specific customer
      whereClause.id_pelanggan = parseInt(idPelanggan);
    }

    if (search) {
      // Search for notifications containing the search term in 'pesan'
      whereClause.pesan = { contains: search };
    }

    // Fetch notifications based on criteria
    const notifList = await prisma.notifikasi.findMany({
      where: whereClause,
      include: { 
        pelanggan: { // Include customer name for context
          select: {
            nama_pelanggan: true
          }
        } 
      },
      orderBy: { id_pesan: 'desc' }, // Show newest first
    });

    return NextResponse.json(notifList);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

// POST - Create a new notification
export async function POST(req: Request) {
  try {
    const { pesan, id_pelanggan } = await req.json();

    // Validation
    if (!pesan) {
      return NextResponse.json({ error: 'Field "pesan" wajib diisi' }, { status: 400 });
    }

    // Convert id_pelanggan to Int if it exists, otherwise null
    const pelangganIdInt = id_pelanggan ? parseInt(id_pelanggan, 10) : null;

    // Check if customer exists if id_pelanggan is provided
    if (pelangganIdInt) {
      const pelanggan = await prisma.pelanggan.findUnique({
        where: { id_pelanggan: pelangganIdInt }
      });
      if (!pelanggan) {
        return NextResponse.json({ error: 'Pelanggan tidak ditemukan' }, { status: 404 });
      }
    }

    const newNotifikasi = await prisma.notifikasi.create({
      data: {
        pesan,
        id_pelanggan: pelangganIdInt,
      },
    });

    return NextResponse.json({ message: "Notifikasi berhasil dibuat", data: newNotifikasi }, { status: 201 });
  } catch (e: any) {
    console.error("POST error:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

// PUT - Update an existing notification
export async function PUT(req: Request) {
  try {
    const { id_pesan, pesan, id_pelanggan } = await req.json();

    if (!id_pesan) {
      return NextResponse.json({ error: 'ID notifikasi (id_pesan) wajib diisi' }, { status: 400 });
    }

    const notifIdInt = parseInt(id_pesan, 10);

    // Check if notification exists
    const existingNotifikasi = await prisma.notifikasi.findUnique({
      where: { id_pesan: notifIdInt },
    });

    if (!existingNotifikasi) {
      return NextResponse.json({ error: 'Notifikasi tidak ditemukan' }, { status: 404 });
    }
    
    // Prepare data for update
    let dataToUpdate: { pesan?: string; id_pelanggan?: number | null } = {};

    if (pesan) {
      dataToUpdate.pesan = pesan;
    }
    
    // Check if id_pelanggan was intentionally passed
    if (id_pelanggan !== undefined) {
      const pelangganIdInt = id_pelanggan ? parseInt(id_pelanggan, 10) : null;
      
      // Check if customer exists if a new id_pelanggan is provided
      if (pelangganIdInt) {
        const pelanggan = await prisma.pelanggan.findUnique({
          where: { id_pelanggan: pelangganIdInt }
        });
        if (!pelanggan) {
          return NextResponse.json({ error: 'Pelanggan tidak ditemukan' }, { status: 404 });
        }
      }
      dataToUpdate.id_pelanggan = pelangganIdInt;
    }

    // Update notification
    const updatedNotifikasi = await prisma.notifikasi.update({
      where: { id_pesan: notifIdInt },
      data: dataToUpdate,
    });

    return NextResponse.json({ message: "Notifikasi berhasil diupdate", data: updatedNotifikasi });
  } catch (e: any) {
    console.error("PUT error:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

// DELETE - Delete a notification
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id_pesan'); // Use id_pesan

    if (!id) {
      return NextResponse.json({ error: 'ID notifikasi (id_pesan) wajib diisi' }, { status: 400 });
    }

    const notifIdInt = parseInt(id, 10);

    // Check if notification exists
    const existingNotifikasi = await prisma.notifikasi.findUnique({
      where: { id_pesan: notifIdInt },
    });

    if (!existingNotifikasi) {
      return NextResponse.json({ error: 'Notifikasi tidak ditemukan' }, { status: 404 });
    }

    await prisma.notifikasi.delete({
      where: { id_pesan: notifIdInt },
    });

    return NextResponse.json({ message: 'Notifikasi berhasil dihapus' });
  } catch (e: any) {
    console.error("DELETE error:", e);
    // Handle potential foreign key constraints, etc.
    if (e.code === 'P2003') { 
      return NextResponse.json({ error: 'Gagal menghapus notifikasi karena masih terhubung dengan data lain' }, { status: 409 });
    }
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}