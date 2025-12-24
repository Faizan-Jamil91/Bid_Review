// src/types/bid.ts
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  customer_type?: string;
  industry?: string;
  annual_revenue?: string;
  credit_rating?: string;
  relationship_score?: number;
  is_active?: boolean;
  tags?: string[];
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface Bid {
  id: string;
  code: string;
  title: string;
  description: string;
  br_request_date: string;
  br_date: string;
  bid_due_date: string;
  submission_date: string | null;
  decision_date: string | null;
  is_urgent: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  complexity: 'simple' | 'moderate' | 'complex';
  business_unit: string;
  bid_level: 'A' | 'B' | 'C' | 'D';
  bid_value: string;
  estimated_cost: string;
  profit_margin: string;
  currency: string;
  customer: string;
  customer_detail: Customer;
  region: string;
  country: string;
  requested_by: string;
  requested_by_detail: User;
  assigned_to: string | null;
  assigned_to_detail: User | null;
  team_members: string[];
  status: 'draft' | 'submitted' | 'under_review' | 'technical_review' | 'commercial_review' | 'approved' | 'rejected' | 'won' | 'lost' | 'cancelled';
  progress: number;
  win_probability: number | null;
  risk_score: number | null;
  complexity_score: number | null;
  ai_recommendations: any[];
  ml_features: Record<string, any>;
  requirements: Record<string, any> | string;
  comments: string;
  winner: string;
  last_review_date: string | null;
  next_review_date: string | null;
  review_cycle: number;
  tags: string[];
  internal_notes: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  days_until_due: number;
  is_overdue: boolean;
  estimated_profit: number;
  category: string | null;
  category_detail: any;
}