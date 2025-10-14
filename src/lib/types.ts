
export type OpportunityCategory = 'Environment' | 'Education' | 'Healthcare' | 'Community Development' | 'Animal Welfare';

export interface Application {
  id: string;
  volunteerName: string;
  volunteerEmail: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedDate: string; // ISO 8601 string
  opportunityId: string;
  opportunityTitle: string;
  opportunityNgo: string;
}

export interface Opportunity {
  id: string;
  title: string;
  ngo: string;
  description: string;
  longDescription: string;
  location: string;
  date: string;
  timeCommitment: string;
  category: OpportunityCategory;
  imageUrl: string;
  imageHint: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'volunteer' | 'ngo';
}
