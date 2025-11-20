"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, } from 'recharts';
import { MoreVertical, Download } from 'lucide-react'; // Added Download icon
import { Button } from './ui/button'; // Assuming you have this
import { toast } from 'sonner';

// --- Reusable Stat Card Component ---
interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeType }) => {
  const changeColor = changeType === 'positive' ? 'text-green-600' : 'text-red-600';
  
  return (
    <div className="bg-[#fcebed] p-5 rounded-lg shadow-sm">
      <p className="text-sm font-medium text-gray-700">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      <p className={`text-sm mt-1 ${changeColor}`}>
        {change}
      </p>
    </div>
  );
};

// --- Data for Charts ---
const lineChartData = [
  { name: '2', uv: 580, pv: 400 },
  { name: '4', uv: 400, pv: 300 },
  { name: '6', uv: 500, pv: 480 },
  { name: '8', uv: 300, pv: 280 },
  { name: '10', uv: 410, pv: 510 },
  { name: '12', uv: 620, pv: 350 },
  { name: '14', uv: 580, pv: 600 },
  { name: '16', uv: 400, pv: 420 },
  { name: '18', uv: 380, pv: 500 },
  { name: '20', uv: 550, pv: 480 },
];

const pieChartData = [
  { name: '860 send', value: 45 },
  { name: '730 open', value: 45 },
  { name: '234 spam', value: 10 },
];
const COLORS = ['#4a558a', '#f4aab9', '#70c1b3'];

const barChartData = [
  { month: 'Jan', sales: 4000 },
  { month: 'Feb', sales: 3000 },
  { month: 'Mar', sales: 5000 },
  { month: 'Apr', sales: 4500 },
  { month: 'May', sales: 6000 },
  { month: 'Jun', sales: 5500 },
];

export default function ManageReports() {

  // --- Export Functionality ---
  const downloadCSV = (data: any[], filename: string) => {
    if (!data || !data.length) return;
    
    // Extract headers
    const headers = Object.keys(data[0]).join(',');
    
    // Extract rows
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    
    // Combine
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${filename}`);
  };

  return (
    <div className="min-h-screen bg-[#78a890]">
      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-white">Bolivar Cafe</h1>
          {/* Global Export Button */}
          <Button 
            onClick={() => downloadCSV(barChartData, 'all_revenue_data.csv')}
            className="bg-[#4a9fd9] hover:bg-[#3a8fc9] text-white shadow-md flex gap-2"
          >
            <Download size={16} />
            Export All Reports
          </Button>
        </div>

        {/* --- Stat Cards Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard title="Total Revenue" value="$28,000" change="+12,5% from last month" changeType="positive" />
          <StatCard title="Total Customers" value="1,885" change="+8,2% from last month" changeType="positive" />
          <StatCard title="Points Redeemed" value="23,450" change="+15,3% from last month" changeType="positive" />
          <StatCard title="Active Promotions" value="8" change="+2 from last month" changeType="positive" />
        </div>

        {/* --- Charts Grid --- */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Line Chart */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Traffic Overview</h3>
                <button onClick={() => downloadCSV(lineChartData, 'traffic_data.csv')} className="text-gray-500 hover:text-gray-700">
                  <Download size={18} />
                </button>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip />
                  <Line type="monotone" dataKey="pv" stroke="#8884d8" strokeWidth={3} activeDot={{ r: 8 }} name="Page Views" />
                  <Line type="monotone" dataKey="uv" stroke="#b0c4de" strokeWidth={3} strokeDasharray="5 5" name="Unique Visitors" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="bg-white rounded-lg shadow-lg p-6 relative">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-800">Email Stats</h3>
                <button onClick={() => downloadCSV(pieChartData, 'email_stats.csv')} className="text-gray-500 hover:text-gray-700">
                  <Download size={18} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">March 2020</p>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" paddingAngle={5} dataKey="value">
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Revenue Breakdown</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => downloadCSV(barChartData, 'revenue_data.csv')}>
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#4a558a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}