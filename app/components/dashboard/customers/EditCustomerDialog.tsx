"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { DialogActions } from '../shared/DialogActions';
import { Customer } from '../../../lib/types';

interface EditCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  formData: Omit<Customer, 'id'>;
  setFormData: (data: Omit<Customer, 'id'>) => void;
  onSave: () => void;
}

export function EditCustomerDialog({ 
  open, 
  onOpenChange, 
  customer, 
  formData, 
  setFormData, 
  onSave 
}: EditCustomerDialogProps) {
  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl p-8" style={{ backgroundColor: '#D4B896' }}>
        <DialogHeader className="hidden">
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>Update customer information</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-name" className="block mb-2">Contact Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-email" className="block mb-2">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-white"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="edit-phone" className="block mb-2">Phone Number</Label>
            <Input
              id="edit-phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-white"
            />
          </div>
          <div>
            <Label htmlFor="edit-points" className="block mb-2">Points</Label>
            <Input
              id="edit-points"
              type="number"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
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