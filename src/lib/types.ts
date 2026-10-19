export type Status = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type RecordDoc = {
  id: string; userId: string; categoryId: string; categoryName: string;
  amount: number; // pesewas
  date: Date; monthKey: string; method: string; reference: string; note: string;
  proofUrl: string | null; status: Status; isDeleted: boolean;
  verifiedByName?: string | null; verifiedAt?: Date | null; reviewNote?: string;
};

export type Target = {
  id: string; userId: string; name: string; amountGoal: number; // pesewas
  period: 'monthly' | 'yearly' | 'custom';
  startDate: Date | null; endDate: Date | null;
  categoryId: string | null; categoryName: string | null;
};
