// src/types/review.ts
export interface BidReview {
  id: string;
  bid: string;
  bid_code: string;
  bid_title: string;
  review_type: 'technical' | 'commercial' | 'legal' | 'financial' | 'risk' | 'final';
  sequence: number;
  assigned_to: string | null;
  assigned_to_detail: User | null;
  reviewed_by: string | null;
  reviewed_by_detail: User | null;
  assigned_date: string;
  due_date: string;
  completed_date: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  decision: 'approved' | 'approved_comments' | 'modifications_required' | 'rejected' | 'escalated' | null;
  score: number | null;
  strengths: string;
  weaknesses: string;
  recommendations: string;
  comments: string;
  ai_analysis: Record<string, any>;
  ai_suggestions: string;
  sentiment_score: number | null;
  is_mandatory: boolean;
  requires_signature: boolean;
  created_at: string;
  updated_at: string;
}

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

export interface CreateBidReviewRequest {
  bid: string;
  review_type: string;
  sequence?: number;
  assigned_to?: string;
  assigned_to_detail?: User;
  reviewed_by?: string;
  reviewed_by_detail?: User;
  due_date: string;
  completed_date?: string;
  status?: string;
  decision?: string;
  score?: number;
  strengths?: string;
  weaknesses?: string;
  recommendations?: string;
  comments?: string;
  ai_analysis?: Record<string, any>;
  ai_suggestions?: string;
  sentiment_score?: number;
  is_mandatory?: boolean;
  requires_signature?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  [key: string]: string[];
}
