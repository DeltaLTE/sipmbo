"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Search, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  category: string;
  notes: string;
  points: number;
  price: number | null;
}

interface ProductFormData {
  name: string;
  category: string;
  notes: string;
  points: number | string;
  price: number | string | null;
}

const initialFormData: ProductFormData = { name: '', category: '', notes: '', points: 0, price: '' };

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => { const h = setTimeout(() => setDebouncedValue(value), delay); return () => clearTimeout(h); }, [value, delay]);
  return debouncedValue;
}

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async (search = '') => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok) setProducts(data.data || []);
    } catch (e) { toast.error("Gagal memuat produk"); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(debouncedSearchTerm); }, [debouncedSearchTerm]);

  // --- ROBUST CSV IMPORT HANDLER (Replaces existing handleFileUpload) ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 2) {
        toast.error("File CSV kosong.");
        return;
      }

      // 1. FLEXIBLE HEADER DETECTION
      const rawHeaders = lines[0].toLowerCase().split(',');

      const findIndex = (keywords: string[]) => {
        return rawHeaders.findIndex(h => {
          const cleanH = h.replace(/["\r_]/g, ' ').trim();
          return keywords.some(k => cleanH.includes(k));
        });
      };

      // Map columns regardless of language (Bahasa vs English)
      const nameIndex = findIndex(["nama", "name", "product"]);
      const catIndex = findIndex(["kategori", "category"]);
      const priceIndex = findIndex(["harga", "price", "cost"]);
      const pointIndex = findIndex(["poin", "point"]);
      const noteIndex = findIndex(["catatan", "note", "desc"]);

      // Validate essential columns
      if (nameIndex === -1 || catIndex === -1) {
        toast.error("Format CSV tidak dikenali. Pastikan ada kolom: Nama Produk, Kategori");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // 2. PARSE DATA
      const importData = [];
      for (let i = 1; i < lines.length; i++) {
        // Handle commas inside quotes logic or simple split
        const parts = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
        
        // Ensure row has enough columns based on the max index we found
        const maxIndex = Math.max(nameIndex, catIndex, priceIndex, pointIndex);
        
        if (parts.length > maxIndex) {
          const clean = (val: string) => val ? val.replace(/^"|"$/g, '').trim() : '';

          importData.push({
            name: clean(parts[nameIndex]),
            category: clean(parts[catIndex]),
            // Use fallback if optional columns are missing
            notes: noteIndex !== -1 ? clean(parts[noteIndex]) : '',
            points: pointIndex !== -1 ? parseInt(clean(parts[pointIndex]).replace(/[^0-9]/g, '') || '0') : 0,
            price: priceIndex !== -1 ? parseFloat(clean(parts[priceIndex]).replace(/[^0-9.]/g, '') || '0') : 0
          });
        }
      }

      // 3. SEND TO API
      try {
        const response = await fetch('/api/products/import', { // Ensure this matches your folder structure
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(importData),
        });
        const result = await response.json();
        
        if (response.ok) {
          toast.success(result.message);
          fetchProducts(debouncedSearchTerm);
        } else {
          // Handle detailed error report if available
          if (result.failedDetails) {
            console.table(result.failedDetails);
            toast.warning(`Import sebagian. ${result.failed} data gagal (Cek Console).`);
          } else {
            toast.error(result.error || "Gagal import");
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Terjadi kesalahan sistem saat import");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModalForView = (product: Product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      notes: product.notes,
      points: product.points,
      price: product.price ?? '',
    });
    setIsViewModalOpen(true);
  };

  const openModalForAdd = () => { setCurrentProduct(null); setFormData(initialFormData); setIsModalOpen(true); };
  
  const openModalForEdit = (product: Product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      notes: product.notes,
      points: product.points,
      price: product.price ?? '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setIsViewModalOpen(false); setCurrentProduct(null); setFormData(initialFormData); setIsSaving(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const payload = { ...formData, points: Number(formData.points), price: Number(formData.price), id: currentProduct?.id };

    try {
      const response = await fetch('/api/products', {
        method: currentProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        toast.success('Saved successfully');
        closeModal();
        fetchProducts(debouncedSearchTerm);
      } else { toast.error('Failed to save'); }
    } catch (e) { toast.error('Error saving'); } 
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Deleted'); setProducts(prev => prev.filter(p => p.id !== id)); }
      else { toast.error('Failed delete'); }
    } catch (e) { toast.error('Error deleting'); }
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Bolivar Cafe</h1>
        <div className="flex gap-3">
          <div className="relative">
            <Input placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 w-56" />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <Button onClick={() => fileInputRef.current?.click()} className="bg-gray-700 text-white flex gap-2"><Upload size={16} /> Import CSV</Button>
          <Button onClick={openModalForAdd} className="bg-[#4a9fd9] text-white">+ Tambah Produk</Button>
        </div>
      </div>

      <div className="bg-[#e8e8e8] rounded-lg shadow-lg overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-[#d4d4d4]">
              <th className="px-6 py-3 text-left font-bold text-gray-800">ID</th>
              <th className="px-6 py-3 text-left font-bold text-gray-800">Nama</th>
              <th className="px-6 py-3 text-left font-bold text-gray-800">Kategori</th>
              <th className="px-6 py-3 text-left font-bold text-gray-800">Harga</th>
              <th className="px-6 py-3 text-left font-bold text-gray-800">Poin</th>
              <th className="px-6 py-3 text-left font-bold text-gray-800">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {loading ? (<tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>) : products.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{p.id}</td>
                <td className="px-6 py-4 font-medium">{p.name}</td>
                <td className="px-6 py-4">{p.category}</td>
                <td className="px-6 py-4">{p.price ? `Rp ${p.price.toLocaleString()}` : '-'}</td>
                <td className="px-6 py-4">{p.points}</td>
                <td className="px-6 py-4 flex gap-2">
                  <Button size="sm" onClick={() => openModalForView(p)} className="bg-[#4a9fd9] text-white text-xs px-4">Tampil</Button>
                  <Button size="sm" onClick={() => openModalForEdit(p)} className="bg-[#6BBF4F] text-white text-xs px-4">Ubah</Button>
                  <Button size="sm" onClick={() => handleDelete(p.id)} className="bg-[#e74c3c] text-white text-xs px-4">Hapus</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#78A890] text-white border-none">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Detail Produk</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label className="text-white">Nama Produk</Label><div className="bg-white text-black p-2 rounded mt-1">{formData.name}</div></div>
            <div><Label className="text-white">Kategori</Label><div className="bg-white text-black p-2 rounded mt-1">{formData.category}</div></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-white">Harga</Label><div className="bg-white text-black p-2 rounded mt-1">{formData.price}</div></div>
              <div><Label className="text-white">Poin</Label><div className="bg-white text-black p-2 rounded mt-1">{formData.points}</div></div>
            </div>
            <div><Label className="text-white">Catatan</Label><div className="bg-white text-black p-2 rounded mt-1 min-h-[60px]">{formData.notes || '-'}</div></div>
          </div>
          <DialogFooter><Button onClick={closeModal} className="bg-red-600 hover:bg-red-700 text-white w-full">Tutup</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD/EDIT MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#78A890] text-white border-none">
          <DialogHeader><DialogTitle className="font-serif text-2xl">{currentProduct ? 'Edit' : 'Tambah'} Produk</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div><Label className="text-white">Nama</Label><Input name="name" value={formData.name} onChange={handleInputChange} className="bg-white text-black" required /></div>
              <div><Label className="text-white">Kategori</Label><Input name="category" value={formData.category} onChange={handleInputChange} className="bg-white text-black" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-white">Harga</Label><Input type="number" name="price" value={formData.price ?? ''} onChange={handleInputChange} className="bg-white text-black" /></div>
                <div><Label className="text-white">Poin</Label><Input type="number" name="points" value={formData.points} onChange={handleInputChange} className="bg-white text-black" /></div>
              </div>
              <div><Label className="text-white">Catatan</Label><Textarea name="notes" value={formData.notes} onChange={handleInputChange} className="bg-white text-black" /></div>
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