"use client"

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Search } from 'lucide-react'; // Added Eye icon
import { toast } from 'sonner';

// --- Types based on your schema/api ---
interface MembershipTier {
  tier_membership: string;
  required_point: number | null;
  diskon: number | string | null;
  jumlah_member?: number;
}

// For the modal form
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
  useEffect(() => { const handler = setTimeout(() => setDebouncedValue(value), delay); return () => clearTimeout(handler); }, [value, delay]);
  return debouncedValue;
}

// --- Main Page Component ---
export default function ManageMembership() {
  const [membershipTiers, setMembershipTiers] = useState<MembershipTier[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); // New View State
  const [currentTier, setCurrentTier] = useState<MembershipTier | null>(null);
  const [formData, setFormData] = useState<MembershipFormData>(initialFormData);
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);


  // --- API Functions ---
  const fetchTiers = async (search = '') => {
    try {
      setLoading(true);
      const url = search 
        ? `/api/membership?search=${encodeURIComponent(search)}`
        : '/api/membership';
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (response.ok) setMembershipTiers(result);
      else toast.error(result.error || 'Failed to fetch membership tiers');
    } catch (error) { toast.error('Error fetching membership tiers'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTiers(debouncedSearchQuery); }, [debouncedSearchQuery]);

  // --- Modal and Form Handlers ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // OPEN VIEW (TAMPIL)
  const openModalForView = (tier: MembershipTier) => {
    setCurrentTier(tier);
    setFormData({
      tier_membership: tier.tier_membership,
      required_point: tier.required_point || 0,
      diskon: tier.diskon || 0,
    });
    setIsViewModalOpen(true);
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
    setIsViewModalOpen(false); // Close View Modal
    setCurrentTier(null);
    setFormData(initialFormData);
    setIsSaving(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tier_membership) {
      toast.error("Tier Membership (Nama Tier) tidak boleh kosong.");
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
    } catch (error) { toast.error('Error menyimpan tier'); } 
    finally { setIsSaving(false); }
  };

  const handleDelete = async (tier: MembershipTier) => {
    const tierId = tier.tier_membership;
    setDeletingId(tierId);
    try {
      const response = await fetch(`/api/membership?id=${tierId}`, { method: 'DELETE' });
      const result = await response.json();
      
      if (response.ok) {
        toast.success('Membership tier berhasil dihapus');
        setMembershipTiers(prev => prev.filter(t => t.tier_membership !== tierId));
      } else {
        toast.error(result.error || 'Gagal menghapus tier');
      }
    } catch (error) { toast.error('Error menghapus tier'); } 
    finally { setDeletingId(null); }
  };

  // --- Render ---
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
                placeholder="Cari tier..."
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
              + Tambah Tier
            </Button>
          </div>
        </div>

        {/* Membership Table */}
        <div className="bg-[#e8e8e8] rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#d4d4d4]">
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Tier Membership (ID)</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Required Points</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Diskon</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Jumlah Member</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500 text-sm">Memuat tier...</td></tr>
              ) : membershipTiers.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500 text-sm">Belum ada membership tier.</td></tr>
              ) : (
                membershipTiers.map((tier) => (
                  <tr key={tier.tier_membership} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{tier.tier_membership}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{tier.required_point}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{String(tier.diskon)}%</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{tier.jumlah_member}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        {/* NEW TAMPIL BUTTON */}
                        <Button size="sm" onClick={() => openModalForView(tier)} className="bg-[#4a9fd9] hover:bg-[#3a8fc9] text-white text-xs px-4">
                          Tampil
                        </Button>
                        <Button size="sm" onClick={() => openModalForEdit(tier)} className="bg-[#6BBF4F] hover:bg-[#5aad41] text-white text-xs px-4">
                          Ubah
                        </Button>
                        <Button size="sm" onClick={() => handleDelete(tier)} className="bg-[#e74c3c] hover:bg-[#d73c2c] text-white text-xs px-4">
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

        {/* --- VIEW MODAL --- */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-md bg-[#78A890] text-white rounded-lg border-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif">Detail Membership</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label className="text-white">Tier ID</Label><div className="bg-white text-black p-2 rounded mt-1">{currentTier?.tier_membership}</div></div>
              <div><Label className="text-white">Required Points</Label><div className="bg-white text-black p-2 rounded mt-1">{currentTier?.required_point}</div></div>
              <div><Label className="text-white">Diskon (%)</Label><div className="bg-white text-black p-2 rounded mt-1">{currentTier?.diskon}%</div></div>
              <div><Label className="text-white">Jumlah Member</Label><div className="bg-white text-black p-2 rounded mt-1">{currentTier?.jumlah_member}</div></div>
            </div>
            <DialogFooter>
              <Button onClick={closeModal} className="bg-red-600 hover:bg-red-700 text-white w-full">Tutup</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        {/* --- ADD/EDIT MODAL (unchanged) --- */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md bg-[#78A890] text-white rounded-lg border-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif">{currentTier ? 'Edit Membership Tier' : 'Tambah Tier Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div><Label className="text-white">Tier Membership</Label><Input name="tier_membership" value={formData.tier_membership} onChange={handleInputChange} readOnly={!!currentTier} className={`bg-white text-black ${currentTier ? 'bg-gray-200' : ''}`} required /></div>
                <div><Label className="text-white">Required Points</Label><Input type="number" name="required_point" value={formData.required_point} onChange={handleInputChange} className="bg-white text-black" required min="0" /></div>
                <div><Label className="text-white">Diskon (%)</Label><Input type="number" step="0.01" name="diskon" value={formData.diskon} onChange={handleInputChange} className="bg-white text-black" required min="0" /></div>
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