"use client";

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';
import { Upload } from 'lucide-react'; // Added Upload icon

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  points: number;
}

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  points: number | string;
}

const initialFormData: CustomerFormData = {
  name: '',
  email: '',
  phone: '',
  points: 0,
};

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // File Input Ref for Import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch customers from API
  const fetchCustomers = async (search = '') => {
    try {
      setLoading(true);
      const url = search 
        ? `/api/customer?search=${encodeURIComponent(search)}`
        : '/api/customer';
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (response.ok) {
        setCustomers(result.data || []); // Ensure it falls back to empty array
      } else {
        toast.error(result.error || 'Failed to fetch customers');
      }
    } catch (error) {
      toast.error('Error fetching customers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  // --- CSV Import Handler ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      // CSV Logic: Expects "Name, Email, Phone, Points"
      const lines = text.split('\n');
      const importData = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Skip header row if detected
        if (i === 0 && (line.toLowerCase().includes('name') || line.toLowerCase().includes('email'))) {
          continue;
        }

        const parts = line.split(',');
        // We need at least Name and Email (first 2 columns)
        if (parts.length >= 2) {
          importData.push({
            name: parts[0].trim(),
            email: parts[1].trim(),
            phone: parts[2] ? parts[2].trim() : '',
            points: parts[3] ? parseInt(parts[3].trim()) : 0
          });
        }
      }

      if (importData.length === 0) {
        toast.error("File CSV kosong atau format salah. Gunakan: Name, Email, Phone, Points");
        return;
      }

      try {
        const response = await fetch('/api/customer/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(importData),
        });

        const result = await response.json();
        if (response.ok) {
          toast.success(result.message);
          fetchCustomers(debouncedSearchQuery);
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

  // --- Standard Handlers ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModalForAdd = () => {
    setCurrentCustomer(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openModalForEdit = (customer: Customer) => {
    setCurrentCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      points: customer.points,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCustomer(null);
    setFormData(initialFormData);
    setIsSaving(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const pointsAsNumber = Number(formData.points);
    if (isNaN(pointsAsNumber)) {
      toast.error("Points harus berupa angka yang valid.");
      setIsSaving(false);
      return;
    }

    const payload = {
      ...formData,
      points: pointsAsNumber,
      id: currentCustomer?.id,
    };

    try {
      const response = await fetch('/api/customer', {
        method: currentCustomer ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(currentCustomer ? 'Pelanggan berhasil diupdate' : 'Pelanggan berhasil ditambahkan');
        closeModal();
        fetchCustomers(debouncedSearchQuery);
      } else {
        toast.error(result.error || 'Gagal menyimpan pelanggan');
      }
    } catch (error) {
      toast.error('Error menyimpan pelanggan');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${customer.name}?`)) {
      return;
    }

    setDeletingId(customer.id);
    try {
      const response = await fetch(`/api/customer?id=${customer.id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success('Pelanggan berhasil dihapus');
        setCustomers(prev => prev.filter(c => c.id !== customer.id));
      } else {
        toast.error(result.error || 'Gagal menghapus pelanggan');
      }
    } catch (error) {
      toast.error('Error menghapus pelanggan');
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-6">
      
      {/* Title and Action Buttons Row */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Bolivar Cafe</h1>
        <div className="flex gap-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-56 bg-white border-none rounded text-sm"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Import Button */}
          <input 
            type="file" 
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-700 hover:bg-gray-900 text-white px-5 py-2 rounded text-sm font-medium shadow-md flex items-center gap-2"
          >
            <Upload size={16} />
            Import CSV
          </Button>

          <Button
            onClick={openModalForAdd}
            className="bg-[#4a9fd9] hover:bg-[#3a8fc9] text-white px-5 py-2 rounded text-sm font-medium shadow-md"
          >
            + Tambah Pelanggan
          </Button>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-[#e8e8e8] rounded-lg shadow-lg overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-[#d4d4d4]">
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">ID Pelanggan</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Nama</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Email</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">No. HP</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Total Poin</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500 text-sm">
                  Memuat pelanggan...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500 text-sm">
                  {debouncedSearchQuery ? 'Pelanggan tidak ditemukan.' : 'Tidak ada pelanggan.'}
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">{customer.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{customer.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{customer.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{customer.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{customer.points}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => openModalForEdit(customer)}
                        className="bg-[#4a9fd9] hover:bg-[#3a8fc9] text-white text-xs px-4 py-1.5 h-auto rounded shadow"
                        disabled={deletingId === customer.id}
                      >
                        Ubah
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDelete(customer)}
                        className="bg-[#e74c3c] hover:bg-[#d73c2c] text-white text-xs px-4 py-1.5 h-auto rounded shadow"
                        disabled={deletingId === customer.id}
                      >
                        {deletingId === customer.id ? 'Menghapus...' : 'Hapus'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 bg-black bg-opacity-50">
            <div className="relative bg-white rounded-2xl shadow-2xl transform transition-all w-full max-w-md">
              
              {/* Modal Header */}
              <div className="bg-[#4a9b88] text-white px-6 py-4 rounded-t-2xl relative">
                <h3 className="text-lg font-semibold text-center">
                  {currentCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
                </h3>
                <button 
                  onClick={closeModal}
                  className="absolute right-4 top-4 text-white hover:text-gray-200"
                  disabled={isSaving}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="px-6 py-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nama <span className="text-red-500">*</span>
                      </label>
                      <Input
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                        placeholder="Masukkan nama"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                        placeholder="email@example.com"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        No. HP <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-1">
                        Total Poin
                      </label>
                      <Input
                        type="number"
                        name="points"
                        id="points"
                        value={formData.points}
                        onChange={handleInputChange}
                        min="0"
                        placeholder="0"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex gap-3">
                  <Button
                    type="button"
                    onClick={closeModal}
                    disabled={isSaving}
                    className="flex-1 bg-gray-700 hover:bg-gray-800 text-white"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className={`flex-1 bg-red-500 hover:bg-red-600 text-white ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}