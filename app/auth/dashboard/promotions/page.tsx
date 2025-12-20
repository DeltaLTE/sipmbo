"use client";

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { toast } from 'sonner';
import { Search, Trash2 } from 'lucide-react'; // Removed Upload

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
  useEffect(() => { const handler = setTimeout(() => setDebouncedValue(value), delay); return () => clearTimeout(handler); }, [value, delay]);
  return debouncedValue;
}

export default function NotifikasiPage() {
  const [notifikasiList, setNotifikasiList] = useState<Notifikasi[]>([]);
  const [pelangganList, setPelangganList] = useState<Pelanggan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); // New View State
  const [currentNotifikasi, setCurrentNotifikasi] = useState<Notifikasi | null>(null);
  const [formData, setFormData] = useState<NotifikasiFormData>(initialFormData);
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchNotifikasi = async (search = '') => {
    try {
      setLoading(true);
      const url = search ? `/api/notifikasi?search=${encodeURIComponent(search)}` : '/api/notifikasi';
      const response = await fetch(url);
      const result = await response.json();
      if (response.ok) setNotifikasiList(result);
      else toast.error(result.error || 'Failed to fetch notifications');
    } catch (error) { toast.error('Error fetching notifications'); } 
    finally { setLoading(false); }
  };

  const fetchPelanggan = async () => {
    try {
      // Assuming GET /api/customer returns { data: [] }
      const response = await fetch('/api/customer'); 
      const result = await response.json();
      if (response.ok && result.data) setPelangganList(result.data);
    } catch (error) { console.error('Error fetching customers'); }
  };

  useEffect(() => { fetchNotifikasi(debouncedSearchQuery); }, [debouncedSearchQuery]);
  useEffect(() => { fetchPelanggan(); }, []);

  // --- Modal and Form Handlers ---

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // OPEN VIEW (TAMPIL)
  const openModalForView = (notifikasi: Notifikasi) => {
    setCurrentNotifikasi(notifikasi);
    setFormData({ pesan: notifikasi.pesan || '', id_pelanggan: notifikasi.id_pelanggan ? String(notifikasi.id_pelanggan) : "" });
    setIsViewModalOpen(true);
  };

  const openModalForAdd = () => { setCurrentNotifikasi(null); setFormData(initialFormData); setIsModalOpen(true); };

  const openModalForEdit = (notifikasi: Notifikasi) => {
    setCurrentNotifikasi(notifikasi);
    setFormData({ pesan: notifikasi.pesan || '', id_pelanggan: notifikasi.id_pelanggan ? String(notifikasi.id_pelanggan) : "" });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsViewModalOpen(false); // Close View Modal
    setCurrentNotifikasi(null);
    setFormData(initialFormData);
    setIsSaving(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pesan) return toast.error("Pesan tidak boleh kosong.");
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
      if (response.ok) { toast.success(currentNotifikasi ? 'Updated' : 'Added'); closeModal(); fetchNotifikasi(debouncedSearchQuery); } 
      else { toast.error('Gagal menyimpan'); }
    } catch (error) { toast.error('Error saving'); } 
    finally { setIsSaving(false); }
  };

  const handleDelete = async (notifikasi: Notifikasi) => {
    setDeletingId(notifikasi.id_pesan);
    try {
      const response = await fetch(`/api/notifikasi?id_pesan=${notifikasi.id_pesan}`, { method: 'DELETE' });
      if (response.ok) { toast.success('Deleted'); setNotifikasiList(prev => prev.filter(n => n.id_pesan !== notifikasi.id_pesan)); } 
      else { toast.error('Gagal menghapus'); }
    } catch (error) { toast.error('Error deleting'); } 
    finally { setDeletingId(null); }
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
            {/* REMOVED IMPORT BUTTON */}
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
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Nama Pelanggan</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Pesan</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500 text-sm">Memuat notifikasi...</td></tr>
              ) : notifikasiList.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500 text-sm">Tidak ada notifikasi.</td></tr>
              ) : (
                notifikasiList.map((notif) => (
                  <tr key={notif.id_pesan} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">{notif.id_pesan}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {notif.id_pelanggan ? (notif.pelanggan?.nama_pelanggan || 'ID: ' + notif.id_pelanggan) : 'Broadcast'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 max-w-xs truncate">{notif.pesan}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        {/* TAMPIL BUTTON */}
                        <Button size="sm" onClick={() => openModalForView(notif)} className="bg-[#4a9fd9] text-white text-xs px-4">
                          Tampil
                        </Button>
                        <Button size="sm" onClick={() => openModalForEdit(notif)} className="bg-[#6BBF4F] text-white text-xs px-4">
                          Ubah
                        </Button>
                        <Button size="sm" onClick={() => handleDelete(notif)} className="bg-[#e74c3c] text-white text-xs px-4">
                          <Trash2 size={14} /> Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- VIEW MODAL --- */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-md bg-[#78A890] text-white border-none">
            <DialogHeader><DialogTitle className="font-serif text-2xl">Detail Notifikasi</DialogTitle></DialogHeader>
            {currentNotifikasi && (
              <div className="space-y-4 py-4">
                <div><Label className="text-white">Pesan</Label><div className="bg-white text-black p-2 rounded mt-1">{formData.pesan}</div></div>
                <div><Label className="text-white">Ditujukan Kepada</Label><div className="bg-white text-black p-2 rounded mt-1">
                  {currentNotifikasi.id_pelanggan ? (currentNotifikasi.pelanggan?.nama_pelanggan || `ID: ${currentNotifikasi.id_pelanggan}`) : 'Semua Pelanggan (Broadcast)'}
                </div></div>
              </div>
            )}
            <DialogFooter><Button onClick={closeModal} className="bg-red-600 hover:bg-red-700 text-white w-full">Tutup</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* --- ADD/EDIT MODAL (unchanged) --- */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md bg-[#78A890] text-white border-none">
            <DialogHeader><DialogTitle className="font-serif text-2xl">{currentNotifikasi ? 'Edit Notifikasi' : 'Tambah Notifikasi'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div><Label className="text-white">Tujuan</Label>
                  <select name="id_pelanggan" value={formData.id_pelanggan} onChange={(e) => handleInputChange(e)} className="w-full p-2 text-black rounded mt-1">
                    <option value="">Broadcast (Semua)</option>
                    {pelangganList.map(p => (<option key={p.id_pelanggan} value={p.id_pelanggan}>{p.nama_pelanggan} (ID: {p.id_pelanggan})</option>))}
                  </select>
                </div>
                <div><Label className="text-white">Pesan</Label>
                  <Textarea name="pesan" value={formData.pesan} onChange={(e: any) => handleInputChange(e)} required className="w-full text-black min-h-[100px]" />
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
    </div>
  );
}