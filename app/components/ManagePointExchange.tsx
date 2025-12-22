"use client"

import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Search, Upload, Eye } from 'lucide-react'; // Added Eye icon for Tampil
import { toast } from 'sonner';

// --- Types ---
type PointReward = {
  id_point: number;
  nama_reward: string;
  points_required: number;
  stok: number;
};

interface RewardFormData {
  nama_reward: string;
  points_required: number | string;
  stok: number | string;
}

const initialFormData: RewardFormData = {
  nama_reward: '',
  points_required: 0,
  stok: 0,
};

// --- Debounce Hook ---
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function ManagePointExchange() {
  const [rewards, setRewards] = useState<PointReward[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); // New View Modal
  const [currentReward, setCurrentReward] = useState<PointReward | null>(null);
  const [formData, setFormData] = useState<RewardFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- API Functions ---
  const fetchRewards = async (search = '') => {
    try {
      setLoading(true);
      const url = search ? `/api/points?search=${encodeURIComponent(search)}` : '/api/points';
      const response = await fetch(url);
      const result = await response.json();
      if (response.ok) setRewards(result);
      else toast.error(result.error || 'Failed to fetch rewards');
    } catch (error) {
      toast.error('Error fetching rewards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  // --- STRICT CSV IMPORT HANDLER ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 2) {
        toast.error("File CSV kosong atau tidak valid.");
        return;
      }

      // 1. STRICT HEADER CHECK
      // Normalize header: remove quotes, remove spaces, make lowercase
      const headerRaw = lines[0].toLowerCase().replace(/"/g, '').replace(/\r/g, '');
      const headers = headerRaw.split(',').map(h => h.trim());

      // Define exact expected headers
      // Ensure your CSV uses: "Nama Reward, Points, Stok"
      const requiredHeaders = ["nama reward", "points", "stok"];

      // Check if all required headers exist
      const isValidHeader = requiredHeaders.every(req => headers.includes(req));

      if (!isValidHeader) {
        toast.error("Format Header Salah! Harap gunakan: Nama Reward, Points, Stok");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // 2. Parse Data based on index
      // We map based on index assuming order: Nama, Points, Stok
      const nameIndex = headers.indexOf("nama reward");
      const pointsIndex = headers.indexOf("points");
      const stokIndex = headers.indexOf("stok");

      const importData = [];
      
      // Start loop from 1 to skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Handle split carefully (simple split by comma)
        const parts = line.split(',');

        if (parts.length >= 3) {
          const rowData = {
            nama_reward: parts[nameIndex]?.trim().replace(/^"|"$/g, ''), // Clean quotes if present
            points_required: parseInt(parts[pointsIndex]?.trim()) || 0,
            stok: parseInt(parts[stokIndex]?.trim()) || 0
          };
          
          // Only add if name exists
          if (rowData.nama_reward) {
            importData.push(rowData);
          }
        }
      }

      // 3. Send to API
      try {
        const response = await fetch('/api/points/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(importData),
        });
        const result = await response.json();
        
        if (response.ok) {
          // Show detailed message (success count + skipped count)
          toast.success(result.message);
          fetchRewards(debouncedSearchQuery);
        } else {
          toast.error(result.error || "Gagal import data");
        }
      } catch (error) {
        toast.error("Terjadi kesalahan saat import");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // OPEN VIEW (TAMPIL)
  const openModalForView = (reward: PointReward) => {
    setCurrentReward(reward);
    setFormData({
      nama_reward: reward.nama_reward,
      points_required: reward.points_required,
      stok: reward.stok,
    });
    setIsViewModalOpen(true);
  };

  // OPEN ADD
  const openModalForAdd = () => {
    setCurrentReward(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  // OPEN EDIT
  const openModalForEdit = (reward: PointReward) => {
    setCurrentReward(reward);
    setFormData({
      nama_reward: reward.nama_reward,
      points_required: reward.points_required,
      stok: reward.stok,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    setCurrentReward(null);
    setFormData(initialFormData);
    setIsSaving(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_reward) {
      toast.error("Nama Reward wajib diisi");
      return;
    }
    setIsSaving(true);
    const payload = {
      id_point: currentReward?.id_point,
      nama_reward: formData.nama_reward,
      points_required: parseInt(String(formData.points_required)) || 0,
      stok: parseInt(String(formData.stok)) || 0,
    };

    try {
      const response = await fetch('/api/points', {
        method: currentReward ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success(currentReward ? 'Reward updated' : 'Reward added');
        closeModal();
        fetchRewards(debouncedSearchQuery);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Error saving');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (reward: PointReward) => {
    setDeletingId(reward.id_point);
    try {
      const response = await fetch(`/api/points?id=${reward.id_point}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Deleted successfully');
        setRewards(prev => prev.filter(r => r.id_point !== reward.id_point));
      } else {
        toast.error('Failed to delete');
      }
    } catch (error) {
      toast.error('Error deleting');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#78a890]">
      {/* Navbar omitted for brevity, assuming layout or copy-paste from other files */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        
        {/* Title & Actions */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Bolivar Cafe</h1>
          <div className="flex gap-3">
            <div className="relative">
              <Input
                type="text"
                placeholder="Cari reward..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-56 bg-white/90 border-none rounded text-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>

            {/* Import Button */}
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gray-700 hover:bg-gray-900 text-white px-5 py-2 rounded text-sm font-medium shadow-md flex items-center gap-2"
            >
              <Upload size={16} />
              Import CSV
            </Button>

            <Button onClick={openModalForAdd} className="bg-[#4a9fd9] hover:bg-[#3a8fc9] text-white px-5 py-2 rounded text-sm font-medium shadow-md">
              + Tambah Reward
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#e8e8e8] rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#d4d4d4]">
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">ID</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Nama Reward</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Points Required</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Stok</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Pilihan</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500 text-sm">Memuat data...</td></tr>
              ) : rewards.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500 text-sm">Tidak ada data.</td></tr>
              ) : (
                rewards.map((reward) => (
                  <tr key={reward.id_point} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">{reward.id_point}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{reward.nama_reward}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{reward.points_required}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{reward.stok}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        {/* TAMPIL BUTTON */}
                        <Button size="sm" onClick={() => openModalForView(reward)} className="bg-[#4a9fd9] hover:bg-[#3a8fc9] text-white text-xs px-4">
                          Tampil
                        </Button>
                        {/* UBAH BUTTON */}
                        <Button size="sm" onClick={() => openModalForEdit(reward)} className="bg-[#6BBF4F] hover:bg-[#5aad41] text-white text-xs px-4">
                          Ubah
                        </Button>
                        {/* HAPUS BUTTON */}
                        <Button size="sm" onClick={() => handleDelete(reward)} className="bg-[#e74c3c] hover:bg-[#d73c2c] text-white text-xs px-4">
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
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-md bg-[#78A890] text-white rounded-lg border-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif">Detail Reward</DialogTitle>
              <DialogDescription className="text-gray-100">Informasi lengkap reward.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-white">Nama Reward</Label>
                <div className="bg-white text-black p-2 rounded mt-1">{formData.nama_reward}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Points Required</Label>
                  <div className="bg-white text-black p-2 rounded mt-1">{formData.points_required}</div>
                </div>
                <div>
                  <Label className="text-white">Stok</Label>
                  <div className="bg-white text-black p-2 rounded mt-1">{formData.stok}</div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={closeModal} className="bg-red-600 hover:bg-red-700 text-white w-full">Tutup</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* --- ADD/EDIT MODAL --- */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md bg-[#78A890] text-white rounded-lg border-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif">{currentReward ? 'Edit Penukaran Poin' : 'Tambah Penukaran Poin'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-white">Reward</Label>
                  <Input name="nama_reward" value={formData.nama_reward} onChange={handleInputChange} className="bg-white text-black" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Points required</Label>
                    <Input type="number" name="points_required" value={formData.points_required} onChange={handleInputChange} className="bg-white text-black" required min="0" />
                  </div>
                  <div>
                    <Label className="text-white">Stock Produk</Label>
                    <Input type="number" name="stok" value={formData.stok} onChange={handleInputChange} className="bg-white text-black" required min="0" />
                  </div>
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