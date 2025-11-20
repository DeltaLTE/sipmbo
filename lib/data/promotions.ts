import { Promotion } from '../types';

export const initialPromotions: Promotion[] = [
  { 
    id: 1, 
    title: 'Summer Sale 30% Off', 
    description: 'Get 30% off on all summer items',
    status: 'Active', 
    startDate: '2025-10-01', 
    endDate: '2025-10-31', 
    sent: 1250 
  },
  { 
    id: 2, 
    title: 'Weekend Special', 
    description: 'Special weekend discounts',
    status: 'Scheduled', 
    startDate: '2025-10-20', 
    endDate: '2025-10-22', 
    sent: 0 
  },
  { 
    id: 3, 
    title: 'Flash Sale - Electronics', 
    description: 'Limited time flash sale',
    status: 'Ended', 
    startDate: '2025-09-15', 
    endDate: '2025-09-20', 
    sent: 3200 
  },
  { 
    id: 4, 
    title: 'New Year Special', 
    description: 'Celebrate with exclusive deals',
    status: 'Scheduled', 
    startDate: '2025-12-31', 
    endDate: '2026-01-02', 
    sent: 0 
  },
];
