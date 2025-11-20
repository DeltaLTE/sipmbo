import { MembershipTier } from '../types';

export const initialMembershipTiers: MembershipTier[] = [
  { id: 1, name: 'Bronze', description: 'Entry level', minPoints: 0, discount: '5%', members: 1250 },
  { id: 2, name: 'Silver', description: 'Mid-tier', minPoints: 1000, discount: '10%', members: 450 },
  { id: 3, name: 'Gold', description: 'Premium tier', minPoints: 5000, discount: '15%', members: 120 },
  { id: 4, name: 'Platinum', description: 'Elite tier', minPoints: 10000, discount: '20%', members: 35 },
];
