"""
metrics.py — Aggregation service for /api/v1/analysis
Reproduces the in-memory getAnalysis() logic from the frontend as server-side Supabase queries.
"""

from collections import defaultdict

from supabase import Client

from app.db.constants import get_cities_for_state
from app.schemas.analysis import (
    A2SDataPoint,
    AnalysisResponse,
    FreqItem,
    PlatformGapSummary,
    PlatformValue,
    PodsDeltaItem,
    SkipRateItem,
    WorstA2SPlatform,
)


def _filter_cities(state: str, city: str) -> list[str] | None:
    """Return list of cities to filter by, or None if no geo filter."""
    if city:
        return [city]
    if state:
        cities = get_cities_for_state(state)
        return cities if cities else None
    return None


def aggregate_analysis(
    db: Client,
    state: str = '',
    city: str = '',
    pincode: str = '',
    platform: str = '',
    flavour: str = '',
) -> AnalysisResponse:

    city_filter = _filter_cities(state, city)

    # ----------------------------------------------------------------
    # 1. pods_sales — city-level MRP aggregation
    # ----------------------------------------------------------------
    pods_q = db.table('pods_sales').select('city, platform, month, sales_mrp')
    if platform:
        pods_q = pods_q.eq('platform', platform)
    if city_filter:
        pods_q = pods_q.in_('city', city_filter)
    pods_rows = pods_q.execute().data or []

    total_pods_mrp = sum(r['sales_mrp'] for r in pods_rows)

    # salesByPlatform: group by platform, sum across all months
    platform_sums: dict[str, float] = defaultdict(float)
    for r in pods_rows:
        platform_sums[r['platform']] += r['sales_mrp']
    sales_by_platform = [PlatformValue(name=k, value=v) for k, v in sorted(platform_sums.items())]

    # podsSalesDelta: per city+platform, compare Apr vs May
    delta_map: dict[tuple, dict] = {}
    for r in pods_rows:
        key = (r['city'], r['platform'])
        if key not in delta_map:
            delta_map[key] = {'apr': 0.0, 'may': 0.0}
        if 'Apr' in r['month']:
            delta_map[key]['apr'] += r['sales_mrp']
        elif 'May' in r['month']:
            delta_map[key]['may'] += r['sales_mrp']

    pods_delta: list[PodsDeltaItem] = []
    for (c, p), v in delta_map.items():
        apr_mrp = v['apr']
        may_mrp = v['may']
        delta_pct = ((may_mrp - apr_mrp) / apr_mrp) if apr_mrp > 0 else 0.0
        pods_delta.append(PodsDeltaItem(
            city=c, platform=p, aprMrp=apr_mrp, mayMrp=may_mrp, deltaPct=round(delta_pct, 4)
        ))
    pods_delta.sort(key=lambda x: x.deltaPct)  # worst declines first

    # ----------------------------------------------------------------
    # 2. sku_sales — SKU-level MRP aggregation
    # ----------------------------------------------------------------
    sku_q = db.table('sku_sales').select('sku, city, platform, sales_mrp')
    if platform:
        sku_q = sku_q.eq('platform', platform)
    if city_filter:
        sku_q = sku_q.in_('city', city_filter)
    if flavour:
        sku_q = sku_q.eq('sku', flavour)
    sku_rows = sku_q.execute().data or []

    total_sales_mrp = sum(r['sales_mrp'] for r in sku_rows)

    flavour_sums: dict[str, float] = defaultdict(float)
    for r in sku_rows:
        flavour_sums[r['sku']] += r['sales_mrp']
    sales_by_flavour = sorted(
        [PlatformValue(name=k, value=v) for k, v in flavour_sums.items()],
        key=lambda x: x.value, reverse=True
    )[:8]

    # ----------------------------------------------------------------
    # 3. sales_spends — daily A2S data
    # ----------------------------------------------------------------
    spends_q = db.table('sales_spends').select('date, platform, spend, sales, a2s').order('date')
    if platform:
        spends_q = spends_q.eq('platform', platform)
    spends_rows = spends_q.execute().data or []

    a2s_over_time = [
        A2SDataPoint(
            date=r['date'],
            platform=r['platform'],
            spend=r['spend'],
            sales=r['sales'],
            a2s=float(r['a2s'] or 0),
        )
        for r in spends_rows
    ]

    worst_a2s: WorstA2SPlatform | None = None
    if spends_rows:
        by_platform: dict[str, list[float]] = defaultdict(list)
        for r in spends_rows:
            by_platform[r['platform']].append(float(r['a2s'] or 0))
        avg_a2s = {p: sum(v) / len(v) for p, v in by_platform.items()}
        worst_plat = max(avg_a2s, key=avg_a2s.get)
        worst_a2s = WorstA2SPlatform(platform=worst_plat, ratio=round(avg_a2s[worst_plat], 4))

    # ----------------------------------------------------------------
    # 4. survey_responses — availability & platform gap signals
    # ----------------------------------------------------------------
    survey_q = db.table('survey_responses').select(
        'location, consumption_frequency, skipped_due_to_unavailability, platform, pincode_availability'
    )
    if city_filter:
        survey_q = survey_q.in_('location', city_filter)
    survey_rows = survey_q.execute().data or []

    total_survey = len(survey_rows)

    # Skip rate per city
    city_survey: dict[str, dict] = defaultdict(lambda: {'total': 0, 'skipped': 0})
    for r in survey_rows:
        loc = r['location']
        city_survey[loc]['total'] += 1
        if r['skipped_due_to_unavailability']:
            city_survey[loc]['skipped'] += 1

    skip_rate_by_city = [
        SkipRateItem(
            city=c,
            skipRate=round(v['skipped'] / v['total'], 4) if v['total'] > 0 else 0.0,
            totalRespondents=v['total'],
        )
        for c, v in city_survey.items()
    ]
    skip_rate_by_city.sort(key=lambda x: x.skipRate, reverse=True)

    # Consumption frequency breakdown
    freq_counts: dict[str, int] = defaultdict(int)
    for r in survey_rows:
        freq = r.get('consumption_frequency') or 'Unknown'
        freq_counts[freq] += 1
    freq_order = ['Daily', 'Few times a week', 'Weekly', 'Monthly', 'Rarely', 'Unknown']
    consumption_freq = [
        FreqItem(name=f, value=freq_counts[f])
        for f in freq_order if freq_counts.get(f, 0) > 0
    ]

    # Platform gap analysis
    platform_counts: dict[str, int] = defaultdict(int)
    for r in survey_rows:
        p = r.get('platform') or 'Other'
        platform_counts[p] += 1

    blinkit_n = platform_counts.get('Blinkit', 0)
    zepto_n = platform_counts.get('Zepto', 0)
    other_n = total_survey - blinkit_n - zepto_n

    blinkit_pct = round(blinkit_n / total_survey, 4) if total_survey else 0.0
    zepto_pct = round(zepto_n / total_survey, 4) if total_survey else 0.0
    other_pct = round(other_n / total_survey, 4) if total_survey else 0.0
    gap_pct = round((blinkit_n + zepto_n) / total_survey * 100, 1) if total_survey else 0.0

    platform_gap = PlatformGapSummary(
        blinkitPct=blinkit_pct,
        zeptoPct=zepto_pct,
        otherPct=other_pct,
        insight=(
            f'{gap_pct}% of surveyed customers shop on Blinkit or Zepto — '
            f'platforms where MadMix currently has no direct presence.'
        ) if gap_pct > 0 else 'Insufficient survey data for platform gap analysis.',
    )

    # Pincode availability rate
    pincode_yes = sum(1 for r in survey_rows if r.get('pincode_availability'))
    pincode_rate = round(pincode_yes / total_survey, 4) if total_survey else 1.0

    return AnalysisResponse(
        totalSalesMrp=total_sales_mrp,
        totalPodsSalesMrp=total_pods_mrp,
        salesByPlatform=sales_by_platform,
        salesByFlavour=sales_by_flavour,
        podsSalesDelta=pods_delta,
        a2sOverTime=a2s_over_time,
        worstA2SPlatform=worst_a2s,
        totalSurveyResponses=total_survey,
        skipRateByCity=skip_rate_by_city,
        consumptionFrequencyBreakdown=consumption_freq,
        platformGap=platform_gap,
        pincodeAvailabilityRate=pincode_rate,
    )
