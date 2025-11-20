"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { DialogActions } from '../shared/DialogActions';
import { Customer } from '@/lib/types';

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Omit<Customer, 'id'>;
  setFormData: (data: Omit<Customer, 'id'>) => void;
  onSave: () => void;
}

export function AddCustomerDialog({ 
  open, 
  onOpenChange, 
  formData, 
  setFormData, 
  onSave 
}: AddCustomerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl p-8" style={{ backgroundColor: '#D4B896' }}>
        <DialogHeader className="hidden">
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>Enter new customer information</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="add-name" className="block mb-2">Contact Name</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter customer name"
                className="bg-white"
              />
            </div>
            <div>
              <Label htmlFor="add-email" className="block mb-2">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="customer@example.com"
                className="bg-white"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="add-phone" className="block mb-2">Phone Number</Label>
            <Input
              id="add-phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0815-0000-0000"
              className="bg-white"
            />
          </div>
          <div>
            <Label htmlFor="add-points" className="block mb-2">Initial Points</Label>
            <Input
              id="add-points"
              type="number"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
              placeholder="0"
              className="bg-white"
            />
          </div>
        </div>
        <DialogActions
          onCancel={() => onOpenChange(false)}
          onSave={onSave}
        />
      </DialogContent>
    </Dialog>
  );
}