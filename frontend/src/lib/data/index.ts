import { 
  PodsAvailability, 
  SkuSales, 
  SalesSpends, 
  SurveyResponse, 
  Decision, 
  SharedAnalysis, 
  UserProfile 
} from '../../types';
import { 
  SEED_PODS_AVAILABILITY, 
  SEED_SKU_SALES, 
  SEED_SALES_SPENDS, 
  SEED_SURVEY_RESPONSES, 
  SEED_DECISIONS,
  STATE_CITY_MAPPING,
  CITY_PINCODES,
  RAW_CITY_DATA,
  RawCityData
} from './seed';

export { STATE_CITY_MAPPING, CITY_PINCODES, RAW_CITY_DATA };
export type { RawCityData };

// Local storage key for persistence
const SHARED_ANALYSES_KEY = 'madmix_shared_analyses';
const BOOKMARKS_KEY = 'madmix_bookmarks';
const PROFILE_KEY = 'madmix_user_profile';

// Keys for user-imported data arrays
export const IMPORTED_AVAILABILITY_KEY = 'madmix_imported_pods_availability';
export const IMPORTED_SKU_SALES_KEY = 'madmix_imported_sku_sales';
export const IMPORTED_SALES_SPENDS_KEY = 'madmix_imported_sales_spends';
export const IMPORTED_SURVEY_RESPONSES_KEY = 'madmix_imported_survey_responses';
export const IMPORTED_DECISIONS_KEY = 'madmix_imported_decisions';

// Helper getters that dynamically check localStorage first or fall back to seeds
export function getSkuSalesData(): SkuSales[] {
  const stored = localStorage.getItem(IMPORTED_SKU_SALES_KEY);
  return stored ? JSON.parse(stored) : SEED_SKU_SALES;
}

export function getPodsAvailabilityData(): PodsAvailability[] {
  const stored = localStorage.getItem(IMPORTED_AVAILABILITY_KEY);
  return stored ? JSON.parse(stored) : SEED_PODS_AVAILABILITY;
}

export function getSalesSpendsData(): SalesSpends[] {
  const stored = localStorage.getItem(IMPORTED_SALES_SPENDS_KEY);
  return stored ? JSON.parse(stored) : SEED_SALES_SPENDS;
}

export function getSurveyResponsesData(): SurveyResponse[] {
  const stored = localStorage.getItem(IMPORTED_SURVEY_RESPONSES_KEY);
  return stored ? JSON.parse(stored) : SEED_SURVEY_RESPONSES;
}

export function getDecisionsData(): Decision[] {
  const stored = localStorage.getItem(IMPORTED_DECISIONS_KEY);
  return stored ? JSON.parse(stored) : SEED_DECISIONS;
}

// Saver and Clearer helpers for custom imports
export async function saveImportedData(
  type: 'sku_sales' | 'pods_availability' | 'sales_spends' | 'survey_responses' | 'decisions',
  data: any[]
): Promise<void> {
  await delay(200);
  let key = '';
  switch (type) {
    case 'sku_sales': key = IMPORTED_SKU_SALES_KEY; break;
    case 'pods_availability': key = IMPORTED_AVAILABILITY_KEY; break;
    case 'sales_spends': key = IMPORTED_SALES_SPENDS_KEY; break;
    case 'survey_responses': key = IMPORTED_SURVEY_RESPONSES_KEY; break;
    case 'decisions': key = IMPORTED_DECISIONS_KEY; break;
  }
  if (key) {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

export async function clearImportedData(
  type: 'sku_sales' | 'pods_availability' | 'sales_spends' | 'survey_responses' | 'decisions' | 'all'
): Promise<void> {
  await delay(100);
  if (type === 'all') {
    localStorage.removeItem(IMPORTED_SKU_SALES_KEY);
    localStorage.removeItem(IMPORTED_AVAILABILITY_KEY);
    localStorage.removeItem(IMPORTED_SALES_SPENDS_KEY);
    localStorage.removeItem(IMPORTED_SURVEY_RESPONSES_KEY);
    localStorage.removeItem(IMPORTED_DECISIONS_KEY);
  } else {
    let key = '';
    switch (type) {
      case 'sku_sales': key = IMPORTED_SKU_SALES_KEY; break;
      case 'pods_availability': key = IMPORTED_AVAILABILITY_KEY; break;
      case 'sales_spends': key = IMPORTED_SALES_SPENDS_KEY; break;
      case 'survey_responses': key = IMPORTED_SURVEY_RESPONSES_KEY; break;
      case 'decisions': key = IMPORTED_DECISIONS_KEY; break;
    }
    if (key) {
      localStorage.removeItem(key);
    }
  }
}

// Mock initial profile
const DEFAULT_PROFILE: UserProfile = {
  name: 'Argham Jain',
  email: 'arghamjain.rj@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
  watchedCities: ['Bangalore', 'Ahmedabad'],
  watchedFlavours: ['Aloo Sev Millet Bhujia', 'BBQ Blast Millet Bhujia'],
};

// Seed initial shared analyses if they don't exist
const INITIAL_SHARED_ANALYSES: SharedAnalysis[] = [
  {
    id: 'SHA-001',
    sharedBy: 'Sneha Kulkarni (Growth Lead)',
    sharedAt: '2026-06-25T14:30:00Z',
    note: 'Hey team, Ahmedabad BBQ sales drop is very real. Customer surveys pointing to "Too spicy" are dominating. We should formulate a milder recipe for the West India market.',
    title: 'Ahmedabad BBQ Blast Analysis',
    filterScope: {
      state: 'Gujarat',
      city: 'Ahmedabad',
      pincode: '',
      platform: 'Instamart',
      flavour: 'BBQ Blast Millet Bhujia'
    },
    previewType: 'decision',
    decisionId: 'DEC-001'
  },
  {
    id: 'SHA-002',
    sharedBy: 'Rohan Sharma (Brand Mgr)',
    sharedAt: '2026-06-24T18:15:00Z',
    note: 'Weekly ad spends on Instamart are bleeding money in Week 3 of April. Look at the A2S spike! Need to pause top-of-funnel banners during mid-month slumps.',
    title: 'Instamart Ad Campaign Leaks',
    filterScope: {
      state: '',
      city: '',
      pincode: '',
      platform: 'Instamart',
      flavour: ''
    },
    previewType: 'chart',
    previewData: {
      chartType: 'A2S',
      summary: 'Week 3 A2S spiked to 77.4% against 25.3% baseline'
    }
  }
];

// Helper to load shared analyses
const loadSharedAnalyses = (): SharedAnalysis[] => {
  const stored = localStorage.getItem(SHARED_ANALYSES_KEY);
  if (!stored) {
    localStorage.setItem(SHARED_ANALYSES_KEY, JSON.stringify(INITIAL_SHARED_ANALYSES));
    return INITIAL_SHARED_ANALYSES;
  }
  return JSON.parse(stored);
};

// Helper to save shared analyses
const saveSharedAnalyses = (data: SharedAnalysis[]) => {
  localStorage.setItem(SHARED_ANALYSES_KEY, JSON.stringify(data));
};

// Artificial delay helper to simulate real DB actions & network requests
const delay = (ms: number = 350) => new Promise(resolve => setTimeout(resolve, ms));

export interface AnalysisFilters {
  state: string;
  city: string;
  pincode: string;
  platform: string;
  flavour: string;
}

// ==========================================
// DATA ACCESS LAYER EXPORTS
// ==========================================

/**
 * Get cities needing immediate attention ("Hot Cities")
 * TODO: Replace with Supabase complex aggregates & joins
 */
export async function getHotCities() {
  await delay(400);
  
  return [
    {
      city: 'Ahmedabad',
      state: 'Gujarat',
      sparkline: [78, 65, 52, 41, 32],
      whyItIsHot: 'BBQ Blast sales dropped 58% (82% Spice complaints)',
      severity: 'high' as const,
      trend: 'down' as const,
    },
    {
      city: 'Surat',
      state: 'Gujarat',
      sparkline: [12, 10, 8, 7, 6],
      whyItIsHot: 'Pizza Party Sales near zero (Packaging & texture complaints)',
      severity: 'high' as const,
      trend: 'down' as const,
    },
    {
      city: 'Bangalore',
      state: 'Karnataka',
      sparkline: [82, 84, 85, 87, 89],
      whyItIsHot: 'Aloo Sev Sales leading + 100% promoter intent',
      severity: 'grow' as const, // represents positive "hot" growth opportunity
      trend: 'up' as const,
    },
    {
      city: 'Mumbai',
      state: 'Maharashtra',
      sparkline: [94, 94, 93, 93, 92],
      whyItIsHot: 'Masala Masti availability leaked 2% on Instamart',
      severity: 'monitor' as const,
      trend: 'down' as const,
    }
  ];
}

/**
 * Get filtered business decisions / recommended actions
 * TODO: Replace with Supabase Query on decisions table
 */
export async function getDecisions(filters?: Partial<AnalysisFilters>): Promise<Decision[]> {
  await delay(450);
  
  const currentDecisions = getDecisionsData();
  if (!filters) return currentDecisions;
  
  // Helper to find the state of any city
  const getStateOfCity = (cityName: string): string => {
    for (const [stateName, citiesList] of Object.entries(STATE_CITY_MAPPING)) {
      if (citiesList.some(c => c.toLowerCase() === cityName.toLowerCase())) {
        return stateName;
      }
    }
    return '';
  };
  
  // Rule-based filtering matching selected context strictly
  return currentDecisions.filter(decision => {
    // State Filter
    if (filters.state) {
      const dState = decision.state || (decision.city ? getStateOfCity(decision.city) : '');
      if (dState && dState !== filters.state) {
        return false;
      }
      if (!dState) {
        return false;
      }
    }
    
    // City Filter
    if (filters.city) {
      if (decision.city && decision.city !== filters.city) {
        return false;
      }
      const filteredCityState = getStateOfCity(filters.city);
      if (decision.state && decision.state !== filteredCityState) {
        return false;
      }
      if (!decision.city && !decision.state) {
        return false;
      }
    }
    
    // Platform Filter
    if (filters.platform) {
      if (decision.platform && decision.platform !== filters.platform) {
        return false;
      }
    }
    
    // Flavour/SKU Filter
    if (filters.flavour) {
      if (decision.flavour && decision.flavour !== filters.flavour) {
        return false;
      }
      if (!decision.flavour) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Get full details for a single decision
 * TODO: Replace with Supabase single item query
 */
export async function getDecisionById(id: string): Promise<Decision | undefined> {
  await delay(300);
  return getDecisionsData().find(d => d.id === id);
}

/**
 * Get comprehensive, unified analytical view matching selected filters
 * Fuses platform data ("PODs Data") and surveys in real time.
 * TODO: Replace with Supabase PostgreSQL aggregation views
 */
export async function getAnalysis(filters: AnalysisFilters) {
  await delay(500);

  const { state, city, pincode, platform, flavour } = filters;

  // 1. Filter raw lists based on criteria
  
  // Filtering SkuSales
  let filteredSkuSales = getSkuSalesData();
  if (city) {
    filteredSkuSales = filteredSkuSales.filter(s => s.city === city);
  } else if (state) {
    // get all cities in state
    const citiesInState = STATE_CITY_MAPPING[state] || [];
    filteredSkuSales = filteredSkuSales.filter(s => citiesInState.includes(s.city));
  }
  if (platform) {
    filteredSkuSales = filteredSkuSales.filter(s => s.platform === platform);
  }
  if (flavour) {
    filteredSkuSales = filteredSkuSales.filter(s => s.sku === flavour);
  }

  // Filtering Availability
  let filteredAvailability = getPodsAvailabilityData();
  if (city) {
    filteredAvailability = filteredAvailability.filter(s => s.city === city);
  } else if (state) {
    const citiesInState = STATE_CITY_MAPPING[state] || [];
    filteredAvailability = filteredAvailability.filter(s => citiesInState.includes(s.city));
  }
  if (platform) {
    filteredAvailability = filteredAvailability.filter(s => s.platform === platform);
  }

  // Filtering Survey Responses
  let filteredSurveys = getSurveyResponsesData();
  if (pincode) {
    filteredSurveys = filteredSurveys.filter(s => s.pincode === pincode);
  } else if (city) {
    filteredSurveys = filteredSurveys.filter(s => s.city === city);
  } else if (state) {
    filteredSurveys = filteredSurveys.filter(s => s.state === state);
  }
  if (platform) {
    filteredSurveys = filteredSurveys.filter(s => s.commerce === platform);
  }
  if (flavour) {
    filteredSurveys = filteredSurveys.filter(s => s.flavour === flavour);
  }

  // 2. Compute Aggregated Metrics
  
  // Total Sales MRP
  const totalSales = filteredSkuSales.reduce((sum, item) => sum + item.salesMrp, 0);
  
  // Total Surveys Count
  const totalSurveys = filteredSurveys.length;

  // Average Repurchase Intent % (Definitely + Maybe / Total)
  const positiveRepurchases = filteredSurveys.filter(s => s.repurchase === 'Definitely' || s.repurchase === 'Maybe').length;
  const avgRepurchaseIntent = totalSurveys > 0 ? Number(((positiveRepurchases / totalSurveys) * 100).toFixed(1)) : 0;

  // Worst A2S Platform
  // Daily spends only exists for Instamart and Big Basket
  let instamartSpend = 0;
  let instamartSales = 0;
  let bigBasketSpend = 0;
  let bigBasketSales = 0;

  getSalesSpendsData().forEach(s => {
    if (s.platform === 'Instamart') {
      instamartSpend += s.spend;
      instamartSales += s.sales;
    } else if (s.platform === 'Big Basket') {
      bigBasketSpend += s.spend;
      bigBasketSales += s.sales;
    }
  });

  const imRatio = instamartSales > 0 ? instamartSpend / instamartSales : 0;
  const bbRatio = bigBasketSales > 0 ? bigBasketSpend / bigBasketSales : 0;

  const worstA2SPlatform = imRatio > bbRatio 
    ? { platform: 'Instamart', ratio: Number((imRatio * 100).toFixed(1)) }
    : { platform: 'Big Basket', ratio: Number((bbRatio * 100).toFixed(1)) };

  // Sales by Platform series (recharts)
  const platformSalesMap: Record<string, number> = {};
  filteredSkuSales.forEach(s => {
    platformSalesMap[s.platform] = (platformSalesMap[s.platform] || 0) + s.salesMrp;
  });
  const salesByPlatform = Object.entries(platformSalesMap).map(([name, value]) => ({ name, value }));

  // Availability Delta Apr vs May (recharts)
  const availMap: Record<string, { aprSum: number; aprCount: number; maySum: number; mayCount: number }> = {};
  filteredAvailability.forEach(a => {
    if (!availMap[a.platform]) {
      availMap[a.platform] = { aprSum: 0, aprCount: 0, maySum: 0, mayCount: 0 };
    }
    if (a.month === 'Apr 2026') {
      availMap[a.platform].aprSum += a.value;
      availMap[a.platform].aprCount += 1;
    } else {
      availMap[a.platform].maySum += a.value;
      availMap[a.platform].mayCount += 1;
    }
  });

  const availabilityDelta = Object.entries(availMap).map(([plat, data]) => {
    const aprAvg = data.aprCount > 0 ? Math.round(data.aprSum / data.aprCount) : 0;
    const mayAvg = data.mayCount > 0 ? Math.round(data.maySum / data.mayCount) : 0;
    return {
      platform: plat,
      apr: aprAvg,
      may: mayAvg,
      delta: mayAvg - aprAvg
    };
  });

  // Sales by Flavour/SKU series
  const flavourSalesMap: Record<string, number> = {};
  filteredSkuSales.forEach(s => {
    flavourSalesMap[s.sku] = (flavourSalesMap[s.sku] || 0) + s.salesMrp;
  });
  const salesByFlavour = Object.entries(flavourSalesMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Taste Sentiment breakdown (recharts donut)
  const tasteCounts: Record<string, number> = { 'Loved it': 0, 'Liked it': 0, 'It was okay': 0, 'Didn’t like it': 0 };
  filteredSurveys.forEach(s => {
    tasteCounts[s.taste] = (tasteCounts[s.taste] || 0) + 1;
  });
  const tasteColors: Record<string, string> = {
    'Loved it': '#22C55E',      // Green
    'Liked it': '#BB9CC9',      // Lavender Accent
    'It was okay': '#F59E0B',   // Amber
    'Didn’t like it': '#EF4444' // Red
  };
  const tasteSentiment = Object.entries(tasteCounts).map(([name, count]) => ({
    name,
    count,
    color: tasteColors[name] || '#BB9CC9'
  }));

  // Repurchase intent split (recharts pie/bar)
  const repurchCounts: Record<string, number> = { 'Definitely': 0, 'Maybe': 0, 'No': 0 };
  filteredSurveys.forEach(s => {
    repurchCounts[s.repurchase] = (repurchCounts[s.repurchase] || 0) + 1;
  });
  const repurchaseIntent = Object.entries(repurchCounts).map(([name, value]) => ({ name, value }));

  // Ad-to-Sales vs spends over time (filtered if platform selected)
  const currentSalesSpends = getSalesSpendsData();
  let a2sOverTime = currentSalesSpends;
  if (platform && (platform === 'Instamart' || platform === 'Big Basket')) {
    a2sOverTime = currentSalesSpends.filter(s => s.platform === platform);
  } else {
    // default to averaging platforms per date
    const dateMap: Record<string, { spend: number; sales: number }> = {};
    currentSalesSpends.forEach(s => {
      if (!dateMap[s.date]) dateMap[s.date] = { spend: 0, sales: 0 };
      dateMap[s.date].spend += s.spend;
      dateMap[s.date].sales += s.sales;
    });
    a2sOverTime = Object.entries(dateMap).map(([date, data]) => ({
      date,
      platform: 'Both' as any,
      spend: data.spend,
      sales: data.sales,
      a2s: Number((data.spend / data.sales).toFixed(3))
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  // Survey summary cards (top complaint, promoters, most-loved)
  const complaintsMap: Record<string, number> = {};
  const promoters: Record<string, number> = { Promoter: 0, Passive: 0, Detractor: 0 };
  const lovedFlavourMap: Record<string, number> = {};

  filteredSurveys.forEach(s => {
    if (s.improvement !== 'Nothing, it’s great') {
      complaintsMap[s.improvement] = (complaintsMap[s.improvement] || 0) + 1;
    }
    promoters[s.recommend] = (promoters[s.recommend] || 0) + 1;
    if (s.taste === 'Loved it') {
      lovedFlavourMap[s.flavour] = (lovedFlavourMap[s.flavour] || 0) + 1;
    }
  });

  const topComplaintEntry = Object.entries(complaintsMap).sort((a, b) => b[1] - a[1])[0];
  const topComplaint = topComplaintEntry 
    ? `${topComplaintEntry[0]} (${Math.round((topComplaintEntry[1]/totalSurveys)*100)}% of complaints)`
    : 'No critical complaints';

  const totalPromo = promoters.Promoter + promoters.Passive + promoters.Detractor;
  const promoterSplit = totalPromo > 0 
    ? {
        promoter: Math.round((promoters.Promoter / totalPromo) * 100),
        passive: Math.round((promoters.Passive / totalPromo) * 100),
        detractor: Math.round((promoters.Detractor / totalPromo) * 100),
      }
    : { promoter: 0, passive: 0, detractor: 0 };

  const mostLovedEntry = Object.entries(lovedFlavourMap).sort((a, b) => b[1] - a[1])[0];
  const mostLovedFlavour = mostLovedEntry ? mostLovedEntry[0] : 'None';

  const surveySummary = {
    topComplaint,
    promoterSplit,
    mostLovedFlavour
  };

  return {
    totalSales,
    totalSurveys,
    avgRepurchaseIntent,
    worstA2SPlatform,
    salesByPlatform,
    availabilityDelta,
    salesByFlavour,
    tasteSentiment,
    repurchaseIntent,
    a2sOverTime,
    surveySummary,
  };
}

/**
 * Get all shared analyses
 * TODO: Replace with Supabase CRUD
 */
export async function getSharedAnalyses(): Promise<SharedAnalysis[]> {
  await delay(300);
  return loadSharedAnalyses();
}

/**
 * Share a new analysis / decision card
 * TODO: Replace with Supabase insert
 */
export async function shareAnalysis(
  title: string,
  note: string,
  filterScope: SharedAnalysis['filterScope'],
  previewType: SharedAnalysis['previewType'],
  previewData?: any,
  decisionId?: string
): Promise<SharedAnalysis> {
  await delay(400);
  const list = loadSharedAnalyses();
  
  const newShare: SharedAnalysis = {
    id: `SHA-${Date.now().toString().slice(-3)}`,
    sharedBy: 'Argham Jain (You)',
    sharedAt: new Date().toISOString(),
    note,
    title,
    filterScope,
    previewType,
    previewData,
    decisionId
  };
  
  list.unshift(newShare);
  saveSharedAnalyses(list);
  return newShare;
}

/**
 * Bookmarks / saved items operations
 * TODO: Replace with Supabase tables
 */
export async function getBookmarkedDecisionIds(): Promise<string[]> {
  await delay(100);
  const stored = localStorage.getItem(BOOKMARKS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function toggleBookmarkDecision(id: string): Promise<boolean> {
  const current = await getBookmarkedDecisionIds();
  const exists = current.includes(id);
  let updated: string[];
  
  if (exists) {
    updated = current.filter(item => item !== id);
  } else {
    updated = [...current, id];
  }
  
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
  return !exists; // returns true if bookmarked, false if removed
}

/**
 * Profile Operations
 * TODO: Replace with Supabase auth profile edits
 */
export async function getUserProfile(): Promise<UserProfile> {
  await delay(150);
  const stored = localStorage.getItem(PROFILE_KEY);
  if (!stored) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE));
    return DEFAULT_PROFILE;
  }
  return JSON.parse(stored);
}

export async function updateUserProfile(profile: UserProfile): Promise<UserProfile> {
  await delay(200);
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

const COMPLETED_KEY = 'madmix_completed_decisions';

export async function getCompletedDecisionIds(): Promise<string[]> {
  await delay(100);
  const stored = localStorage.getItem(COMPLETED_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function toggleCompletedDecision(id: string): Promise<boolean> {
  const current = await getCompletedDecisionIds();
  const exists = current.includes(id);
  let updated: string[];
  
  if (exists) {
    updated = current.filter(item => item !== id);
  } else {
    updated = [...current, id];
  }
  
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(updated));
  return !exists; // returns true if added/marked completed, false if removed
}

