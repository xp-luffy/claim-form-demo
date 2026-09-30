export type ClaimStatus = "draft" | "submitted" | "classified" | "approved" | "rejected" | "paid";
export type ClaimType = "petty_cash" | "expense" | "travel" | "others";

export type Department = {
  id: string;
  name: string;
  code: string;
  created_at?: string;
};

export type ClaimItem = {
  id?: string;
  description: string;
  category: string | null;
  amount: number;
};

export type Approval = {
  id: string;
  decision: "approved" | "rejected";
  note: string | null;
  created_at: string;
};

export type Payment = {
  id: string;
  amount: number;
  method: "bank_transfer" | "cash" | "cheque" | null;
  reference: string | null;
  status: "pending" | "released";
  paid_at: string | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  action: string;
  detail: string | null;
  created_at: string;
};

export type Claim = {
  id: string;
  voucher_number: string | null;
  department_id: string | null;
  claim_type: ClaimType;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  status: ClaimStatus;
  is_petty_cash: boolean;
  submitted_at: string | null;
  classified_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  paid_at: string | null;
  suggested_category: string | null;
  suggested_category_source: string | null;
  suggested_category_confidence: number | null;
  review_status: string;
  created_at: string;
  department: Department | null;
  claim_items: ClaimItem[];
  approvals?: Approval[];
  payments?: Payment[];
};
