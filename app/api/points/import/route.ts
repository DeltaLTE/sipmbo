import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ error: "Data import harus array dan tidak boleh kosong" }, { status: 400 });
    }

    // --- 1. STRICT DATA VALIDATION ---
    const isValid = body.every((item: any) => 
      item.nama_reward && 
      typeof item.nama_reward === 'string' &&
      item.nama_reward.trim() !== "" && 
      item.points_required !== undefined &&
      item.stok !== undefined
    );

    if (!isValid) {
      await prisma.import_history.create({
        data: { type: "Points", count: 0, status: "Failed", filename: "Invalid Data Structure" }
      });
      return NextResponse.json({ error: "Format data salah. Pastikan kolom Nama, Points, dan Stok valid." }, { status: 400 });
    }

    // --- 2. DUPLICATE CHECKING LOGIC ---
    // Since 'nama_reward' is not unique in the DB schema, 'skipDuplicates' won't work automatically.
    // We must filter them manually.
    
    // Get all new names from the upload
    const incomingNames = body.map((item: any) => item.nama_reward);

    // Find which of these names already exist in the database
    const existingRewards = await prisma.poin.findMany({
      where: {
        nama_reward: {
          in: incomingNames
        }
      },
      select: { nama_reward: true }
    });

    // Create a Set of existing names for fast lookup (normalize to lowercase to prevent 'Payung' vs 'payung')
    const existingSet = new Set(existingRewards.map(r => r.nama_reward?.toLowerCase()));

    // Filter the body: keep only items where the name is NOT in the existing set
    const finalDataToInsert = body.filter((item: any) => 
      !existingSet.has(item.nama_reward.toLowerCase())
    ).map((item: any) => ({
      nama_reward: item.nama_reward,
      points_required: parseInt(item.points_required, 10),
      stok: parseInt(item.stok, 10)
    }));

    // --- 3. EXECUTE INSERT ---
    let resultCount = 0;
    
    if (finalDataToInsert.length > 0) {
      const result = await prisma.poin.createMany({
        data: finalDataToInsert,
        // skipDuplicates is kept true just in case, but our manual filter does the heavy lifting
        skipDuplicates: true, 
      });
      resultCount = result.count;
    }

    const skippedCount = body.length - finalDataToInsert.length;

    // Log History
    await prisma.import_history.create({
      data: { 
        type: "Points", 
        count: resultCount, 
        status: "Success", 
        filename: `CSV Import (${skippedCount} skipped)` 
      }
    });

    return NextResponse.json(
      { 
        message: `Berhasil import ${resultCount} data. (${skippedCount} data duplikat dilewati).`, 
        count: resultCount,
        skipped: skippedCount 
      },
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