import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ error: "Data import harus array dan tidak boleh kosong" }, { status: 400 });
    }

    // --- STRICT VALIDATION ---
    // Check if every item in the array has the required fields.
    // If even one row is missing 'nama_reward', reject the whole batch.
    const isValid = body.every((item: any) => 
      item.nama_reward && 
      item.nama_reward.trim() !== "" && 
      item.points_required !== undefined &&
      item.stok !== undefined
    );

    if (!isValid) {
      // Log Failure
      await prisma.import_history.create({
        data: { type: "Points", count: 0, status: "Failed", filename: "Invalid CSV Structure" }
      });
      return NextResponse.json({ error: "Format data salah. Pastikan kolom Nama, Points, dan Stok terisi." }, { status: 400 });
    }

    const result = await prisma.poin.createMany({
      data: body.map((item: any) => ({
        nama_reward: item.nama_reward,
        points_required: parseInt(item.points_required, 10),
        stok: parseInt(item.stok, 10)
      })),
      skipDuplicates: true,
    });

    // Log Success
    await prisma.import_history.create({
      data: { type: "Points", count: result.count, status: "Success", filename: "CSV Import" }
    });

    return NextResponse.json(
      { message: `Berhasil mengimport ${result.count} rewards`, count: result.count },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("Import error:", e);
    await prisma.import_history.create({
      data: { type: "Points", count: 0, status: "Failed", filename: "Server Error" }
    });
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}