"use client"

import { DialogFooter } from '../../ui/dialog';

interface DialogActionsProps {
  onCancel: () => void;
  onSave: () => void;
  cancelText?: string;
  saveText?: string;
}

export function DialogActions({ 
  onCancel, 
  onSave, 
  cancelText = "Cancel", 
  saveText = "Simpan" 
}: DialogActionsProps) {
  return (
    <DialogFooter className="flex-row gap-3 mt-6">
      <button
        onClick={onCancel}
        className="px-8 py-2 text-white rounded"
        style={{ backgroundColor: '#BF4F4F' }}
      >
        {cancelText}
      </button>
      <button
        onClick={onSave}
        className="px-8 py-2 bg-black text-white rounded"
      >
        {saveText}
      </button>
    </DialogFooter>
  );
}