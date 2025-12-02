import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // --- 1. Summary Cards Data ---
    
    // Revenue: Sum of all transaction totals
    const totalRevenueAgg = await prisma.transaksi.aggregate({
      _sum: { total_harga: true },
    });
    
    // Customers: Count total customers
    const totalCustomers = await prisma.pelanggan.count();
    
    // Active Promotions: Count notifications (or use your promotion logic)
    const totalPromotions = await prisma.notifikasi.count();

    // Points Redeemed: Calculate based on products sold that have a point cost
    const pointsTransactions = await prisma.transaksi.findMany({
      include: { produk: true },
      where: {
        produk: {
          poin_pertukaran: { gt: 0 } // Only products that cost points
        }
      }
    });
    
    const totalPointsRedeemed = pointsTransactions.reduce((acc, curr) => {
      const points = curr.produk?.poin_pertukaran || 0;
      const qty = curr.quantity || 0;
      return acc + (points * qty);
    }, 0);


    // --- 2. Line Chart: Daily Transactions (Last 7 Days) ---
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentTransactions = await prisma.transaksi.findMany({
      where: {
        tanggal_transaksi: { gte: sevenDaysAgo }
      },
      orderBy: { tanggal_transaksi: 'asc' }
    });

    const dailyMap = new Map<string, number>();
    recentTransactions.forEach(t => {
      if (t.tanggal_transaksi) {
        const day = new Date(t.tanggal_transaksi).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
      }
    });

    const lineChartData = Array.from(dailyMap.entries()).map(([name, value]) => ({
      name,
      transactions: value,
    }));


    // --- 3. Bar Chart: Monthly Revenue (Current Year) ---
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    const yearlyTransactions = await prisma.transaksi.findMany({
      where: {
        tanggal_transaksi: {
          gte: startOfYear,
          lte: endOfYear
        }
      }
    });

    const monthlyMap = new Map<string, number>();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    monthNames.forEach(m => monthlyMap.set(m, 0)); // Init 0

    yearlyTransactions.forEach(t => {
      if (t.tanggal_transaksi && t.total_harga) {
        const monthIndex = new Date(t.tanggal_transaksi).getMonth();
        const monthName = monthNames[monthIndex];
        const amount = Number(t.total_harga);
        monthlyMap.set(monthName, (monthlyMap.get(monthName) || 0) + amount);
      }
    });

    const barChartData = Array.from(monthlyMap.entries()).map(([month, sales]) => ({
      month,
      sales
    }));


    // --- 4. Pie Chart: Membership Distribution ---
    const membershipGroups = await prisma.pelanggan.groupBy({
      by: ['tier_membership'],
      _count: {
        tier_membership: true
      }
    });

    const pieChartData = membershipGroups.map(group => ({
      name: group.tier_membership || 'No Tier',
      value: group._count.tier_membership
    }));


    // --- Return Data Matching Frontend Interface ---
    return NextResponse.json({
      summary: {
        revenue: Number(totalRevenueAgg._sum.total_harga) || 0,
        customers: totalCustomers,
        pointsRedeemed: totalPointsRedeemed,
        activePromotions: totalPromotions
      },
      lineChartData,
      barChartData,
      pieChartData
    });

  } catch (e: any) {
    console.error("Reports API Error:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}