"use client"

import { Promotion } from '../../../lib/types';
import { Badge } from '../../ui/badge';

interface PromotionTableProps {
  promotions: Promotion[];
  onView: (promotion: Promotion) => void;
  onEdit: (promotion: Promotion) => void;
  onDelete: (promotion: Promotion) => void;
}

export function PromotionTable({ promotions, onView, onEdit, onDelete }: PromotionTableProps) {
  return (
    <div className="bg-[#8B7355] rounded-2xl border-2 border-black p-6 mb-6">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left text-white pb-4 px-4">ID</th>
            <th className="text-left text-white pb-4 px-4">Title</th>
            <th className="text-left text-white pb-4 px-4">Status</th>
            <th className="text-left text-white pb-4 px-4">Start Date</th>
            <th className="text-left text-white pb-4 px-4">End Date</th>
            <th className="text-center text-white pb-4 px-4">Pilihan</th>
          </tr>
        </thead>
        <tbody>
          {promotions.map((promo) => (
            <tr key={promo.id} className="border-b border-black/20">
              <td className="py-4 px-4 text-white">P{promo.id}</td>
              <td className="py-4 px-4 text-white">{promo.title}</td>
              <td className="py-4 px-4">
                <Badge 
                  variant={
                    promo.status === 'Active' ? 'default' : 
                    promo.status === 'Scheduled' ? 'secondary' : 
                    'outline'
                  }
                >
                  {promo.status}
                </Badge>
              </td>
              <td className="py-4 px-4 text-white">{promo.startDate}</td>
              <td className="py-4 px-4 text-white">{promo.endDate}</td>
              <td className="py-4 px-4">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => onView(promo)}
                    className="px-4 py-1 rounded-full text-white"
                    style={{ backgroundColor: '#4FB3BF' }}
                  >
                    Tampil
                  </button>
                  <button
                    onClick={() => onEdit(promo)}
                    className="px-4 py-1 rounded-full text-white"
                    style={{ backgroundColor: '#6BBF4F' }}
                  >
                    Ubah
                  </button>
                  <button
                    onClick={() => onDelete(promo)}
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