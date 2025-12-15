"use client";

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { toast } from 'sonner';
import { Upload, Search, Eye } from 'lucide-react'; // Added Eye icon

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
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); // New View State
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
        setCustomers(result.data || []);
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

  // --- STRICT CSV IMPORT HANDLER ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      // 1. Detect Delimiter (Auto-detect Comma or Semicolon)
      const firstLine = text.split('\n')[0];
      const delimiter = firstLine.includes(';') ? ';' : ',';

      // 2. Split lines and remove empty ones
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 2) {
        toast.error("File CSV kosong or invalid.");
        return;
      }

      // 3. Header Validation (Flexible)
      const headerRow = lines[0].toLowerCase();
      // Allow "name" OR "nama", "phone" OR "hp" to be user-friendly
      const validHeaders = 
        (headerRow.includes("name") || headerRow.includes("nama")) &&
        (headerRow.includes("email"));

      if (!validHeaders) {
        toast.error("Format Header Salah! Harap gunakan: Name, Email, Phone, Points");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return; 
      }

      // 4. Parse CSV to JSON (The "Translation" Step)
      const importData = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(delimiter); // Use detected delimiter
        
        // Ensure we have at least Name and Email
        if (parts.length >= 2) {
          const clean = (str: string) => str ? str.replace(/^"|"$/g, '').trim() : '';

          // Create the object exactly as your route.ts expects it
          importData.push({
            name: clean(parts[0]),
            email: clean(parts[1]),
            phone: parts[2] ? clean(parts[2]) : '',
            points: parts[3] ? parseInt(clean(parts[3])) || 0 : 0
          });
        }
      }

      // 5. Send JSON to Server
      try {
        const response = await fetch('/api/customer/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(importData), // Sending the translated JSON
        });

        const result = await response.json();
        
        if (response.ok) {
          // Success!
          toast.success(`Berhasil! ${result.count} data baru ditambahkan.`);
          // Refresh the list immediately
          fetchCustomers(debouncedSearchQuery);
          // Reset the file input
          if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
          // Handle backend validation errors (e.g., "Data tidak valid")
          toast.error(result.error || "Gagal import data");
        }
      } catch (error) {
        console.error(error);
        toast.error("Terjadi kesalahan koneksi server");
      }
    };

    reader.readAsText(file);
  };

  // --- Handlers ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Open View Modal (Tampil)
  const openModalForView = (customer: Customer) => {
    setCurrentCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      points: customer.points,
    });
    setIsViewModalOpen(true);
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
    setIsViewModalOpen(false); // Close View Modal
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

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
              <tr><td colSpan={6} className="text-center py-8 text-gray-500 text-sm">Memuat pelanggan...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500 text-sm">{debouncedSearchQuery ? 'Pelanggan tidak ditemukan.' : 'Tidak ada pelanggan.'}</td></tr>
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
                      {/* TAMPIL BUTTON */}
                      <Button
                        size="sm"
                        onClick={() => openModalForView(customer)}
                        className="bg-[#4a9fd9] hover:bg-[#3a8fc9] text-white text-xs px-4 py-1.5 h-auto rounded shadow"
                      >
                        Tampil
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openModalForEdit(customer)}
                        className="bg-[#6BBF4F] hover:bg-[#5aad41] text-white text-xs px-4 py-1.5 h-auto rounded shadow"
                      >
                        Ubah
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDelete(customer)}
                        className="bg-[#e74c3c] hover:bg-[#d73c2c] text-white text-xs px-4 py-1.5 h-auto rounded shadow"
                      >
                        Hapus
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- VIEW MODAL (TAMPIL) --- */}
      {/* FIXED: Changed sm:max-w-md to sm:max-w-lg to prevent content overflow */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-lg bg-[#78A890] text-white rounded-lg border-none">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Detail Pelanggan</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label className="text-white">Nama</Label><div className="bg-white text-black p-2 rounded mt-1">{formData.name}</div></div>
            <div><Label className="text-white">Email</Label><div className="bg-white text-black p-2 rounded mt-1">{formData.email}</div></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-white">No. HP</Label><div className="bg-white text-black p-2 rounded mt-1">{formData.phone}</div></div>
              <div><Label className="text-white">Total Poin</Label><div className="bg-white text-black p-2 rounded mt-1">{formData.points}</div></div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={closeModal} 
              className="bg-red-600 hover:bg-red-700 text-white w-full"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- ADD/EDIT MODAL --- */}
      {/* FIXED: Changed sm:max-w-md to sm:max-w-lg to prevent content overflow */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg bg-[#78A890] text-white rounded-lg border-none">
          <DialogHeader><DialogTitle className="font-serif text-2xl">{currentCustomer ? 'Edit' : 'Tambah'} Pelanggan</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div><Label className="text-white">Nama</Label><Input name="name" value={formData.name} onChange={handleInputChange} className="bg-white text-black" required /></div>
              <div><Label className="text-white">Email</Label><Input name="email" value={formData.email} onChange={handleInputChange} className="bg-white text-black" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-white">No. HP</Label><Input name="phone" value={formData.phone} onChange={handleInputChange} className="bg-white text-black" required /></div>
                <div><Label className="text-white">Poin</Label><Input type="number" name="points" value={formData.points} onChange={handleInputChange} className="bg-white text-black" min="0" /></div>
              </div>
            </div>
            <DialogFooter className="flex gap-2 pt-4"> {/* Increased gap and added padding top */}
              <Button type="submit" className="bg-black hover:bg-gray-800 text-white w-full sm:w-1/2">Simpan</Button> {/* Set button width on small screens */}
              <Button type="button" onClick={closeModal} className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-1/2">Batal</Button> {/* Set button width on small screens */}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}