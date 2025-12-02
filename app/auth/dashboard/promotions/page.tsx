"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { toast } from 'sonner';
import { Search, Upload } from 'lucide-react'; // Added Upload

// --- Types ---
interface Notifikasi {
  id_pesan: number;
  id_pelanggan: number | null;
  pesan: string | null;
  pelanggan: {
    nama_pelanggan: string | null;
  } | null;
}

interface Pelanggan {
  id_pelanggan: number;
  nama_pelanggan: string | null;
}

interface NotifikasiFormData {
  id_pelanggan: string;
  pesan: string;
}

const initialFormData: NotifikasiFormData = {
  id_pelanggan: "",
  pesan: '',
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

export default function NotifikasiPage() {
  const [notifikasiList, setNotifikasiList] = useState<Notifikasi[]>([]);
  const [pelangganList, setPelangganList] = useState<Pelanggan[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNotifikasi, setCurrentNotifikasi] = useState<Notifikasi | null>(null);
  const [formData, setFormData] = useState<NotifikasiFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // File Input Ref for Import
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modalTitle = useMemo(() => 
    currentNotifikasi ? 'Edit Notifikasi' : 'Tambah Notifikasi Baru',
    [currentNotifikasi]
  );

  // --- Data Fetching ---

  const fetchNotifikasi = async (search = '') => {
    try {
      setLoading(true);
      const url = search 
        ? `/api/notifikasi?search=${encodeURIComponent(search)}`
        : '/api/notifikasi';
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (response.ok) {
        setNotifikasiList(result);
      } else {
        toast.error(result.error || 'Failed to fetch notifications');
      }
    } catch (error) {
      toast.error('Error fetching notifications');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPelanggan = async () => {
    try {
      const response = await fetch('/api/pelanggan'); 
      const result = await response.json();
      if (response.ok && result.data) {
        setPelangganList(result.data);
      } 
    } catch (error) {
      console.error('Error fetching customers for dropdown', error);
    }
  };

  useEffect(() => {
    fetchNotifikasi(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  useEffect(() => {
    fetchPelanggan();
  }, []);

  // --- CSV Import Handler ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      // CSV Logic: Expects "Customer ID, Message"
      // If Customer ID is empty, it's treated as null (Broadcast)
      const lines = text.split('\n');
      const importData = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Skip header row
        if (i === 0 && (line.toLowerCase().includes('message') || line.toLowerCase().includes('pesan'))) {
          continue;
        }

        const parts = line.split(',');
        // We need at least the Message (2nd column)
        if (parts.length >= 2) {
          const idStr = parts[0].trim();
          const messageStr = parts.slice(1).join(',').trim(); // Join rest in case message has commas

          importData.push({
            id_pelanggan: idStr ? parseInt(idStr) : null,
            pesan: messageStr
          });
        }
      }

      if (importData.length === 0) {
        toast.error("File CSV kosong atau format salah. Gunakan: ID Pelanggan (Opsional), Pesan");
        return;
      }

      try {
        const response = await fetch('/api/notifikasi/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(importData),
        });

        const result = await response.json();
        if (response.ok) {
          toast.success(result.message);
          fetchNotifikasi(debouncedSearchQuery);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModalForAdd = () => {
    setCurrentNotifikasi(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openModalForEdit = (notifikasi: Notifikasi) => {
    setCurrentNotifikasi(notifikasi);
    setFormData({
      pesan: notifikasi.pesan || '',
      id_pelanggan: notifikasi.id_pelanggan ? String(notifikasi.id_pelanggan) : "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentNotifikasi(null);
    setFormData(initialFormData);
    setIsSaving(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pesan) {
      toast.error("Pesan tidak boleh kosong.");
      return;
    }
    
    setIsSaving(true);

    const payload = {
      ...formData,
      id_pelanggan: formData.id_pelanggan ? parseInt(formData.id_pelanggan) : null,
      id_pesan: currentNotifikasi?.id_pesan,
    };

    try {
      const response = await fetch('/api/notifikasi', {
        method: currentNotifikasi ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(currentNotifikasi ? 'Notifikasi berhasil diupdate' : 'Notifikasi berhasil ditambahkan');
        closeModal();
        fetchNotifikasi(debouncedSearchQuery);
      } else {
        toast.error(result.error || 'Gagal menyimpan notifikasi');
      }
    } catch (error) {
      toast.error('Error menyimpan notifikasi');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (notifikasi: Notifikasi) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus notifikasi ini?`)) {
      return;
    }

    setDeletingId(notifikasi.id_pesan);
    try {
      const response = await fetch(`/api/notifikasi?id_pesan=${notifikasi.id_pesan}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success('Notifikasi berhasil dihapus');
        setNotifikasiList(prev => prev.filter(n => n.id_pesan !== notifikasi.id_pesan));
      } else {
        toast.error(result.error || 'Gagal menghapus notifikasi');
      }
    } catch (error) {
      toast.error('Error menghapus notifikasi');
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#78a890]">
      <div className="max-w-7xl mx-auto px-8 py-6">
        
        {/* Title and Action Buttons Row */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Bolivar Cafe</h1>
          <div className="flex gap-3">
            <div className="relative">
              <Input
                type="text"
                placeholder="Cari pesan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-56 bg-white/90 border-none rounded text-sm placeholder-gray-600"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
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
              + Tambah Notifikasi
            </Button>
          </div>
        </div>

        {/* Notifikasi Table */}
        <div className="bg-[#e8e8e8] rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#d4d4d4]">
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">ID Pesan</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">ID Pelanggan</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Nama Pelanggan</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Pesan</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500 text-sm">
                    Memuat notifikasi...
                  </td>
                </tr>
              ) : notifikasiList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500 text-sm">
                    {debouncedSearchQuery ? 'Notifikasi tidak ditemukan.' : 'Tidak ada notifikasi.'}
                  </td>
                </tr>
              ) : (
                notifikasiList.map((notif) => (
                  <tr key={notif.id_pesan} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">{notif.id_pesan}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{notif.id_pelanggan || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {notif.id_pelanggan ? (notif.pelanggan?.nama_pelanggan || '...') : 'Broadcast'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 max-w-xs truncate">{notif.pesan}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => openModalForEdit(notif)}
                          className="bg-[#4a9fd9] hover:bg-[#3a8fc9] text-white text-xs px-4 py-1.5 h-auto rounded shadow"
                          disabled={deletingId === notif.id_pesan}
                        >
                          Ubah
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDelete(notif)}
                          className="bg-[#e74c3c] hover:bg-[#d73c2c] text-white text-xs px-4 py-1.5 h-auto rounded shadow"
                          disabled={deletingId === notif.id_pesan}
                        >
                          {deletingId === notif.id_pesan ? 'Menghapus...' : 'Hapus'}
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
            <div className="flex items-center justify-center min-h-screen p-4 bg-black bg-opacity-60">
              <div className="relative bg-white rounded-lg shadow-2xl transform transition-all w-full max-w-md">
                
                {/* Modal Header */}
                <div className="bg-[#4a9b88] text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    {modalTitle}
                  </h3>
                  <button 
                    onClick={closeModal}
                    className="text-white hover:text-gray-200"
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
                        <label htmlFor="id_pelanggan" className="block text-sm font-medium text-gray-700 mb-1">
                          Nama (Pelanggan)
                        </label>
                        <select
                          name="id_pelanggan"
                          id="id_pelanggan"
                          value={formData.id_pelanggan}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Broadcast (Semua Pelanggan)</option>
                          {pelangganList.map(p => (
                            <option key={p.id_pelanggan} value={p.id_pelanggan}>
                              {p.nama_pelanggan} (ID: {p.id_pelanggan})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="pesan" className="block text-sm font-medium text-gray-700 mb-1">
                          Pesan <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                          name="pesan"
                          id="pesan"
                          value={formData.pesan}
                          onChange={(e: any) => handleInputChange(e)}
                          required
                          className="w-full min-h-[100px] p-2 border border-gray-300 rounded-md"
                          placeholder="Tulis pesan notifikasi di sini..."
                        />
                      </div>
                      
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="bg-gray-100 px-6 py-4 rounded-b-lg flex justify-end gap-3">
                    <Button
                      type="button"
                      onClick={closeModal}
                      disabled={isSaving}
                      className="bg-[#e74c3c] hover:bg-[#d73c2c] text-white px-5 py-2 rounded text-sm font-medium"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className={`bg-gray-800 hover:bg-black text-white px-5 py-2 rounded text-sm font-medium ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
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
    </div>
  );
}