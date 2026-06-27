export type Platform = 'Big Basket' | 'Instamart' | 'Amazon';
export type SurveyPlatform = 'Blinkit' | 'Zepto' | 'Instamart' | 'BigBasket' | 'Amazon' | 'Other';

// City-level aggregate PODs (Point-of-Distribution) sales MRP.
// Values are rupees — NOT availability percentages.
export interface PodsSales {
  city: string;
  platform: Platform;
  month: string;       // 'Apr 2026' | 'May 2026'
  salesMrp: number;   // rupees
}

export interface SkuSales {
  sku: string;
  line: string;
  city: string;
  platform: string;
  salesMrp: number;
}

export interface SalesSpends {
  date: string;
  platform: 'Big Basket' | 'Instamart';
  spend: number;
  sales: number;
  a2s: number;
}

// Matches the real customer survey (form customer data.xlsx).
// platform here is where the customer shops (Blinkit/Zepto), NOT where MadMix sells.
export interface SurveyResponse {
  id: string;                              // MadMix Code e.g. 'MX4A7'
  submittedAt: string;
  ageGroup: string;                        // '18-24', '25-34', etc.
  location: string;                        // city name
  consumptionFrequency: 'Daily' | 'Few times a week' | 'Weekly' | 'Monthly' | 'Rarely';
  skippedDueToUnavailability: boolean;
  platform: SurveyPlatform;
  pincodeAvailability: boolean;
}

export interface EvidenceItem {
  label: string;
  detail: string;
  source: 'PODs Sales' | 'SKU Sales' | 'Sales vs Spends' | 'Customer Survey';
  trend?: 'up' | 'down' | 'flat';
}

export interface RawDataRef {
  source: string;
  rows: Record<string, string | number | boolean>[];
}

export interface Decision {
  id: string;
  action: string;
  type: 'grow' | 'reduce' | 'remove' | 'monitor' | 'spend' | 'expand';
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  flavour?: string;
  city?: string;
  state?: string;
  platform?: string;
  reasoning: string;
  evidence: EvidenceItem[];
  rawDataRefs: RawDataRef[];
  createdAt: string;
}

export interface SharedAnalysis {
  id: string;
  sharedBy: string;
  sharedAt: string;
  note: string;
  title: string;
  filterScope: {
    state: string;
    city: string;
    pincode: string;
    platform: string;
    flavour: string;
  };
  previewType: 'decision' | 'chart';
  previewData?: any;
  decisionId?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  watchedCities: string[];
  watchedFlavours: string[];
}

// AnalysisResponse shape returned by GET /api/v1/analysis
export interface PlatformGapSummary {
  blinkitPct: number;
  zeptoPct: number;
  otherPct: number;
  insight: string;
}

export interface SkipRateItem {
  city: string;
  skipRate: number;
  totalRespondents: number;
}

export interface PodsDeltaItem {
  city: string;
  platform: string;
  aprMrp: number;
  mayMrp: number;
  deltaPct: number;
}

export interface AnalysisResponse {
  totalSalesMrp: number;
  totalPodsSalesMrp: number;
  salesByPlatform: { name: string; value: number }[];
  salesByFlavour: { name: string; value: number }[];
  podsSalesDelta: PodsDeltaItem[];
  a2sOverTime: SalesSpends[];
  worstA2SPlatform: { platform: string; ratio: number } | null;
  totalSurveyResponses: number;
  skipRateByCity: SkipRateItem[];
  consumptionFrequencyBreakdown: { name: string; value: number }[];
  platformGap: PlatformGapSummary;
  pincodeAvailabilityRate: number;
}
