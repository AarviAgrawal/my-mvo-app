import { PodsAvailability, SkuSales, SalesSpends, SurveyResponse, Decision } from '../../types';

// Geo and platform helper mappings
export const STATE_CITY_MAPPING: Record<string, string[]> = {
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Kolhapur', 'Nashik', 'Aurangabad', 'Latur', 'Nanded', 'Amravati'],
  'Karnataka': ['Bangalore', 'Mangaluru', 'Mysore', 'Hubli', 'Manipal', 'Tumakuru', 'Belgaum'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Anand', 'Vapi'],
  'Delhi': ['Delhi'],
  'Haryana': ['Gurgaon', 'Chandigarh Tricity', 'Rohtak', 'Sonipat'],
  'Uttar Pradesh': ['Noida', 'Agra', 'Meerut', 'Lucknow'],
  'West Bengal': ['Kolkata', 'Siliguri'],
  'Jharkhand': ['Ranchi', 'Ranchi Rural', 'Jamshedpur'],
  'Bihar': ['Patna'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Gwalior', 'Ujjain'],
  'Rajasthan': ['Jaipur', 'Udaipur', 'Ajmer', 'Kota', 'Jodhpur'],
  'Goa': ['Central Goa'],
  'Andhra Pradesh': ['Vijayawada', 'Vizag', 'Guntur', 'Tirupati', 'Bhimavaram'],
  'Telangana': ['Hyderabad', 'Hyderabad Rural', 'Karimnagar'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tirupur'],
  'Kerala': ['Kochi', 'Palakkad', 'Thiruvananthapuram'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh'],
  'Odisha': ['Bhubaneswar', 'Berhampur'],
  'Uttarakhand': ['DehraDun']
};

export const CITY_PINCODES: Record<string, string[]> = {
  'Mumbai': ['400001', '400050', '400097'],
  'Pune': ['411001', '411014'],
  'Nagpur': ['440001'],
  'Kolhapur': ['416001'],
  'Nashik': ['422001'],
  'Aurangabad': ['431001'],
  'Latur': ['413512'],
  'Nanded': ['431601'],
  'Amravati': ['444601'],
  'Bangalore': ['560001', '560038', '560066'],
  'Mangaluru': ['575001'],
  'Mysore': ['570001'],
  'Hubli': ['580020'],
  'Manipal': ['576104'],
  'Tumakuru': ['572101'],
  'Belgaum': ['590001'],
  'Ahmedabad': ['380001', '380015'],
  'Surat': ['395001', '395007'],
  'Vadodara': ['390001'],
  'Rajkot': ['360001'],
  'Anand': ['388001'],
  'Vapi': ['396191'],
  'Delhi': ['110001', '110020'],
  'Gurgaon': ['122001', '122018'],
  'Chandigarh Tricity': ['160001'],
  'Rohtak': ['124001'],
  'Sonipat': ['131001'],
  'Noida': ['201301'],
  'Agra': ['282001'],
  'Meerut': ['250001'],
  'Lucknow': ['226001'],
  'Kolkata': ['700001', '700091'],
  'Siliguri': ['734001'],
  'Ranchi': ['834001'],
  'Ranchi Rural': ['834005'],
  'Jamshedpur': ['831001'],
  'Patna': ['800001'],
  'Indore': ['452001'],
  'Bhopal': ['462001'],
  'Gwalior': ['474001'],
  'Ujjain': ['456001'],
  'Jaipur': ['302001'],
  'Udaipur': ['313001'],
  'Ajmer': ['305001'],
  'Kota': ['324001'],
  'Jodhpur': ['342001'],
  'Central Goa': ['403001'],
  'Vijayawada': ['520001'],
  'Vizag': ['530001'],
  'Guntur': ['522001'],
  'Tirupati': ['517501'],
  'Bhimavaram': ['534201'],
  'Hyderabad': ['500001', '500032', '500081'],
  'Hyderabad Rural': ['501510'],
  'Karimnagar': ['505001'],
  'Chennai': ['600001', '600028'],
  'Coimbatore': ['641001'],
  'Madurai': ['625001'],
  'Tirupur': ['641601'],
  'Kochi': ['682001'],
  'Palakkad': ['678001'],
  'Thiruvananthapuram': ['695001'],
  'Guwahati': ['781001'],
  'Silchar': ['788001'],
  'Dibrugarh': ['786001'],
  'Bhubaneswar': ['751001'],
  'Berhampur': ['760001'],
  'DehraDun': ['248001']
};

export const FLAVOUR_LINE_MAPPING: Record<string, string> = {
  'Aloo Sev Millet Bhujia': 'Baked Millet Bhujia',
  'BBQ Blast Millet Bhujia': 'Baked Millet Bhujia',
  'Chaat Corner Quinoa Millet Puffs': 'Baked Millet Puffs',
  'Masala Masti Bhujia': 'Baked Millet Bhujia',
  'Pudina Picnic Bhujia': 'Baked Millet Bhujia',
  'Tangy Twist Bhujia': 'Baked Millet Bhujia',
  'Pizza Party Quinoa Puffs': 'Baked Millet Puffs',
  'Flavoured Raisins': 'Flavoured Raisins',
  'Combos': 'Combos',
};

export const SKUS = Object.keys(FLAVOUR_LINE_MAPPING);

export interface RawCityData {
  city: string;
  bb_apr?: number;
  bb_may?: number;
  im_apr?: number;
  im_may?: number;
}

export const RAW_CITY_DATA: RawCityData[] = [
  { city: 'Gurgaon', bb_apr: 52050, bb_may: 44480 },
  { city: 'Hyderabad', bb_apr: 43330, bb_may: 38575, im_apr: 1300, im_may: 475 },
  { city: 'Bangalore', bb_apr: 40900, bb_may: 39985, im_apr: 28675, im_may: 19050 },
  { city: 'Mumbai', bb_apr: 36930, bb_may: 38240, im_apr: 2825, im_may: 1725 },
  { city: 'Pune', bb_apr: 26625, bb_may: 24175, im_apr: 5125, im_may: 2750 },
  { city: 'Chennai', bb_apr: 20940, bb_may: 14185, im_apr: 750, im_may: 375 },
  { city: 'Noida', bb_apr: 11700, bb_may: 7345, im_apr: 50, im_may: 500 },
  { city: 'Kolkata', bb_apr: 13365, bb_may: 10645, im_apr: 125, im_may: 125 },
  { city: 'Ahmedabad', bb_apr: 10765, bb_may: 15125, im_apr: 6500, im_may: 4825 },
  { city: 'Ranchi', bb_apr: 9105, bb_may: 8170, im_apr: 900, im_may: 300 },
  { city: 'DehraDun', bb_apr: 1260, bb_may: 1670 },
  { city: 'Chandigarh Tricity', bb_apr: 3125, bb_may: 2885 },
  { city: 'Mangaluru', bb_apr: 1060, bb_may: 1525, im_apr: 6125, im_may: 500 },
  { city: 'Mysore', bb_apr: 565, bb_may: 500, im_apr: 1925, im_may: 700 },
  { city: 'Agra', bb_apr: 960, bb_may: 850 },
  { city: 'Hyderabad Rural', bb_apr: 245, bb_may: 250 },
  { city: 'Ranchi Rural', bb_apr: 100, bb_may: 0 },
  { city: 'Ajmer', im_apr: 1050, im_may: 250 },
  { city: 'Amravati', im_apr: 125, im_may: 250 },
  { city: 'Anand', im_apr: 375, im_may: 625 },
  { city: 'Aurangabad', im_apr: 875, im_may: 500 },
  { city: 'Belgaum', im_apr: 650, im_may: 650 },
  { city: 'Berhampur', im_apr: 875, im_may: 500 },
  { city: 'Bhimavaram', im_apr: 100, im_may: 0 },
  { city: 'Bhopal', im_apr: 3500, im_may: 3625 },
  { city: 'Bhubaneswar', im_apr: 1100, im_may: 1975 },
  { city: 'Bilaspur', im_apr: 125, im_may: 250 },
  { city: 'Central Goa', im_apr: 3375, im_may: 5350 },
  { city: 'Coimbatore', im_apr: 500, im_may: 250 },
  { city: 'Dibrugarh', im_apr: 1050, im_may: 1050 },
  { city: 'Faridabad', im_apr: 250, im_may: 750 },
  { city: 'Guwahati', im_apr: 775, im_may: 1975 },
  { city: 'Gwalior', im_apr: 250, im_may: 250 },
  { city: 'Hubli', im_apr: 425, im_may: 300 },
  { city: 'Indore', im_apr: 3372, im_may: 2125 },
  { city: 'Jaipur', im_apr: 2800, im_may: 1600 },
  { city: 'Jamshedpur', im_apr: 50, im_may: 50 },
  { city: 'Kochi', im_apr: 700, im_may: 1100 },
  { city: 'Kolhapur', im_apr: 450, im_may: 800 },
  { city: 'Kota', im_apr: 1075, im_may: 1000 },
  { city: 'Latur', im_apr: 125, im_may: 250 },
  { city: 'Lonavla', im_apr: 625, im_may: 625 },
  { city: 'Madurai', im_apr: 200, im_may: 200 },
  { city: 'Manipal', im_apr: 400, im_may: 100 },
  { city: 'Meerut', im_apr: 250, im_may: 125 },
  { city: 'Nagpur', im_apr: 2800, im_may: 2575 },
  { city: 'Nanded', im_apr: 250, im_may: 250 },
  { city: 'Nashik', im_apr: 325, im_may: 575 },
  { city: 'Palakkad', im_apr: 100, im_may: 100 },
  { city: 'Patna', im_apr: 100, im_may: 125 },
  { city: 'Pondicherry', im_apr: 200, im_may: 100 },
  { city: 'Rajkot', im_apr: 625, im_may: 875 },
  { city: 'Rohtak', im_apr: 375, im_may: 375 },
  { city: 'Silchar', im_apr: 950, im_may: 675 },
  { city: 'Siliguri', im_apr: 450, im_may: 400 },
  { city: 'Sonipat', im_apr: 125, im_may: 125 },
  { city: 'Surat', im_apr: 2500, im_may: 2000 },
  { city: 'Thiruvananthapuram', im_apr: 725, im_may: 725 },
  { city: 'Tirupati', im_apr: 575, im_may: 225 },
  { city: 'Tumakuru', im_apr: 725, im_may: 375 },
  { city: 'Udaipur', im_apr: 2250, im_may: 1500 },
  { city: 'Ujjain', im_apr: 125, im_may: 125 },
  { city: 'Vadodara', im_apr: 1000, im_may: 2125 },
  { city: 'Vapi', im_apr: 500, im_may: 375 },
  { city: 'Vijayawada', im_apr: 1075, im_may: 750 },
  { city: 'Vizag', im_apr: 200, im_may: 125 }
];

// 1. PODs Availability Seed Data
export const SEED_PODS_AVAILABILITY: PodsAvailability[] = [];

// 2. SKU-level Sales Seed Data
export const SEED_SKU_SALES: SkuSales[] = [];

// Base SKU distribution coefficients
const SKU_DISTRIBUTION: Record<string, { fraction: number; line: string }> = {
  'Aloo Sev Millet Bhujia': { fraction: 0.30, line: 'Baked Millet Bhujia' },
  'BBQ Blast Millet Bhujia': { fraction: 0.15, line: 'Baked Millet Bhujia' },
  'Chaat Corner Quinoa Millet Puffs': { fraction: 0.12, line: 'Baked Millet Puffs' },
  'Masala Masti Bhujia': { fraction: 0.18, line: 'Baked Millet Bhujia' },
  'Pudina Picnic Bhujia': { fraction: 0.08, line: 'Baked Millet Bhujia' },
  'Tangy Twist Bhujia': { fraction: 0.10, line: 'Baked Millet Bhujia' },
  'Pizza Party Quinoa Puffs': { fraction: 0.05, line: 'Baked Millet Puffs' },
  'Flavoured Raisins': { fraction: 0.02, line: 'Flavoured Raisins' }
};

// Generate POD Availability and SKU Sales
RAW_CITY_DATA.forEach(d => {
  // 1. POD Availability
  if (d.bb_apr !== undefined && d.bb_may !== undefined) {
    SEED_PODS_AVAILABILITY.push({ city: d.city, platform: 'Big Basket', month: 'Apr 2026', value: d.bb_apr });
    SEED_PODS_AVAILABILITY.push({ city: d.city, platform: 'Big Basket', month: 'May 2026', value: d.bb_may });
  }
  if (d.im_apr !== undefined && d.im_may !== undefined) {
    SEED_PODS_AVAILABILITY.push({ city: d.city, platform: 'Instamart', month: 'Apr 2026', value: d.im_apr });
    SEED_PODS_AVAILABILITY.push({ city: d.city, platform: 'Instamart', month: 'May 2026', value: d.im_may });
  }
  // Populate proportional Amazon PODs values (e.g. ~40% of standard)
  const baseValue = d.bb_apr ?? d.im_apr ?? 500;
  const amz_apr = Math.round(baseValue * 0.35);
  const amz_may = Math.round(baseValue * 0.38);
  SEED_PODS_AVAILABILITY.push({ city: d.city, platform: 'Amazon', month: 'Apr 2026', value: amz_apr });
  SEED_PODS_AVAILABILITY.push({ city: d.city, platform: 'Amazon', month: 'May 2026', value: amz_may });

  // 2. SKU Sales
  const multiplier = 4.5;
  
  if (d.bb_may !== undefined) {
    const bbTotalSales = Math.round(d.bb_may * multiplier);
    Object.entries(SKU_DISTRIBUTION).forEach(([sku, info]) => {
      const variance = 0.85 + Math.random() * 0.3;
      SEED_SKU_SALES.push({
        sku,
        line: info.line,
        city: d.city,
        platform: 'Big Basket',
        salesMrp: Math.round(bbTotalSales * info.fraction * variance)
      });
    });
  }

  if (d.im_may !== undefined) {
    const imTotalSales = Math.round(d.im_may * multiplier);
    Object.entries(SKU_DISTRIBUTION).forEach(([sku, info]) => {
      let fraction = info.fraction;
      if (d.city === 'Ahmedabad' && sku === 'BBQ Blast Millet Bhujia') {
        fraction = 0.03; // severely depressed for DEC-001 evidence
      }
      const variance = 0.85 + Math.random() * 0.3;
      SEED_SKU_SALES.push({
        sku,
        line: info.line,
        city: d.city,
        platform: 'Instamart',
        salesMrp: Math.round(imTotalSales * fraction * variance)
      });
    });
  }

  const baseMayValue = d.bb_may ?? d.im_may ?? 500;
  const amzTotalSales = Math.round(baseMayValue * 0.35 * multiplier);
  Object.entries(SKU_DISTRIBUTION).forEach(([sku, info]) => {
    let fraction = info.fraction;
    if (d.city === 'Surat' && sku === 'Pizza Party Quinoa Puffs') {
      fraction = 0.01; // severely depressed for DEC-002 evidence
    }
    const variance = 0.85 + Math.random() * 0.3;
    SEED_SKU_SALES.push({
      sku,
      line: info.line,
      city: d.city,
      platform: 'Amazon',
      salesMrp: Math.round(amzTotalSales * fraction * variance)
    });
  });
});

// 3. Sales vs Spends Seed Data
export const SEED_SALES_SPENDS: SalesSpends[] = [];

const generateSalesSpends = () => {
  for (let day = 1; day <= 30; day++) {
    const dateStr = `2026-04-${day.toString().padStart(2, '0')}`;
    
    const isWeek3 = day >= 15 && day <= 21;
    const imSales = Math.round(60000 + Math.sin(day) * 12000);
    const imSpend = isWeek3 
      ? Math.round(imSales * (0.72 + Math.random() * 0.08)) 
      : Math.round(imSales * (0.22 + Math.random() * 0.06));
    
    SEED_SALES_SPENDS.push({
      date: dateStr,
      platform: 'Instamart',
      sales: imSales,
      spend: imSpend,
      a2s: Number((imSpend / imSales).toFixed(3))
    });

    const bbSales = Math.round(38000 + Math.cos(day) * 8000);
    const bbSpend = Math.round(bbSales * (0.24 + Math.random() * 0.05));
    
    SEED_SALES_SPENDS.push({
      date: dateStr,
      platform: 'Big Basket',
      sales: bbSales,
      spend: bbSpend,
      a2s: Number((bbSpend / bbSales).toFixed(3))
    });
  }
};
generateSalesSpends();

// 4. Customer Survey Seed Data
export const SEED_SURVEY_RESPONSES: SurveyResponse[] = [];

const generateSurveyResponses = () => {
  let responseId = 1;
  const channels: Array<SurveyResponse['commerce']> = ['Instamart', 'Big Basket', 'Amazon', 'Local Store', 'Other'];

  // Specific group 1: BBQ Blast in Ahmedabad on Instamart
  for (let i = 0; i < 28; i++) {
    const isLoved = i === 5 || i === 18;
    SEED_SURVEY_RESPONSES.push({
      id: `SR-${responseId++}`,
      submittedAt: `2026-05-${(i % 25 + 1).toString().padStart(2, '0')}T14:30:00Z`,
      state: 'Gujarat',
      city: 'Ahmedabad',
      pincode: i % 2 === 0 ? '380001' : '380015',
      commerce: 'Instamart',
      flavour: 'BBQ Blast Millet Bhujia',
      line: 'Baked Millet Bhujia',
      taste: isLoved ? 'Liked it' : (i % 3 === 0 ? 'Didn’t like it' : 'It was okay'),
      repurchase: isLoved ? 'Maybe' : 'No',
      recommend: isLoved ? 'Passive' : 'Detractor',
      improvement: 'Too spicy',
      snackFrequency: 'Occasionally',
    });
  }

  // Specific group 2: Aloo Sev Millet Bhujia in Bangalore, Big Basket
  for (let i = 0; i < 35; i++) {
    const isOkay = i === 12;
    SEED_SURVEY_RESPONSES.push({
      id: `SR-${responseId++}`,
      submittedAt: `2026-05-${(i % 28 + 1).toString().padStart(2, '0')}T10:15:00Z`,
      state: 'Karnataka',
      city: 'Bangalore',
      pincode: i % 3 === 0 ? '560001' : (i % 3 === 1 ? '560038' : '560066'),
      commerce: 'Big Basket',
      flavour: 'Aloo Sev Millet Bhujia',
      line: 'Baked Millet Bhujia',
      taste: isOkay ? 'It was okay' : 'Loved it',
      repurchase: isOkay ? 'Maybe' : 'Definitely',
      recommend: isOkay ? 'Passive' : 'Promoter',
      improvement: 'Nothing, it’s great',
      snackFrequency: i % 2 === 0 ? 'Daily' : 'Few times a week',
    });
  }

  // Specific group 3: Pizza Party Quinoa Puffs in Surat, Amazon
  for (let i = 0; i < 6; i++) {
    SEED_SURVEY_RESPONSES.push({
      id: `SR-${responseId++}`,
      submittedAt: `2026-05-12T16:40:00Z`,
      state: 'Gujarat',
      city: 'Surat',
      pincode: '395001',
      commerce: 'Amazon',
      flavour: 'Pizza Party Quinoa Puffs',
      line: 'Baked Millet Puffs',
      taste: 'Didn’t like it',
      repurchase: 'No',
      recommend: 'Detractor',
      improvement: i % 2 === 0 ? 'Texture' : 'Packaging',
      snackFrequency: 'Rarely',
    });
  }

  // Specific group 4: Tangy Twist Bhujia in Surat, Instamart
  for (let i = 0; i < 18; i++) {
    SEED_SURVEY_RESPONSES.push({
      id: `SR-${responseId++}`,
      submittedAt: `2026-05-${(i % 15 + 1).toString().padStart(2, '0')}T11:05:00Z`,
      state: 'Gujarat',
      city: 'Surat',
      pincode: '395007',
      commerce: 'Instamart',
      flavour: 'Tangy Twist Bhujia',
      line: 'Baked Millet Bhujia',
      taste: i % 2 === 0 ? 'Liked it' : 'It was okay',
      repurchase: 'Maybe',
      recommend: 'Passive',
      improvement: i % 3 === 0 ? 'Price too high' : 'Nothing, it’s great',
      snackFrequency: 'Few times a week',
    });
  }

  // Rest of responses to build a solid baseline across all 50+ cities!
  const statesList = Object.keys(STATE_CITY_MAPPING);
  const improvements: SurveyResponse['improvement'][] = ['Too spicy', 'Too bland', 'Texture', 'Price too high', 'Packaging', 'Nothing, it’s great'];
  const frequencies: SurveyResponse['snackFrequency'][] = ['Daily', 'Few times a week', 'Occasionally', 'Rarely'];

  for (let i = 0; i < 150; i++) {
    const state = statesList[i % statesList.length];
    const citiesInState = STATE_CITY_MAPPING[state];
    const city = citiesInState[i % citiesInState.length];
    const pincodes = CITY_PINCODES[city] || ['110001'];
    const pincode = pincodes[i % pincodes.length];
    const commerce = channels[i % channels.length];
    const flavour = SKUS[i % SKUS.length];
    const line = FLAVOUR_LINE_MAPPING[flavour];

    const tasteRand = Math.random();
    const taste = tasteRand > 0.65 ? 'Loved it' : (tasteRand > 0.30 ? 'Liked it' : (tasteRand > 0.12 ? 'It was okay' : 'Didn’t like it'));
    
    const repurchase = taste === 'Loved it' ? 'Definitely' : (taste === 'Liked it' ? 'Maybe' : 'No');
    const recommend = taste === 'Loved it' ? 'Promoter' : (taste === 'Liked it' ? 'Passive' : 'Detractor');
    const improvement = taste === 'Loved it' ? 'Nothing, it’s great' : improvements[Math.floor(Math.random() * improvements.length)];
    const snackFrequency = frequencies[i % frequencies.length];

    SEED_SURVEY_RESPONSES.push({
      id: `SR-${responseId++}`,
      submittedAt: `2026-05-${(i % 28 + 1).toString().padStart(2, '0')}T08:00:00Z`,
      state,
      city,
      pincode,
      commerce,
      flavour,
      line,
      taste,
      repurchase,
      recommend,
      improvement,
      snackFrequency,
    });
  }
};
generateSurveyResponses();

// 5. High-fidelity Business Decisions Seed Data
export const SEED_DECISIONS: Decision[] = [
  {
    id: "DEC-001",
    action: "Cut BBQ Blast Bhujia stock on Instamart in Ahmedabad",
    type: "reduce",
    severity: "high",
    confidence: 94,
    flavour: "BBQ Blast Millet Bhujia",
    city: "Ahmedabad",
    state: "Gujarat",
    platform: "Instamart",
    reasoning: "Sales have plummeted by 58% from April to May, directly caused by persistent taste complaints. 82% of surveyed customers in Ahmedabad call it 'Too spicy' and declare zero repurchase intent.",
    evidence: [
      {
        label: "Instamart availability dropped sharply",
        detail: "PODs availability score sank from 78% in April to 32% in May 2026.",
        source: "PODs Availability",
        trend: "down"
      },
      {
        label: "Customer Taste Backlash",
        detail: "82% of customer survey respondents (23 out of 28) flagged BBQ Blast as 'Too spicy'.",
        source: "Customer Survey",
        trend: "down"
      },
      {
        label: "Negligible Repurchase Intent",
        detail: "0% of survey respondents indicated they would repurchase ('No' repurchase intent dominates).",
        source: "Customer Survey",
        trend: "down"
      },
      {
        label: "Substandard Sales Volume",
        detail: "Total sales MRP for BBQ Blast is only ₹18,000, making it the lowest-selling Bhujia in Ahmedabad.",
        source: "PODs Sales",
        trend: "down"
      }
    ],
    rawDataRefs: [
      {
        source: "PODs Availability",
        rows: [
          { month: "Apr 2026", platform: "Instamart", city: "Ahmedabad", value: 78 },
          { month: "May 2026", platform: "Instamart", city: "Ahmedabad", value: 32 }
        ]
      },
      {
        source: "Customer Survey",
        rows: [
          { improvement: "Too spicy", count: 23, total_responses: 28, percentage: "82%" },
          { repurchase_intent_no: 25, repurchase_intent_maybe: 3, repurchase_intent_yes: 0 }
        ]
      }
    ],
    createdAt: "2026-06-25T12:00:00Z"
  },
  {
    id: "DEC-002",
    action: "Pull Pizza Party Puffs from Amazon in Surat",
    type: "remove",
    severity: "high",
    confidence: 89,
    flavour: "Pizza Party Quinoa Puffs",
    city: "Surat",
    state: "Gujarat",
    platform: "Amazon",
    reasoning: "Pizza Party Puffs are generating near-zero monthly revenue (₹6,000) on Amazon in Surat, despite the brand sustaining a high distribution rate of 78%. Customers complain of rubbery texture and defective packaging.",
    evidence: [
      {
        label: "Dismal Revenue Output",
        detail: "Surat Instamart/Amazon generated just ₹6,000 sales MRP, rendering it non-viable.",
        source: "PODs Sales",
        trend: "flat"
      },
      {
        label: "High Inventory Overhead",
        detail: "Distribution availability is sitting at 78% on Amazon, tying up working capital in dead stock.",
        source: "PODs Availability",
        trend: "flat"
      },
      {
        label: "Severe Sentiment Issues",
        detail: "100% of survey responses (6 out of 6) rated it 'Didn't like it' citing texture and packaging defects.",
        source: "Customer Survey",
        trend: "down"
      }
    ],
    rawDataRefs: [
      {
        source: "PODs Sales",
        rows: [
          { sku: "Pizza Party Quinoa Puffs", city: "Surat", platform: "Amazon", sales_mrp: 6000 }
        ]
      },
      {
        source: "Customer Survey",
        rows: [
          { complaint: "Texture / Rubberiness", count: 3 },
          { complaint: "Packaging / Stale product", count: 3 }
        ]
      }
    ],
    createdAt: "2026-06-25T11:45:00Z"
  },
  {
    id: "DEC-003",
    action: "Double Aloo Sev Bhujia inventory in Bangalore (Big Basket)",
    type: "grow",
    severity: "high",
    confidence: 96,
    flavour: "Aloo Sev Millet Bhujia",
    city: "Bangalore",
    state: "Karnataka",
    platform: "Big Basket",
    reasoning: "Aloo Sev Millet Bhujia is experiencing explosive organic demand in Bangalore. It is our absolute best-seller on Big Basket (₹145,000) with a flawless 100% customer promoter rate. We must double our warehouse allocation to prevent stockouts.",
    evidence: [
      {
        label: "Outstanding Market Share",
        detail: "Big Basket Bangalore logged ₹145,000 sales MRP for Aloo Sev alone — 38% of all Bhujia sales.",
        source: "PODs Sales",
        trend: "up"
      },
      {
        label: "Impeccable Customer Response",
        detail: "97% of Bangalore survey respondents (34 of 35) rated it 'Loved it' and marked it 'Definitely' for repurchase.",
        source: "Customer Survey",
        trend: "up"
      },
      {
        label: "Low Stock-out Buffers",
        detail: "Big Basket availability grew from 82% to 89% in May, but is lagging behind the 95% baseline needed for high velocity.",
        source: "PODs Availability",
        trend: "up"
      }
    ],
    rawDataRefs: [
      {
        source: "PODs Sales",
        rows: [
          { sku: "Aloo Sev Millet Bhujia", city: "Bangalore", platform: "Big Basket", sales_mrp: 145000 },
          { total_platform_bhujia_sales: 382000, market_share: "38.0%" }
        ]
      },
      {
        source: "Customer Survey",
        rows: [
          { taste_rating: "Loved it", responses: 34, percentage: "97.1%" },
          { repurchase_intent: "Definitely", responses: 34, percentage: "97.1%" }
        ]
      }
    ],
    createdAt: "2026-06-25T11:00:00Z"
  },
  {
    id: "DEC-004",
    action: "Slash Instamart Ad Spends in Week 3",
    type: "spend",
    severity: "medium",
    confidence: 85,
    platform: "Instamart",
    reasoning: "Instamart's marketing efficiency collapsed in the third week of April, with Ad-to-Sales (A2S) ratios ballooning to an unsustainable 0.77. Slashed bids on low-ROI banner advertisements will save approximately ₹1.8 Lakhs.",
    evidence: [
      {
        label: "Inefficient Week 3 Budgets",
        detail: "A2S ratios spiked to an average of 77% between April 15 and April 21, compared to a healthy 25% average in other weeks.",
        source: "Sales vs Spends",
        trend: "up"
      },
      {
        label: "Unresponsive Sales Baseline",
        detail: "Ad spend doubled from ₹17k/day to ₹54k/day, but sales remained flat around ₹70k/day, showing no advertising elasticity.",
        source: "Sales vs Spends",
        trend: "flat"
      }
    ],
    rawDataRefs: [
      {
        source: "Sales vs Spends",
        rows: [
          { timeframe: "Apr 1 to Apr 14 (Avg)", daily_spend: 16500, daily_sales: 64200, a2s: 0.257 },
          { timeframe: "Apr 15 to Apr 21 (Week 3 Avg)", daily_spend: 53800, daily_sales: 69500, a2s: 0.774 },
          { timeframe: "Apr 22 to Apr 30 (Avg)", daily_spend: 17200, daily_sales: 67800, a2s: 0.253 }
        ]
      }
    ],
    createdAt: "2026-06-24T09:30:00Z"
  },
  {
    id: "DEC-005",
    action: "Monitor Tangy Twist Bhujia Performance in Surat",
    type: "monitor",
    severity: "low",
    confidence: 76,
    flavour: "Tangy Twist Bhujia",
    city: "Surat",
    state: "Gujarat",
    platform: "Instamart",
    reasoning: "Tangy Twist sales on Surat Instamart are holding flat at ₹41,000, but customer sentiment is rising with 100% of respondents showing 'Maybe' repurchase intent. Stock levels are stable; monitor next month's numbers.",
    evidence: [
      {
        label: "Stable Revenue Stream",
        detail: "Sales are steady at ₹41,000, indicating an active but non-explosive consumer base.",
        source: "PODs Sales",
        trend: "flat"
      },
      {
        label: "High Latent Interest",
        detail: "18 out of 18 surveyed consumers are in the 'Maybe' bucket — highly susceptible to word-of-mouth or point-of-sale discounts.",
        source: "Customer Survey",
        trend: "flat"
      }
    ],
    rawDataRefs: [
      {
        source: "PODs Sales",
        rows: [
          { sku: "Tangy Twist Bhujia", city: "Surat", sales_mrp: 41000 }
        ]
      },
      {
        source: "Customer Survey",
        rows: [
          { repurchase_intent: "Maybe", count: 18, percentage: "100%" }
        ]
      }
    ],
    createdAt: "2026-06-23T15:00:00Z"
  },
  {
    id: "DEC-006",
    action: "Boost Masala Masti Bhujia stock in Mumbai (Instamart)",
    type: "grow",
    severity: "medium",
    confidence: 90,
    flavour: "Masala Masti Bhujia",
    city: "Mumbai",
    state: "Maharashtra",
    platform: "Instamart",
    reasoning: "Masala Masti is highly profitable in Mumbai (₹165,000), but distribution availability dropped 2% from April to May. Ensuring constant filling will seize an estimated ₹25,000 in unfulfilled monthly sales.",
    evidence: [
      {
        label: "Strong Sales Performance",
        detail: "Second highest sales generator in Mumbai Instamart, bringing in ₹1.65L.",
        source: "PODs Sales",
        trend: "up"
      },
      {
        label: "Minor Availability Leak",
        detail: "Availability dropped from 94% to 92%, causing minor out-of-stock leakages during peak weekends.",
        source: "PODs Availability",
        trend: "down"
      }
    ],
    rawDataRefs: [
      {
        source: "PODs Sales",
        rows: [
          { sku: "Masala Masti Bhujia", city: "Mumbai", platform: "Instamart", sales_mrp: 165000 }
        ]
      },
      {
        source: "PODs Availability",
        rows: [
          { city: "Mumbai", platform: "Instamart", month: "Apr 2026", value: 94 },
          { city: "Mumbai", platform: "Instamart", month: "May 2026", value: 92 }
        ]
      }
    ],
    createdAt: "2026-06-22T10:00:00Z"
  }
];
