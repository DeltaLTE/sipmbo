import { Reward } from '../types';

export const initialRewards: Reward[] = [
  { id: 1, name: '$5 Discount Voucher', description: 'Get $5 off', points: 500, stock: 100, claimed: 45 },
  { id: 2, name: '$10 Discount Voucher', description: 'Get $10 off', points: 1000, stock: 50, claimed: 23 },
  { id: 3, name: 'Free Coffee', description: 'Free coffee', points: 200, stock: 200, claimed: 156 },
  { id: 4, name: 'Free Shipping', description: 'Free shipping', points: 300, stock: 150, claimed: 89 },
];
