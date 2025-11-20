"use client"

import { Input } from '../../ui/input';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search" }: SearchBarProps) {
  return (
    <div className="flex justify-end mb-6">
      <div className="relative w-64">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-white rounded-full pl-4 pr-10"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5" />
      </div>
    </div>
  );
}