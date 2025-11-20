import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch all rewards (points)
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    const rewards = await prisma.poin.findMany({
      where: search ? {
        nama_reward: { contains: search }
      } : {},
      orderBy: { points_required: 'asc' }
    });

    return NextResponse.json(rewards, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

// POST - Create new reward
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nama_reward, points_required, stok } = body;

    if (!nama_reward || points_required === undefined || stok === undefined) {
      return NextResponse.json(
        { error: "Nama reward, points required, dan stok wajib diisi" },
        { status: 400 }
      );
    }

    const newReward = await prisma.poin.create({
      data: {
        nama_reward,
        points_required: parseInt(points_required, 10),
        stok: parseInt(stok, 10)
      }
    });

    return NextResponse.json(
      { message: "Reward berhasil ditambahkan", data: newReward },
      { status: 201 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

// PUT - Update reward
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id_point, nama_reward, points_required, stok } = body;

    if (!id_point) {
      return NextResponse.json({ error: "ID point wajib diisi" }, { status: 400 });
    }

    const updatedReward = await prisma.poin.update({
      where: { id_point: parseInt(id_point, 10) },
      data: {
        ...(nama_reward && { nama_reward }),
        ...(points_required !== undefined && { points_required: parseInt(points_required, 10) }),
        ...(stok !== undefined && { stok: parseInt(stok, 10) })
      }
    });

    return NextResponse.json(
      { message: "Reward berhasil diupdate", data: updatedReward },
      { status: 200 }
    );
  } catch (e: any) {
    if (e.code === 'P2025') {
      return NextResponse.json({ error: "Reward tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

// DELETE - Delete reward
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID point wajib diisi" }, { status: 400 });
    }

    await prisma.poin.delete({
      where: { id_point: parseInt(id, 10) }
    });

    return NextResponse.json(
      { message: "Reward berhasil dihapus" },
      { status: 200 }
    );
  } catch (e: any) {
    if (e.code === 'P2025') {
      return NextResponse.json({ error: "Reward tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}