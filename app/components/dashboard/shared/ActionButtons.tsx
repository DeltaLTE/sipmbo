"use client"

interface ActionButtonsProps {
  onSave?: () => void;
  onBack?: () => void;
  onAdd?: () => void;
}

export function ActionButtons({ onSave, onBack, onAdd }: ActionButtonsProps) {
  return (
    <div className="flex gap-4">
      {onSave && (
        <button
          onClick={onSave}
          className="px-8 py-2 bg-black text-white rounded"
        >
          Simpan
        </button>
      )}
      {onBack && (
        <button
          onClick={onBack}
          className="px-8 py-2 text-white rounded"
          style={{ backgroundColor: '#BF4F4F' }}
        >
          Kembali ke Halaman Utama
        </button>
      )}
      {onAdd && (
        <button
          onClick={onAdd}
          className="px-8 py-2 text-white rounded"
          style={{ backgroundColor: '#4F6BBF' }}
        >
          Tambah
        </button>
      )}
    </div>
  );
}