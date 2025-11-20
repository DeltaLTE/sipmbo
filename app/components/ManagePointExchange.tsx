"use client"

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

// Type based on your prisma schema 'poin' model
type PointReward = {
  id_point: number;
  nama_reward: string;
  points_required: number;
  stok: number;
};

// Form data interface
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

// Debounce hook
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

export default function ManagePointExchange() {
  const [rewards, setRewards] = useState<PointReward[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentReward, setCurrentReward] = useState<PointReward | null>(null);
  const [formData, setFormData] = useState<RewardFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // --- API Functions ---

  const fetchRewards = async (search = '') => {
    try {
      setLoading(true);
      const url = search 
        ? `/api/points?search=${encodeURIComponent(search)}`
        : '/api/points';
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (response.ok) {
        setRewards(result);
      } else {
        toast.error(result.error || 'Failed to fetch rewards');
      }
    } catch (error) {
      toast.error('Error fetching rewards');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  // --- Handlers ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModalForAdd = () => {
    setCurrentReward(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

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
        toast.success(currentReward ? 'Reward updated successfully' : 'Reward added successfully');
        closeModal();
        fetchRewards(debouncedSearchQuery);
      } else {
        toast.error(result.error || 'Failed to save reward');
      }
    } catch (error) {
      toast.error('Error saving reward');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (reward: PointReward) => {
    if (!window.confirm(`Are you sure you want to delete "${reward.nama_reward}"?`)) {
      return;
    }

    setDeletingId(reward.id_point);
    try {
      const response = await fetch(`/api/points?id=${reward.id_point}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success('Reward deleted successfully');
        setRewards(prev => prev.filter(r => r.id_point !== reward.id_point));
      } else {
        toast.error(result.error || 'Failed to delete reward');
      }
    } catch (error) {
      toast.error('Error deleting reward');
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
                placeholder="Cari reward..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-56 bg-white/90 border-none rounded text-sm placeholder-gray-600"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
            <Button
              onClick={openModalForAdd}
              className="bg-[#4a9fd9] hover:bg-[#3a8fc9] text-white px-5 py-2 rounded text-sm font-medium shadow-md"
            >
              + Tambah Reward
            </Button>
          </div>
        </div>

        {/* Rewards Table */}
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
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500 text-sm">
                    Memuat data...
                  </td>
                </tr>
              ) : rewards.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500 text-sm">
                    {debouncedSearchQuery ? 'Reward tidak ditemukan.' : 'Belum ada reward.'}
                  </td>
                </tr>
              ) : (
                rewards.map((reward) => (
                  <tr key={reward.id_point} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">R{reward.id_point}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{reward.nama_reward}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{reward.points_required}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{reward.stok}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => openModalForEdit(reward)}
                          className="bg-[#4a9fd9] hover:bg-[#3a8fc9] text-white text-xs px-4 py-1.5 h-auto rounded shadow"
                          disabled={deletingId === reward.id_point}
                        >
                          Ubah
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDelete(reward)}
                          className="bg-[#e74c3c] hover:bg-[#d73c2c] text-white text-xs px-4 py-1.5 h-auto rounded shadow"
                          disabled={deletingId === reward.id_point}
                        >
                          {deletingId === reward.id_point ? 'Menghapus...' : 'Hapus'}
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
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-md bg-white rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  {currentReward ? 'Edit Reward' : 'Tambah Reward Baru'}
                </DialogTitle>
                <DialogDescription>
                  {currentReward ? 'Update detail reward di bawah ini.' : 'Isi detail untuk reward baru.'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit}>
                <div className="px-1 py-4">
                  <div className="space-y-4">
                    
                    <div>
                      <Label htmlFor="nama_reward" className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Reward <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        name="nama_reward"
                        id="nama_reward"
                        value={formData.nama_reward}
                        onChange={handleInputChange}
                        required
                        placeholder="Contoh: Free Coffee"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="points_required" className="block text-sm font-medium text-gray-700 mb-1">
                          Points Required <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          name="points_required"
                          id="points_required"
                          type="number"
                          value={formData.points_required}
                          onChange={handleInputChange}
                          required
                          min="0"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="stok" className="block text-sm font-medium text-gray-700 mb-1">
                          Stok <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          name="stok"
                          id="stok"
                          type="number"
                          value={formData.stok}
                          onChange={handleInputChange}
                          required
                          min="0"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    
                  </div>
                </div>

                <DialogFooter className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    disabled={isSaving}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className={`bg-gray-800 hover:bg-black text-white ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}