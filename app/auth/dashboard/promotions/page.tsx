"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea'; // Assuming you have this
import { toast } from 'sonner';

// --- Types based on your schema/api ---

// For the main table, from GET /api/notifikasi
interface Notifikasi {
  id_pesan: number;
  id_pelanggan: number | null;
  pesan: string | null;
  pelanggan: {
    nama_pelanggan: string | null;
  } | null;
}

// For the dropdown in the modal
interface Pelanggan {
  id_pelanggan: number;
  nama_pelanggan: string | null;
}

// For the modal form
interface NotifikasiFormData {
  id_pelanggan: string; // Use string to hold the value from dropdown
  pesan: string;
}

const initialFormData: NotifikasiFormData = {
  id_pelanggan: "", // "" will mean 'null' (Broadcast to All)
  pesan: '',
};

// --- Debounce Hook (unchanged) ---
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

// --- Main Page Component ---
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

  // --- API Functions ---

  // Fetch all notifications
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

  // Fetch all customers (for the modal dropdown)
  const fetchPelanggan = async () => {
    try {
      // Assuming you have an API route for customers
      const response = await fetch('/api/pelanggan'); 
      const result = await response.json();
      if (response.ok) {
        setPelangganList(result);
      } else {
        toast.error(result.error || 'Failed to fetch customers for dropdown');
      }
    } catch (error) {
      toast.error('Error fetching customers');
      console.error(error);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchNotifikasi(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  useEffect(() => {
    // Fetch customer list only when modal is about to open, or on page load
    fetchPelanggan();
  }, []);

  // --- Modal and Form Handlers ---

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
      // Convert id_pelanggan string to number, or null if it's ""
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
      // API expects id_pesan in the URL query
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

  // --- Render ---
  return (
    // Body color matching the image
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
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Button
              onClick={openModalForAdd}
              // Using a blue color from the customer page for consistency
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
                
                {/* Modal Header (styling from image) */}
                <div className="bg-[#4a9b88] text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    {currentNotifikasi ? 'Edit Notifikasi' : 'Tambah Notifikasi Baru'}
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
                        {/* Assuming you have a Textarea component, or replace with <textarea> */}
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

                  {/* Modal Footer (styling from image) */}
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

