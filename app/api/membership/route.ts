import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";

// GET - Fetch all membership tiers
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    const tiers = await prisma.membership.findMany({
      where: search ? {
        tier_membership: { contains: search }
      } : {},
      include: {
        _count: {
          select: { pelanggan: true }
        }
      },
      orderBy: { required_point: 'asc' }
    });

    // Add member count to response
    const tiersWithCount = tiers.map(tier => ({
      ...tier,
      jumlah_member: tier._count.pelanggan
    }));

    return NextResponse.json(tiersWithCount, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

// POST - Create new membership tier
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Use field names from schema.prisma
    const { tier_membership, required_point, diskon } = body;

    if (!tier_membership || required_point === undefined || diskon === undefined) {
      return NextResponse.json(
        { error: "Nama tier, required point, dan diskon wajib diisi" },
        { status: 400 }
      );
    }

    // Check if tier already exists
    const existingTier = await prisma.membership.findUnique({
      where: { tier_membership }
    });
    if (existingTier) {
      return NextResponse.json({ error: "Nama tier membership ini sudah ada" }, { status: 409 });
    }

    const newTier = await prisma.membership.create({
      data: {
        tier_membership,
        required_point: parseInt(required_point, 10),
        diskon: new Decimal(diskon)
      }
    });

    return NextResponse.json(
      { message: "Membership tier berhasil ditambahkan", data: newTier },
      { status: 201 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

// PUT - Update membership tier
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    // tier_membership is the ID (Primary Key)
    const { tier_membership, required_point, diskon } = body;

    if (!tier_membership) {
      return NextResponse.json({ error: "tier_membership (ID) wajib diisi" }, { status: 400 });
    }

    const updatedTier = await prisma.membership.update({
      where: { tier_membership: tier_membership },
      data: {
        // Only update fields that are provided
        ...(required_point !== undefined && { required_point: parseInt(required_point, 10) }),
        ...(diskon !== undefined && { diskon: new Decimal(diskon) })
      }
    });

    return NextResponse.json(
      { message: "Membership tier berhasil diupdate", data: updatedTier },
      { status: 200 }
    );
  } catch (e: any) {
    if (e.code === 'P2025') { // Prisma error code for "record not found"
      return NextResponse.json({ error: "Membership tier tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

// DELETE - Delete membership tier
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    // The ID is the tier_membership string
    const tier_membership = searchParams.get("id");

    if (!tier_membership) {
      return NextResponse.json({ error: "ID tier (tier_membership) wajib diisi" }, { status: 400 });
    }

    // Check if tier has members
    const tierWithMembers = await prisma.membership.findUnique({
      where: { tier_membership: tier_membership },
      include: {
        _count: {
          select: { pelanggan: true }
        }
      }
    });

    if (tierWithMembers && tierWithMembers._count.pelanggan > 0) {
      return NextResponse.json(
        { error: "Tidak bisa menghapus tier yang masih memiliki member" },
        { status: 400 }
      );
    }

    if (!tierWithMembers) {
      return NextResponse.json({ error: "Membership tier tidak ditemukan" }, { status: 404 });
    }

    await prisma.membership.delete({
      where: { tier_membership: tier_membership }
    });

    return NextResponse.json(
      { message: "Membership tier berhasil dihapus" },
      { status: 200 }
    );
  } catch (e: any) {
    if (e.code === 'P2025') {
      return NextResponse.json({ error: "Membership tier tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}