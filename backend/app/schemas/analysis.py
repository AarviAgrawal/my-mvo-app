from pydantic import BaseModel


class PlatformValue(BaseModel):
    name: str
    value: float


class PodsDeltaItem(BaseModel):
    city: str
    platform: str
    aprMrp: float
    mayMrp: float
    deltaPct: float  # (may - apr) / apr; negative = decline


class A2SDataPoint(BaseModel):
    date: str
    platform: str
    spend: float
    sales: float
    a2s: float


class WorstA2SPlatform(BaseModel):
    platform: str
    ratio: float


class SkipRateItem(BaseModel):
    city: str
    skipRate: float        # 0.0–1.0
    totalRespondents: int


class FreqItem(BaseModel):
    name: str   # 'Daily' | 'Few times a week' | 'Monthly' | 'Rarely'
    value: int  # count


class PlatformGapSummary(BaseModel):
    blinkitPct: float   # % of respondents who shop on Blinkit
    zeptoPct: float     # % of respondents who shop on Zepto
    otherPct: float     # BigBasket / Amazon / Instamart / Other from survey
    insight: str        # e.g. "61% of surveyed customers shop on Blinkit or Zepto..."


class AnalysisResponse(BaseModel):
    # Commerce metrics (from pods_sales + sku_sales)
    totalSalesMrp: float
    totalPodsSalesMrp: float
    salesByPlatform: list[PlatformValue]
    salesByFlavour: list[PlatformValue]
    podsSalesDelta: list[PodsDeltaItem]
    a2sOverTime: list[A2SDataPoint]
    worstA2SPlatform: WorstA2SPlatform | None

    # Survey signals (from survey_responses)
    totalSurveyResponses: int
    skipRateByCity: list[SkipRateItem]
    consumptionFrequencyBreakdown: list[FreqItem]
    platformGap: PlatformGapSummary
    pincodeAvailabilityRate: float  # 0.0–1.0

    # Derived survey intelligence
    ageGroupBreakdown: list[FreqItem]         # demographic distribution of respondents
    highFrequencyBuyerPct: float              # 0.0–1.0: fraction buying Daily or Few times a week
    unmetDemandScore: float                   # 0.0–1.0: composite skip_rate×0.5 + gap_pct×0.5
    estimatedMissedRevenueMultiple: float     # gap_pct / listed_pct (capped 5.0); multiply by revenue for opportunity


class HotCityItem(BaseModel):
    city: str
    state: str | None
    sparkline: list[float]   # monthly sales MRP trend (oldest → newest)
    whyItIsHot: str
    severity: str            # 'high' | 'grow' | 'monitor'
    trend: str               # 'up' | 'down' | 'flat'
