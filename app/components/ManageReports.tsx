"use client"

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, } from 'recharts';
import { Download, RefreshCcw, Upload } from 'lucide-react'; 
import { Button } from './ui/button';
import { toast } from 'sonner';

// --- Types ---
interface SummaryData {
  revenue: number;
  customers: number;
  pointsRedeemed: number;
  activePromotions: number;
}

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  isLoading?: boolean;
}

// --- Components ---
const StatCard: React.FC<StatCardProps> = ({ title, value, change, isLoading }) => {
  return (
    <div className="bg-[#fcebed] p-5 rounded-lg shadow-sm">
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {isLoading ? (
        <div className="h-8 w-24 bg-gray-300 animate-pulse rounded mt-1"></div>
      ) : (
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      )}
      {change && <p className="text-sm mt-1 text-green-600">{change}</p>}
    </div>
  );
};

// Pie Chart Colors
const COLORS = ['#4a558a', '#f4aab9', '#70c1b3', '#FFBB28', '#FF8042'];

export default function ManageReports() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [lineData, setLineData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      
      if (res.ok) {
        setSummary(data.summary);
        setLineData(data.lineChartData);
        setBarData(data.barChartData);
        setPieData(data.pieChartData);
      } else {
        toast.error("Gagal memuat data laporan");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- CSV Import Handler (Transactions) ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      // CSV Logic: Expects "Date, Product, Quantity, Total, Payment"
      const lines = text.split('\n');
      const importData = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Skip header row
        if (i === 0 && (line.toLowerCase().includes('date') || line.toLowerCase().includes('product'))) {
          continue;
        }

        const parts = line.split(',');
        if (parts.length >= 4) {
          importData.push({
            date: parts[0].trim(),      // Date (YYYY-MM-DD)
            product: parts[1].trim(),   // Product Name
            quantity: parts[2].trim(),  // Quantity
            total: parts[3].trim(),     // Total Price
            payment: parts[4]?.trim() || 'Cash' // Payment Method
          });
        }
      }

      if (importData.length === 0) {
        toast.error("File CSV kosong atau format salah. Gunakan: Date, Product, Quantity, Total");
        return;
      }

      try {
        // Send to Import API
        const response = await fetch('/api/transactions/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(importData),
        });

        const result = await response.json();
        if (response.ok) {
          toast.success(result.message);
          fetchData(); // Refresh charts after import
        } else {
          toast.error(result.error || "Gagal import data");
        }
      } catch (error) {
        console.error(error);
        toast.error("Terjadi kesalahan saat import");
      }
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Export Functionality ---
  const downloadCSV = (data: any[], filename: string) => {
    if (!data || !data.length) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${filename}`);
  };

  // Formatting helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="min-h-screen bg-[#78a890]">
      <div className="max-w-7xl mx-auto px-8 py-6">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-white">Bolivar Cafe</h1>
          <div className="flex gap-2">
            
            {/* Refresh Button */}
            <Button onClick={fetchData} className="bg-white text-gray-800 hover:bg-gray-100 shadow-md" title="Refresh Data">
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            </Button>

            {/* Import Transactions Button */}
            <input 
              type="file" 
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-gray-700 hover:bg-gray-800 text-white shadow-md flex gap-2"
            >
              <Upload size={16} />
              Import Transactions
            </Button>

            {/* Export All Button */}
            <Button 
              onClick={() => downloadCSV(barData, 'monthly_revenue.csv')}
              className="bg-[#4a9fd9] hover:bg-[#3a8fc9] text-white shadow-md flex gap-2"
            >
              <Download size={16} />
              Export Revenue
            </Button>
          </div>
        </div>

        {/* --- Stat Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard 
            title="Total Revenue" 
            value={summary ? formatCurrency(summary.revenue) : "Rp 0"} 
            isLoading={loading}
          />
          <StatCard 
            title="Total Customers" 
            value={summary ? summary.customers.toString() : "0"} 
            isLoading={loading}
          />
          <StatCard 
            title="Points Redeemed" 
            value={summary ? summary.pointsRedeemed.toLocaleString() : "0"} 
            isLoading={loading}
          />
          <StatCard 
            title="Active Promotions" 
            value={summary ? summary.activePromotions.toString() : "0"} 
            isLoading={loading}
          />
        </div>

        {/* --- Charts Grid --- */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Line Chart: Daily Transactions */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Daily Transactions (Last 7 Days)</h3>
                <button onClick={() => downloadCSV(lineData, 'daily_transactions.csv')} className="text-gray-500 hover:text-gray-700">
                  <Download size={18} />
                </button>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" allowDecimals={false} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="transactions" 
                    stroke="#8884d8" 
                    strokeWidth={3} 
                    activeDot={{ r: 8 }} 
                    name="Transactions" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart: Membership Distribution */}
            <div className="bg-white rounded-lg shadow-lg p-6 relative">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-800">Membership Tiers</h3>
                <button onClick={() => downloadCSV(pieData, 'membership_distribution.csv')} className="text-gray-500 hover:text-gray-700">
                  <Download size={18} />
                </button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie 
                    data={pieData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={100} 
                    fill="#8884d8" 
                    paddingAngle={5} 
                    dataKey="value"
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart: Monthly Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Monthly Revenue (Current Year)</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => downloadCSV(barData, 'monthly_revenue.csv')}>
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    tickFormatter={(val) => new Intl.NumberFormat('en', { notation: 'compact' }).format(val)} 
                  />
                  <Tooltip 
                    formatter={(value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)}
                  />
                  <Legend />
                  <Bar dataKey="sales" name="Revenue (IDR)" fill="#4a558a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}