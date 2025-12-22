import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();

    // 1. Basic Array Check
    if (!Array.isArray(rawBody) || rawBody.length === 0) {
      return NextResponse.json({ error: "Data is empty or not an array" }, { status: 400 });
    }

    const successfulRows = [];
    const failedRows = [];

    // 2. Process Row by Row (Permissive Mode)
    for (const [index, item] of rawBody.entries()) {
      // Step A: Flexible Key Finding (Finds 'points' or 'Points Required')
      // This helper looks for values even if casing is wrong
      const findVal = (keys: string[]) => {
        const itemKeys = Object.keys(item).map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
        for (const k of keys) {
            const idx = itemKeys.indexOf(k);
            if (idx !== -1) return item[Object.keys(item)[idx]];
        }
        return undefined;
      };

      const nama = findVal(['namareward', 'nama', 'reward', 'name']);
      const pointsRaw = findVal(['pointsrequired', 'points', 'point', 'required']);
      const stokRaw = findVal(['stok', 'stock', 'qty', 'quantity']);

      // Step B: Skip obviously invalid rows (like empty rows or header rows)
      if (!nama || nama.toString().toLowerCase().includes("nama_reward")) {
        failedRows.push({ index, reason: "Empty row or Header row detected", data: item });
        continue;
      }

      // Step C: Safe Number Parsing
      const points = parseInt(pointsRaw, 10);
      const stok = parseInt(stokRaw, 10);

      if (isNaN(points) || isNaN(stok)) {
        failedRows.push({ index, reason: "Points or Stok is not a number", data: item });
        continue;
      }

      successfulRows.push({
        nama_reward: String(nama).trim(),
        points_required: points,
        stok: stok
      });
    }

    if (successfulRows.length === 0) {
      return NextResponse.json({ 
        error: "No valid rows found to import.", 
        details: failedRows 
      }, { status: 400 });
    }

    // 3. Database Insert
    // We use createMany to insert all good rows at once
    const result = await prisma.poin.createMany({
      data: successfulRows,
      skipDuplicates: true, 
    });

    // 4. Return Report
    return NextResponse.json({ 
      message: "Import processing complete",
      inserted: result.count,
      failed: failedRows.length,
      failedDetails: failedRows // Check this in your Network tab to see what failed!
    }, { status: 201 });

  } catch (e: any) {
    console.error("Server Error:", e);
    return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
  }
}