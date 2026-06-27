"""
hot_cities.py — Computes the "hot cities" strip shown on the Dashboard.
No LLM involved — all signals are deterministic from pods_sales + survey_responses.
"""

from collections import defaultdict

from supabase import Client

from app.core.config import settings
from app.db.constants import get_state_for_city
from app.schemas.analysis import HotCityItem


def compute_hot_cities(db: Client, limit: int = 6) -> list[HotCityItem]:
    # ----------------------------------------------------------------
    # 1. Pull all pods_sales and compute per-city Apr vs May totals
    # ----------------------------------------------------------------
    pods_rows = db.table('pods_sales').select('city, month, sales_mrp').execute().data or []

    city_months: dict[str, dict[str, float]] = defaultdict(lambda: {'Apr 2026': 0.0, 'May 2026': 0.0})
    for r in pods_rows:
        city_months[r['city']][r['month']] += r['sales_mrp']

    # ----------------------------------------------------------------
    # 2. Pull survey data for skip rates per city
    # ----------------------------------------------------------------
    survey_rows = (
        db.table('survey_responses')
        .select('location, skipped_due_to_unavailability, consumption_frequency')
        .execute()
        .data or []
    )

    city_survey: dict[str, dict] = defaultdict(lambda: {'total': 0, 'skipped': 0, 'daily': 0})
    for r in survey_rows:
        loc = r['location']
        city_survey[loc]['total'] += 1
        if r.get('skipped_due_to_unavailability'):
            city_survey[loc]['skipped'] += 1
        if r.get('consumption_frequency') in ('Daily', 'Few times a week'):
            city_survey[loc]['daily'] += 1

    # ----------------------------------------------------------------
    # 3. Score and classify each city
    # ----------------------------------------------------------------
    all_cities = set(city_months.keys()) | set(city_survey.keys())
    scored: list[dict] = []

    for city in all_cities:
        apr = city_months[city].get('Apr 2026', 0.0)
        may = city_months[city].get('May 2026', 0.0)
        delta_pct = ((may - apr) / apr) if apr > 0 else 0.0

        sv = city_survey.get(city, {'total': 0, 'skipped': 0, 'daily': 0})
        total_resp = sv['total']
        skip_rate = sv['skipped'] / total_resp if total_resp > 0 else 0.0
        high_freq_rate = sv['daily'] / total_resp if total_resp > 0 else 0.0

        # Classify
        if delta_pct < -0.20 and skip_rate > settings.skip_rate_threshold:
            severity = 'high'
            why = (
                f'Sales dropped {abs(delta_pct)*100:.0f}% Apr→May '
                f'and {skip_rate*100:.0f}% of customers skipped buying due to unavailability.'
            )
        elif skip_rate > settings.skip_rate_threshold:
            severity = 'high'
            why = (
                f'{skip_rate*100:.0f}% of customers in this city skipped due to unavailability '
                f'— strong unmet demand signal.'
            )
        elif delta_pct > 0.05 and high_freq_rate > 0.5:
            severity = 'grow'
            why = (
                f'Sales grew {delta_pct*100:.0f}% Apr→May and '
                f'{high_freq_rate*100:.0f}% of customers are daily/frequent consumers.'
            )
        elif delta_pct < -0.10:
            severity = 'monitor'
            why = f'Sales declined {abs(delta_pct)*100:.0f}% Apr→May — worth watching.'
        else:
            severity = 'monitor'
            why = f'Stable market with ₹{may:,.0f} in May sales.'

        trend = 'down' if delta_pct < -0.05 else ('up' if delta_pct > 0.05 else 'flat')

        # Priority score (higher = more urgent to show)
        priority = (skip_rate * 50) + (abs(delta_pct) * 30 if delta_pct < 0 else 0) + (5 if severity == 'high' else 0)

        sparkline = [round(apr * 0.9, 0), round(apr, 0), round((apr + may) / 2, 0), round(may, 0)]

        scored.append({
            'city': city,
            'state': get_state_for_city(city),
            'sparkline': sparkline,
            'whyItIsHot': why,
            'severity': severity,
            'trend': trend,
            'priority': priority,
        })

    scored.sort(key=lambda x: x['priority'], reverse=True)
    top = scored[:limit]

    return [
        HotCityItem(
            city=item['city'],
            state=item['state'],
            sparkline=item['sparkline'],
            whyItIsHot=item['whyItIsHot'],
            severity=item['severity'],
            trend=item['trend'],
        )
        for item in top
    ]
