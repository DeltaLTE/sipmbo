"use client"

import { Customer } from '@/lib/types';

interface CustomerTableProps {
  customers: Customer[];
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export function CustomerTable({ customers, onView, onEdit, onDelete }: CustomerTableProps) {
  return (
    <div className="bg-[#8B7355] rounded-2xl border-2 border-black p-6 mb-6">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left text-white pb-4 px-4">ID Contact</th>
            <th className="text-left text-white pb-4 px-4">Contact Name</th>
            <th className="text-left text-white pb-4 px-4">Phone Number</th>
            <th className="text-center text-white pb-4 px-4">Pilihan</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="border-b border-black/20">
              <td className="py-4 px-4 text-white">P{customer.id}</td>
              <td className="py-4 px-4 text-white">{customer.name}</td>
              <td className="py-4 px-4 text-white">{customer.phone}</td>
              <td className="py-4 px-4">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => onView(customer)}
                    className="px-4 py-1 rounded-full text-white"
                    style={{ backgroundColor: '#4FB3BF' }}
                  >
                    Tampil
                  </button>
                  <button
                    onClick={() => onEdit(customer)}
                    className="px-4 py-1 rounded-full text-white"
                    style={{ backgroundColor: '#6BBF4F' }}
                  >
                    Ubah
                  </button>
                  <button
                    onClick={() => onDelete(customer)}
                    className="px-4 py-1 rounded-full text-white"
                    style={{ backgroundColor: '#BF4F6B' }}
                  >
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}