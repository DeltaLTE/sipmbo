"use client"

import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Search, Upload } from 'lucide-react';
import { toast } from 'sonner';

// --- Types ---
interface MembershipTier {
  tier_membership: string;
  required_point: number | null;
  diskon: number | string | null;
  jumlah_member?: number;
}

interface MembershipFormData {
  tier_membership: string;
  required_point: number | string;
  diskon: number | string;
}

const initialFormData: MembershipFormData = {
  tier_membership: '',
  required_point: 0,
  diskon: 0,
};

// --- Debounce Hook ---
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

// --- Main Component ---
export default function ManageMembership() {
  const [membershipTiers, setMembershipTiers] = useState<MembershipTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTier, setCurrentTier] = useState<MembershipTier | null>(null);
  const [formData, setFormData] = useState<MembershipFormData>(initialFormData);
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // File Input Ref for Import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- API Functions ---

  const fetchTiers = async (search = '') => {
    try {
      setLoading(true);
      const url = search 
        ? `/api/membership?search=${encodeURIComponent(search)}`
        : '/api/membership';
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (response.ok) {
        setMembershipTiers(result);
      } else {
        toast.error(result.error || 'Failed to fetch membership tiers');
      }
    } catch (error) {
      toast.error('Error fetching membership tiers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiers(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  // --- CSV Import Handler ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      // CSV Logic: Expects "TierName, Points, Discount"
      const lines = text.split('\n');
      const importData = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Skip header row
        if (i === 0 && (line.toLowerCase().includes('tier') || line.toLowerCase().includes('points'))) {
          continue;
        }

        const parts = line.split(',');
        if (parts.length >= 3) {
          importData.push({
            tier_membership: parts[0].trim(),
            required_point: parseInt(parts[1].trim()) || 0,
            diskon: parseFloat(parts[2].trim()) || 0
          });
        }
      }

      if (importData.length === 0) {
        toast.error("File CSV kosong atau format salah. Gunakan: Nama Tier, Points, Diskon");
        return;
      }

      try {
        const response = await fetch('/api/membership/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(importData),
        });

        const result = await response.json();
        if (response.ok) {
          toast.success(result.message);
          fetchTiers(debouncedSearchQuery);
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

  // --- Standard Handlers (Add/Edit/Delete) ---
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModalForAdd = () => {
    setCurrentTier(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openModalForEdit = (tier: MembershipTier) => {
    setCurrentTier(tier);
    setFormData({
      tier_membership: tier.tier_membership,
      required_point: tier.required_point || 0,
      diskon: tier.diskon || 0,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentTier(null);
    setFormData(initialFormData);
    setIsSaving(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tier_membership) {
      toast.error("Nama Tier tidak boleh kosong.");
      return;
    }
    setIsSaving(true);
    const payload = {
      tier_membership: formData.tier_membership,
      required_point: parseFloat(String(formData.required_point)) || 0,
      diskon: parseFloat(String(formData.diskon)) || 0,
    };

    try {
      const response = await fetch('/api/membership', {
        method: currentTier ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success(currentTier ? 'Tier berhasil diupdate' : 'Tier berhasil ditambahkan');
        closeModal();
        fetchTiers(debouncedSearchQuery);
      } else {
        toast.error(result.error || 'Gagal menyimpan tier');
      }
    } catch (error) {
      toast.error('Error saving');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (tier: MembershipTier) => {
    if (!window.confirm(`Hapus tier "${tier.tier_membership}"?`)) return;
    setDeletingId(tier.tier_membership);
    try {
      const response = await fetch(`/api/membership?id=${tier.tier_membership}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Tier berhasil dihapus');
        setMembershipTiers(prev => prev.filter(t => t.tier_membership !== tier.tier_membership));
      } else {
        const res = await response.json();
        toast.error(res.error || 'Gagal menghapus');
      }
    } catch (error) {
      toast.error('Error menghapus');
    } finally {
      setDeletingId(null);
    }
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#78a890]">
      <div className="max-w-7xl mx-auto px-8 py-6">
        
        {/* Title & Actions */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Bolivar Cafe</h1>
          <div className="flex gap-3">
            <div className="relative">
              <Input
                type="text"
                placeholder="Cari tier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-56 bg-white/90 border-none rounded text-sm"
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
              + Tambah Tier
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#e8e8e8] rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#d4d4d4]">
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Tier (ID)</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Required Points</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Diskon</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Member Count</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500 text-sm">Memuat tier...</td></tr>
              ) : membershipTiers.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500 text-sm">Belum ada tier.</td></tr>
              ) : (
                membershipTiers.map((tier) => (
                  <tr key={tier.tier_membership} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{tier.tier_membership}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{tier.required_point}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{String(tier.diskon)}%</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{tier.jumlah_member || 0}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => openModalForEdit(tier)} className="bg-[#4a9fd9] text-white text-xs px-4">Ubah</Button>
                        <Button size="sm" onClick={() => handleDelete(tier)} className="bg-[#e74c3c] text-white text-xs px-4">Hapus</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md bg-white rounded-lg">
            <DialogHeader>
              <DialogTitle>{currentTier ? 'Edit Tier' : 'Tambah Tier'}</DialogTitle>
              <DialogDescription>{currentTier ? 'Update detail tier.' : 'Isi detail tier baru.'}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="px-1 py-4 space-y-4">
                <div>
                  <Label htmlFor="tier_membership">Nama Tier</Label>
                  <Input
                    name="tier_membership"
                    value={formData.tier_membership}
                    onChange={handleInputChange}
                    readOnly={!!currentTier}
                    className={currentTier ? 'bg-gray-100' : ''}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="required_point">Required Points</Label>
                  <Input type="number" name="required_point" value={formData.required_point} onChange={handleInputChange} required min="0" />
                </div>
                <div>
                  <Label htmlFor="diskon">Diskon (%)</Label>
                  <Input type="number" step="0.01" name="diskon" value={formData.diskon} onChange={handleInputChange} required min="0" />
                </div>
              </div>
              <DialogFooter className="bg-gray-50 px-6 py-4 rounded-b-lg">
                <Button type="button" variant="outline" onClick={closeModal}>Batal</Button>
                <Button type="submit" disabled={isSaving} className="bg-gray-800 text-white">{isSaving ? 'Simpan...' : 'Simpan'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}