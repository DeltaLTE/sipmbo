"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { DialogActions } from '../shared/DialogActions';
import { Promotion } from '../../../lib/types';

interface PromotionDialogsProps {
  viewDialogOpen: boolean;
  setViewDialogOpen: (open: boolean) => void;
  editDialogOpen: boolean;
  setEditDialogOpen: (open: boolean) => void;
  addDialogOpen: boolean;
  setAddDialogOpen: (open: boolean) => void;
  selectedPromotion: Promotion | null;
  formData: Omit<Promotion, 'id' | 'sent'>;
  setFormData: (data: Omit<Promotion, 'id' | 'sent'>) => void;
  onSaveEdit: () => void;
  onSaveAdd: () => void;
}

export function PromotionDialogs({
  viewDialogOpen,
  setViewDialogOpen,
  editDialogOpen,
  setEditDialogOpen,
  addDialogOpen,
  setAddDialogOpen,
  selectedPromotion,
  formData,
  setFormData,
  onSaveEdit,
  onSaveAdd,
}: PromotionDialogsProps) {
  return (
    <>
      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="rounded-2xl p-8 max-w-2xl" style={{ backgroundColor: '#D4B896' }}>
          <DialogHeader className="hidden">
            <DialogTitle>Promotion Details</DialogTitle>
            <DialogDescription>View complete promotion information</DialogDescription>
          </DialogHeader>
          {selectedPromotion && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="block mb-2">Promotion ID</Label>
                  <Input value={`P${selectedPromotion.id}`} readOnly className="bg-white" />
                </div>
                <div>
                  <Label className="block mb-2">Title</Label>
                  <Input value={selectedPromotion.title} readOnly className="bg-white" />
                </div>
              </div>
              <div>
                <Label className="block mb-2">Description</Label>
                <Input value={selectedPromotion.description} readOnly className="bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="block mb-2">Status</Label>
                  <Input value={selectedPromotion.status} readOnly className="bg-white" />
                </div>
                <div>
                  <Label className="block mb-2">Notifications Sent</Label>
                  <Input value={selectedPromotion.sent} readOnly className="bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="block mb-2">Start Date</Label>
                  <Input value={selectedPromotion.startDate} readOnly className="bg-white" />
                </div>
                <div>
                  <Label className="block mb-2">End Date</Label>
                  <Input value={selectedPromotion.endDate} readOnly className="bg-white" />
                </div>
              </div>
            </div>
          )}
          <DialogActions
            onCancel={() => setViewDialogOpen(false)}
            onSave={() => setViewDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl p-8" style={{ backgroundColor: '#D4B896' }}>
          <DialogHeader className="hidden">
            <DialogTitle>Edit Promotion</DialogTitle>
            <DialogDescription>Update promotion information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title" className="block mb-2">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-description" className="block mb-2">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-status" className="block mb-2">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="edit-status" className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-start" className="block mb-2">Start Date</Label>
                <Input
                  id="edit-start"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="bg-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-end" className="block mb-2">End Date</Label>
                <Input
                  id="edit-end"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="bg-white"
                />
              </div>
            </div>
          </div>
          <DialogActions
            onCancel={() => setEditDialogOpen(false)}
            onSave={onSaveEdit}
          />
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl p-8" style={{ backgroundColor: '#D4B896' }}>
          <DialogHeader className="hidden">
            <DialogTitle>Create New Promotion</DialogTitle>
            <DialogDescription>Enter promotion information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="add-title" className="block mb-2">Title</Label>
              <Input
                id="add-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter promotion title"
                className="bg-white"
              />
            </div>
            <div>
              <Label htmlFor="add-description" className="block mb-2">Description</Label>
              <Textarea
                id="add-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter promotion description"
                className="bg-white"
              />
            </div>
            <div>
              <Label htmlFor="add-status" className="block mb-2">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="add-status" className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-start" className="block mb-2">Start Date</Label>
                <Input
                  id="add-start"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="bg-white"
                />
              </div>
              <div>
                <Label htmlFor="add-end" className="block mb-2">End Date</Label>
                <Input
                  id="add-end"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="bg-white"
                />
              </div>
            </div>
          </div>
          <DialogActions
            onCancel={() => setAddDialogOpen(false)}
            onSave={onSaveAdd}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}