import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { DialogActions } from '../shared/DialogActions';
import { Customer } from '../../../lib/types';

interface ViewCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

export function ViewCustomerDialog({ open, onOpenChange, customer }: ViewCustomerDialogProps) {
  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl p-8" style={{ backgroundColor: '#D4B896' }}>
        <DialogHeader className="hidden">
          <DialogTitle>Customer Details</DialogTitle>
          <DialogDescription>View complete customer information</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="block mb-2">ID Contact</Label>
              <Input value={`P${customer.id}`} readOnly className="bg-white" />
            </div>
            <div>
              <Label className="block mb-2">Contact Name</Label>
              <Input value={customer.name} readOnly className="bg-white" />
            </div>
          </div>
          <div>
            <Label className="block mb-2">Phone Number</Label>
            <Input value={customer.phone} readOnly className="bg-white" />
          </div>
          <div>
            <Label className="block mb-2">Email</Label>
            <Input value={customer.email} readOnly className="bg-white" />
          </div>
          <div>
            <Label className="block mb-2">Points</Label>
            <Input value={customer.points} readOnly className="bg-white" />
          </div>
        </div>
        <DialogActions
          onCancel={() => onOpenChange(false)}
          onSave={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
