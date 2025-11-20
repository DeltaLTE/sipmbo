import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch all report data
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    // Get start and end dates from query, default to last 30 days
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : new Date();
    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : new Date(new Date().setDate(endDate.getDate() - 30));

    // --- 1. Fetch Laporan (Sales) Data ---
    const salesReports = await prisma.laporan.findMany({
      where: {
        tgl_laporan: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        tgl_laporan: 'asc',
      },
    });

    // --- 2. Fetch Customer & Membership Data ---
    // (This assumes you have a 'pelanggan' table as seen in your customer API)
    const totalCustomers = await prisma.pelanggan.count();
    
    // Example: Group customers by points to create membership tiers
    // This is an example, you might have a different way to store tiers
    const customers = await prisma.pelanggan.findMany({
      select: { total_poin: true }
    });

    const membershipData = [
      { name: 'Bronze', value: 0, color: '#92400e' },   // < 100 points
      { name: 'Silver', value: 0, color: '#9ca3af' },  // 100-499 points
      { name: 'Gold', value: 0, color: '#eab308' },    // 500-999 points
      { name: 'Platinum', value: 0, color: '#cbd5e1' }, // 1000+ points
    ];

    customers.forEach(customer => {
      const points = customer.total_poin || 0;
      if (points >= 1000) membershipData[3].value++;
      else if (points >= 500) membershipData[2].value++;
      else if (points >= 100) membershipData[1].value++;
      else membershipData[0].value++;
    });

    // --- 3. Process Data for Frontend ---

    // Calculate Total Revenue
    const totalRevenue = salesReports.reduce((acc, report) => {
      // Ensure total_penjualan is treated as a number
      const sales = Number(report.total_penjualan) || 0;
      return acc + sales;
    }, 0);

    // Format sales data for charts
    const salesData = salesReports.map(report => ({
      month: new Date(report.tgl_laporan!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sales: Number(report.total_penjualan) || 0,
      // You could add more data here if needed
    }));

    // Build stats object
    // Note: 'Points Redeemed' and 'Active Promotions' would require more tables (e.g., 'promosi')
    // I've substituted them with 'Total Laporan' for this example.
    const stats = [
      { title: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: 'DollarSign' },
      { title: 'Total Customers', value: totalCustomers.toLocaleString(), icon: 'Users' },
      { title: 'Total Laporan', value: salesReports.length, icon: 'Gift' }, // Replaced 'Points Redeemed'
      { title: 'Date Range', value: `${salesReports.length > 0 ? salesReports.length : 'N/A'} days`, icon: 'TrendingUp' }, // Replaced 'Active Promotions'
    ];

    // --- 4. Return Response ---
    return NextResponse.json({
      stats,
      salesData,
      membershipData,
    });

  } catch (e: any) {
    console.error('GET Reports Error:', e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}