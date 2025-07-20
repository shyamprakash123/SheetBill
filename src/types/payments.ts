export interface PaymentMode {
  id: string;
  notes: string;
  amount: number;
  paymentMethod: "UPI" | "CASH" | "CARD" | "NET_BANKING" | "CHEQUE" | "EMI";
}

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
}
