"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';

// Define the Product type based on your API's transformed response
interface Product {
  id: number;
  name: string;
  category: string;
  notes: string;
  points: number;
  price: number | null;
}

// Define the type for the form data
interface ProductFormData {
  name: string;
  category: string;
  notes: string;
  points: number | string;
  price: number | string | null;
}

// Initial empty form state
const initialFormData: ProductFormData = {
  name: '',
  category: '',
  notes: '',
  points: 0,
  price: '',
};

/**
 * A simple debounce function to limit API calls while typing.
 */
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

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const modalTitle = useMemo(() => 
    currentProduct ? 'Edit Produk' : 'Tambah Produk Baru',
    [currentProduct]
  );

  // --- Data Fetching Functions ---

  const fetchProducts = async (search: string = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(search)}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch products');
      }
      const data = await response.json();
      setProducts(data.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // --- Event Handlers ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModalForAdd = () => {
    setCurrentProduct(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
    setError(null);
  };

  const openModalForEdit = (product: Product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      notes: product.notes,
      points: product.points,
      price: product.price === null ? '' : product.price,
    });
    setIsModalOpen(true);
    setError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
    setFormData(initialFormData);
    setError(null);
    setIsSaving(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const apiPath = '/api/products';
    
    const pointsAsNumber = Number(formData.points);
    const priceAsNumber = formData.price === '' || formData.price === null ? null : Number(formData.price);

    if (isNaN(pointsAsNumber)) {
        setError("Points harus berupa angka yang valid.");
        setIsSaving(false);
        return;
    }
    if (formData.price !== '' && formData.price !== null && isNaN(priceAsNumber as number)) {
        setError("Harga harus berupa angka yang valid atau kosong.");
        setIsSaving(false);
        return;
    }

    const payload = {
      ...formData,
      points: pointsAsNumber,
      price: priceAsNumber,
      id: currentProduct?.id,
    };

    try {
      const response = await fetch(apiPath, {
        method: currentProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || (currentProduct ? 'Gagal mengupdate' : 'Gagal menambahkan'));
      }
      
      closeModal();
      fetchProducts(debouncedSearchTerm);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      return;
    }

    setDeletingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal menghapus produk');
      }

      setProducts(prev => prev.filter(p => p.id !== id));

    } catch (e: any) {
      setError(e.message); 
    } finally {
      setDeletingId(null);
    }
  };

  // --- Render ---

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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-56 bg-white border-none rounded text-sm"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <Button
            onClick={openModalForAdd}
            className="bg-[#3eb8a3] hover:bg-[#36a392] text-white px-5 py-2 rounded text-sm font-medium shadow-md"
          >
            + Tambah Produk
          </Button>
        </div>
      </div>

      {/* Global Error Display */}
      {error && !isModalOpen && (
        <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded mb-4 text-sm" role="alert">
          <strong className="font-semibold">Error: </strong>
          <span>{error}</span>
        </div>
      )}

      {/* Product Table - Light gray background */}
      <div className="bg-[#e8e8e8] rounded-lg shadow-lg overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-[#d4d4d4]">
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">ID</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Nama Produk</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Kategori</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Harga</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Poin</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-800">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500 text-sm">
                  Memuat produk...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500 text-sm">
                  {debouncedSearchTerm ? 'Produk tidak ditemukan.' : 'Tidak ada produk.'}
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">{product.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{product.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{product.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {product.price === null ? 'N/A' : `Rp ${product.price.toLocaleString()}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{product.points}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => openModalForEdit(product)}
                        className="bg-[#4a9fd9] hover:bg-[#3a8fc9] text-white text-xs px-4 py-1.5 h-auto rounded shadow"
                        disabled={deletingId === product.id}
                      >
                        Ubah
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        className="bg-[#e74c3c] hover:bg-[#d73c2c] text-white text-xs px-4 py-1.5 h-auto rounded shadow"
                        disabled={deletingId === product.id}
                      >
                        {deletingId === product.id ? 'Menghapus...' : 'Hapus'}
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
                  {modalTitle}
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
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm" role="alert">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Produk <span className="text-red-500">*</span>
                      </label>
                      <Input
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                        placeholder="Masukkan nama produk"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                        Kategori <span className="text-red-500">*</span>
                      </label>
                      <Input
                        name="category"
                        id="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                        placeholder="Masukkan kategori"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                          Harga (Rp)
                        </label>
                        <Input
                          type="number"
                          name="price"
                          id="price"
                          value={formData.price === null ? '' : formData.price}
                          onChange={handleInputChange}
                          min="0"
                          placeholder="0"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-1">
                          Poin
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
                    
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                        Catatan
                      </label>
                      <Textarea
                        name="notes"
                        id="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Catatan tambahan (opsional)..."
                        className="w-full"
                        rows={3}
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