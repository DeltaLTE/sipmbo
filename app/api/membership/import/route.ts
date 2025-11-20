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

    // We use Promise.all to handle the Decimal conversion for each item
    // createMany is supported, but we need to map the fields carefully
    const result = await prisma.membership.createMany({
      data: body.map((item: any) => ({
        tier_membership: item.tier_membership, // Unique ID/Name
        required_point: parseInt(item.required_point, 10),
        diskon: new Decimal(item.diskon)
      })),
      skipDuplicates: true, // Skip if tier name already exists
    });

    return NextResponse.json(
      { message: `Berhasil mengimport ${result.count} tier membership`, count: result.count },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("Import error:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}