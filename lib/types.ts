// Customer types
export type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  points: number;
};

// Promotion types
export type Promotion = {
  id: number;
  title: string;
  description: string;
  status: 'Active' | 'Scheduled' | 'Ended';
  startDate: string;
  endDate: string;
  sent: number;
};

// Reward types
export type Reward = {
  id: number;
  name: string;
  description: string;
  points: number;
  stock: number;
  claimed: number;
};

// Membership types
export type MembershipTier = {
  id: number;
  name: string;
  description: string;
  minPoints: number;
  discount: string;
  members: number;
};

// Navigation types
export type PageType = 'customers' | 'promotions' | 'points' | 'membership' | 'reports';
