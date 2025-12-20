"use client"

import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Upload, Search, Trash2, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

// --- LOCAL SHADCN/UI Component Definitions (To ensure compilation) ---

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78A890] disabled:cursor-not-allowed disabled:opacity-50 ${props.className || ''}`}
  />
);

const Button = (props: React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: 'sm' | 'default', asChild?: boolean }) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78A890] disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ${props.size === 'sm' ? 'h-8 rounded-md px-3 text-xs' : 'h-10 px-4 py-2'} ${props.className || ''}`}
  >
    {props.children}
  </button>
);

const Label = (props: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    {...props}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${props.className || ''}`}
  >
    {props.children}
  </label>
);

const Card = ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`rounded-xl border bg-white shadow-sm ${className}`}>{children}</div>
);
const CardHeader = ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);
const CardTitle = ({ children, className }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`font-semibold leading-none tracking-tight text-lg ${className}`}>{children}</h3>
);
const CardContent = ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Dialog = ({ open, onOpenChange, children }: { open: boolean, onOpenChange: (open: boolean) => void, children: React.ReactNode }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center overflow-y-auto p-4">
      <div className="relative w-full max-w-xl mx-auto my-6">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`relative bg-white p-6 shadow-xl transition-all scale-100 opacity-100 rounded-lg ${className}`}
    {...props}
  >
    <button
      onClick={() => { /* Close logic is often external, but for completeness: */ }}
      className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#78A890] disabled:pointer-events-none"
    >
      <X className="h-4 w-4" />
    </button>
    {children}
  </div>
);

const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col space-y-1.5 text-center sm:text-left">
    {children}
  </div>
);

const DialogTitle = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h2>
);

const DialogFooter = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}>
    {children}
  </div>
);

// --- END Component Local Definitions ---


// --- TYPES ---
interface Transaction {
  id: number;
  date: string;
  product: string;
  quantity: number;
  total: number;
  payment: string;
}

interface SummaryData {
  revenue: number;
  customers: number;
  pointsRedeemed: number;
  activePromotions: number;
}

interface TransactionFormData {
  id_pelanggan: string; // For manual add
  id_produk: string;    // For manual add
  quantity: number;
  metode_pembayaran: string;
}

// Colors for Pie Chart
const COLORS = ['#4a558a', '#f4aab9', '#70c1b3', '#FFBB28', '#FF8042'];

// --- STAT CARD COMPONENT ---
const StatCard = ({ title, value, change, isLoading }: any) => (
  <div className="bg-[#fcebed] p-5 rounded-lg shadow-sm">
    <p className="text-sm font-medium text-gray-700">{title}</p>
    {isLoading ? <div className="h-8 w-24 bg-gray-300 animate-pulse rounded mt-1"></div> : <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>}
    {change && <p className="text-sm mt-1 text-green-600">{change}</p>}
  </div>
);

export default function ManageReports() {
  // --- STATES ---
  const [activeTab, setActiveTab] = useState('transactions'); // Optional if you wanted tabs
  const [loading, setLoading] = useState(true);

  // Data States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [lineData, setLineData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);

  // Search & Modal States
  const [searchQuery, setSearchQuery] = useState('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentTx, setCurrentTx] = useState<Transaction | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FETCH DATA ---
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Transactions List
      const txRes = await fetch(`/api/transactions?search=${searchQuery}`);
      const txData = await txRes.json();
      if (txRes.ok) setTransactions(txData.data || []);

      // 2. Fetch Report Stats
      const repRes = await fetch('/api/reports');
      const repData = await repRes.json();
      if (repRes.ok) {
        setSummary(repData.summary);
        setLineData(repData.lineChartData);
        setBarData(repData.barChartData);
        setPieData(repData.pieChartData);
      }
    } catch (error) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search for transactions
    const handler = setTimeout(() => {
      fetchAllData();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // --- HANDLERS ---

  // Import CSV
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 2) return toast.error("File CSV kosong.");

      // --- 1. Header Check against Prisma model fields ---
      const requiredPrismaFields = ["tanggal_transaksi", "nama_produk", "quantity", "total_harga"]; // Minimum required fields for a sensible transaction
      const expectedCsvHeaders = [...requiredPrismaFields, "metode_pembayaran", "status_pembayaran", "id_pelanggan", "id_produk"];

      const headerRow = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, '')); // Remove potential quotes

      const headerMap: { [key: string]: number | undefined } = {};
      headerRow.forEach((h, index) => {
        // Map index using includes for robust matching (e.g., 'id_pelanggan' matches 'id_pelanggan')
        if (expectedCsvHeaders.includes(h)) {
          headerMap[h] = index;
        }
      });

      // Check if minimum required fields are present
      const missingRequiredHeaders = requiredPrismaFields.filter(field => headerMap[field] === undefined);

      if (missingRequiredHeaders.length > 0) {
        toast.error(`Format Salah! Header CSV harus memiliki bidang minimal: ${requiredPrismaFields.join(', ')}.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const importData = [];
      for (let i = 1; i < lines.length; i++) {
        // Split row by comma. This is the simplest CSV parser.
        const parts = lines[i].split(',').map(p => p.trim().replace(/"/g, ''));

        // Helper to get trimmed value safely
        const getValue = (key: string, defaultValue: string = '') =>
          (headerMap[key] !== undefined && parts[headerMap[key]] !== undefined) ? parts[headerMap[key]] : defaultValue;

        // Check if the row contains enough data (simple count check)
        if (parts.length < requiredPrismaFields.length) {
          console.warn(`Skipping row ${i + 1}: Not enough columns.`);
          continue; // Skip malformed rows to prevent 400 error from empty array
        }

        const txData = {
          // Note: We send all non-ID fields as strings; the backend (route.ts) handles the conversion (Decimal, Int, Date)
          tanggal_transaksi: getValue('tanggal_transaksi', new Date().toISOString()),
          nama_produk: getValue('nama_produk', 'Produk Tidak Dikenal'),
          quantity: getValue('quantity', '1'),
          total_harga: getValue('total_harga', '0'),
          metode_pembayaran: getValue('metode_pembayaran', 'Tunai'),
          status_pembayaran: getValue('status_pembayaran', 'Lunas'),
        };

        // Include PADDED ID fields if they exist in the CSV headers
        if (headerMap['id_pelanggan'] !== undefined) {
          // We use the string ID format based on previous user input (e.g., '00000001')
          // This assumes the ID field in DB is VARCHAR/CHAR and requires padding for FK checks.
          (txData as any).id_pelanggan = getValue('id_pelanggan');
        }
        if (headerMap['id_produk'] !== undefined) {
          (txData as any).id_produk = getValue('id_produk');
        }

        importData.push(txData);
      } // End of rows loop

      // Check final array size before posting
      if (importData.length === 0) {
        toast.error("Tidak ada data valid yang ditemukan untuk diimport.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return; // Prevent sending empty body, which causes a 400 error
      }


      try {
        // API route is /api/transactions/import
        const response = await fetch('/api/transactions/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(importData),
        });
        const result = await response.json();

        if (response.ok) {
          if (result.count > 0) {
            toast.success(result.message);
          } else {
            toast.success(result.message || `Import berhasil, tetapi ${importData.length} baris mungkin duplikat.`);
          }
          fetchAllData();
        } else {
          // Failure response from API (400, 500 etc.)
          toast.error(result.error || `Gagal mengimport data. Status: ${response.status}`);
        }
      } catch (error) {
        console.error("Fetch error during import:", error);
        toast.error("Error importing: Koneksi terputus.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Delete Transaction
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Transaksi dihapus");
        fetchAllData();
      } else {
        toast.error("Gagal menghapus");
      }
    } catch (e) { toast.error("Error deleting"); }
  };

  // View Details
  const openView = (tx: Transaction) => {
    setCurrentTx(tx);
    setIsViewModalOpen(true);
  };

  // Export CSV Helper
const handleExportPDF = async () => {
    if (!summary || transactions.length === 0) {
      toast.error("Data belum siap untuk diexport.");
      return;
    }
    
    const toastId = toast.loading("Sedang membuat PDF..."); // Show loading state

    try {
      const doc = new jsPDF('p', 'mm', 'a4'); // Portrait, Millimeters, A4
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // --- 1. HEADER ---
      doc.setFontSize(22);
      doc.setTextColor(74, 155, 136); // Your Brand Green (#4a9b88)
      doc.setFont("helvetica", "bold");
      doc.text("Laporan Kafe Bolivar", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 26);

      // --- 2. SUMMARY CARDS (Vector Graphics) ---
      // We draw these manually so they look crisp (not blurry screenshots)
      const startY = 35;
      const cardWidth = 42;
      const cardHeight = 28;
      const gap = 6;
      let currentX = 14;

      const cards = [
        { title: "Total Revenue", value: formatCurrency(summary.revenue) },
        { title: "Total Customers", value: summary.customers.toString() },
        { title: "Points Redeemed", value: summary.pointsRedeemed.toLocaleString() },
        { title: "Active Promos", value: summary.activePromotions.toString() },
      ];

      cards.forEach((card) => {
        // Card Background (Pinkish #fcebed -> RGB: 252, 235, 237)
        doc.setFillColor(252, 235, 237);
        doc.setDrawColor(252, 235, 237); // No border outline
        doc.roundedRect(currentX, startY, cardWidth, cardHeight, 3, 3, 'F');

        // Card Title
        doc.setTextColor(100);
        doc.setFontSize(9);
        doc.text(card.title, currentX + 4, startY + 8);

        // Card Value
        doc.setTextColor(0); // Black
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(card.value, currentX + 4, startY + 19);

        currentX += cardWidth + gap;
      });

      // --- 3. CHARTS (Screenshots) ---
      let chartY = startY + cardHeight + 10;
      
      // Helper to capture chart
      const captureChart = async (elementId: string) => {
        const element = document.getElementById(elementId);
        if (!element) return null;
        return await html2canvas(element, { scale: 2 }); // Scale 2 for higher quality
      };

      // Capture Top Row (Line + Pie)
      const lineCanvas = await captureChart('report-line-chart');
      const pieCanvas = await captureChart('report-pie-chart');
      const barCanvas = await captureChart('report-bar-chart');

      // Add Line Chart (Left)
      if (lineCanvas) {
        const imgData = lineCanvas.toDataURL('image/png');
        // Fit width: approx 110mm
        doc.addImage(imgData, 'PNG', 14, chartY, 110, 60); 
      }

      // Add Pie Chart (Right)
      if (pieCanvas) {
        const imgData = pieCanvas.toDataURL('image/png');
        // Fit remaining width: approx 65mm
        doc.addImage(imgData, 'PNG', 130, chartY, 65, 60); 
      }

      chartY += 65; // Move down

      // Add Bar Chart (Full Width)
      if (barCanvas) {
        const imgData = barCanvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 14, chartY, 180, 60);
      }
      
      chartY += 65; // Move down for Table

      // --- 4. DATA TABLE ---
      // If we are too close to bottom, add new page
      if (chartY > 250) {
        doc.addPage();
        chartY = 20;
      } else {
        doc.text("Detail Transaksi:", 14, chartY + 5);
        chartY += 10;
      }

      const tableRows = transactions.map(t => [
        new Date(t.date).toLocaleDateString('id-ID'),
        t.product,
        t.quantity,
        formatCurrency(t.total),
        t.payment
      ]);

      autoTable(doc, {
        head: [["Tanggal", "Produk", "Qty", "Total", "Metode"]],
        body: tableRows,
        startY: chartY,
        theme: 'grid',
        headStyles: { fillColor: [74, 155, 136] }, // Green
        styles: { fontSize: 8 },
        didDrawPage: (data) => {
            // Add page numbers
            doc.setFontSize(8);
            doc.text("Page " + doc.getNumberOfPages(), pageWidth - 20, pageHeight - 10);
        }
      });

      // Save
      doc.save(`Laporan_Lengkap_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.dismiss(toastId);
      toast.success("Laporan lengkap berhasil didownload!");

    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error("Gagal membuat PDF");
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen bg-[#78a890]">
      <div className="max-w-7xl mx-auto px-8 py-6">

        {/* HEADER & ACTIONS */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-4xl font-bold text-white">Management & Reports</h1>

          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-white/90 border-none"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>

            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <Button onClick={() => fileInputRef.current?.click()} className="bg-gray-800 text-white hover:bg-gray-900 gap-2">
              <Upload size={16} /> Import
            </Button>

            <Button
              onClick={handleExportPDF} // <--- Changed from downloadCSV to handleExportPDF
              className="bg-[#e74c3c] hover:bg-[#c0392b] text-white gap-2" // Changed color to Red (standard for PDF)
            >
              <Download size={16} /> Export Report
            </Button>
          </div>
        </div>

        {/* --- SECTION 1: TRANSACTIONS TABLE --- */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="bg-white text-[#78a890] px-3 py-1 rounded text-sm">1</span> Transaction History
          </h2>

          <div className="bg-[#e8e8e8] rounded-lg shadow-lg overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="min-w-full">
                <thead className="bg-[#d4d4d4] sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left font-bold text-gray-800">Date</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-800">Product</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-800">Qty</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-800">Total</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-800">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {loading && transactions.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                  ) : transactions.map((t) => (
                    <tr key={t.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium">{t.product}</td>
                      <td className="px-6 py-4">{t.quantity}</td>
                      <td className="px-6 py-4">{formatCurrency(t.total)}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <Button size="sm" onClick={() => openView(t)} className="bg-[#4a9fd9] text-white px-3 h-8">Tampil</Button>
                        <Button size="sm" onClick={() => handleDelete(t.id)} className="bg-[#e74c3c] text-white px-3 h-8"><Trash2 size={14} /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* --- SECTION 2: REPORTS DASHBOARD --- */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="bg-white text-[#78a890] px-3 py-1 rounded text-sm">2</span> Analytics Dashboard
          </h2>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard title="Total Revenue" value={summary ? formatCurrency(summary.revenue) : "Rp 0"} isLoading={loading} />
            <StatCard title="Total Customers" value={summary ? summary.customers.toString() : "0"} isLoading={loading} />
            <StatCard title="Points Redeemed" value={summary ? summary.pointsRedeemed.toLocaleString() : "0"} isLoading={loading} />
            <StatCard title="Active Promotions" value={summary ? summary.activePromotions.toString() : "0"} isLoading={loading} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div id="report-line-chart" className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Daily Transactions (Last 7 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="transactions" stroke="#8884d8" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div id="report-pie-chart" className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Membership Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" paddingAngle={5} dataKey="value" label>
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <Card id="report-bar-chart" className="lg:col-span-3">
              <CardHeader><CardTitle>Monthly Revenue (Current Year)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(val) => new Intl.NumberFormat('en', { notation: 'compact' }).format(val)} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="sales" fill="#4a558a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* --- VIEW MODAL --- */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-md bg-[#78A890] text-white border-none">
            <DialogHeader><DialogTitle className="font-serif text-2xl">Detail Transaksi</DialogTitle></DialogHeader>
            {currentTx && (
              <div className="space-y-4 py-4">
                <div><Label className="text-white">Tanggal</Label><div className="bg-white text-black p-2 rounded mt-1">{new Date(currentTx.date).toLocaleDateString()}</div></div>
                <div><Label className="text-white">Produk</Label><div className="bg-white text-black p-2 rounded mt-1">{currentTx.product}</div></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-white">Qty</Label><div className="bg-white text-black p-2 rounded mt-1">{currentTx.quantity}</div></div>
                  <div><Label className="text-white">Total</Label><div className="bg-white text-black p-2 rounded mt-1">{formatCurrency(currentTx.total)}</div></div>
                </div>
                <div><Label className="text-white">Pembayaran</Label><div className="bg-white text-black p-2 rounded mt-1">{currentTx.payment}</div></div>
              </div>
            )}
            <DialogFooter><Button onClick={() => setIsViewModalOpen(false)} className="bg-red-600 hover:bg-red-700 text-white w-full">Tutup</Button></DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}