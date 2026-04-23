export interface ScanResult {
  amount: number | null;
  bankName: string | null;
  sender: string | null;
  recipient: string | null;
  date: string | null;
  reference: string | null;
  verdict: "REAL" | "SUSPICIOUS" | "LIKELY_FAKE";
  isFakeProbability: number;
  redFlags: string[];
  rawTextSummary: string | null;
}