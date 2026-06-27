"""
engine.py — Business Decisions Engine
Pipeline: deterministic rules → evidence selection → Claude phrasing → scope_hash cache.

Rules implemented:
  1. Supply Gap  — high skip rate + low PODs sales → 'grow' decision
  2. Platform Expansion — Blinkit/Zepto demand in city but no BB/Instamart pods_sales → 'expand'
  3. Weak Demand — low PODs sales + low skip rate → 'reduce' or 'remove'
  4. Spend Leak  — A2S > threshold for N consecutive days → 'spend'
  5. Monitor     — high consumption frequency + declining sales → 'monitor'
"""

import hashlib
import json
import uuid
from collections import defaultdict
from datetime import datetime, timedelta, timezone

import anthropic
from supabase import Client

from app.core.config import settings
from app.db.constants import get_cities_for_state, get_state_for_city
from app.schemas.decisions import DecisionResponse, EvidenceItem, RawDataRef

# ---------------------------------------------------------------------------
# Claude prompt template
# ---------------------------------------------------------------------------
CLAUDE_PROMPT = """You are a commercial analyst for MadMix, a healthy millet snack brand sold on Indian e-commerce platforms.

You will be given exact data figures computed by our analytics engine. Your sole job is to translate these figures into:
1. A concise, action-oriented headline (the "action" field)
2. A 2-sentence plain-English justification (the "reasoning" field)

CRITICAL RULES:
- Do NOT invent, assume, or extrapolate any numbers beyond what is given.
- Use ONLY the exact figures supplied below.
- Write in a proactive, business-driven tone.
- Return ONLY valid JSON — no markdown, no extra text.

INPUT DATA:
{input_context}

REQUIRED JSON OUTPUT FORMAT:
{{"action": "Short action headline (e.g. Expand into Blinkit/Zepto in Mumbai)", "reasoning": "First sentence explaining the core signal. Second sentence stating the recommended action and expected outcome."}}"""


def _call_claude(input_context: str, fallback_action: str, fallback_reasoning: str) -> tuple[str, str]:
    """Call Claude API and return (action, reasoning). Falls back to deterministic strings on failure."""
    try:
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model='claude-sonnet-4-6',
            max_tokens=300,
            messages=[{'role': 'user', 'content': CLAUDE_PROMPT.format(input_context=input_context)}],
        )
        text = response.content[0].text.strip()
        parsed = json.loads(text)
        return parsed['action'], parsed['reasoning']
    except Exception:
        return fallback_action, fallback_reasoning


# ---------------------------------------------------------------------------
# Scope hash
# ---------------------------------------------------------------------------

def _scope_hash(city: str, platform: str, flavour: str) -> str:
    scope = f'{city}_{platform}_{flavour}'.lower().strip()
    return hashlib.sha256(scope.encode()).hexdigest()


# ---------------------------------------------------------------------------
# Cache helpers
# ---------------------------------------------------------------------------

def _check_cache(db: Client, scope_hash: str) -> list[dict] | None:
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=settings.decisions_cache_ttl_hours)).isoformat()
    result = (
        db.table('decisions')
        .select('*')
        .eq('scope_hash', scope_hash)
        .gte('created_at', cutoff)
        .execute()
    )
    return result.data if result.data else None


def _upsert_decision(db: Client, decision: dict) -> None:
    db.table('decisions').upsert(decision, on_conflict='scope_hash').execute()


# ---------------------------------------------------------------------------
# Rule 1 — Supply Gap
# ---------------------------------------------------------------------------

def _check_supply_gap(
    city: str, platform: str,
    pods_rows: list[dict], survey_rows: list[dict],
    scope_hash: str,
) -> dict | None:
    """
    Trigger: skip_rate > threshold AND pods sales in May < low_sales_mrp_threshold.
    Indicates unmet demand — customers want the product but it's not available.
    """
    city_pods = [r for r in pods_rows if r['city'] == city and ('May' in r['month'] or not r['month'])]
    may_sales = sum(r['sales_mrp'] for r in city_pods if 'May' in r['month'])

    city_survey = [r for r in survey_rows if r['location'] == city]
    total_resp = len(city_survey)
    if total_resp < settings.min_survey_sample:
        return None

    skipped = sum(1 for r in city_survey if r.get('skipped_due_to_unavailability'))
    skip_rate = skipped / total_resp

    if skip_rate < settings.skip_rate_threshold:
        return None
    if may_sales >= settings.low_sales_mrp_threshold * 3:  # already well-stocked
        return None

    # Build Claude context
    context = (
        f'City: {city} | Platform: {platform or "all"}\n'
        f'May 2026 PODs Sales: ₹{may_sales:,.0f}\n'
        f'Survey respondents: {total_resp} | Skipped due to unavailability: {skipped} ({skip_rate*100:.0f}%)\n'
        f'Threshold for concern: skip rate > {settings.skip_rate_threshold*100:.0f}%'
    )
    fallback_action = f'Boost distribution of MadMix in {city}' + (f' on {platform}' if platform else '')
    fallback_reasoning = (
        f'{skip_rate*100:.0f}% of surveyed customers in {city} skipped buying MadMix due to unavailability, '
        f'despite only ₹{may_sales:,.0f} in May sales. '
        f'Increasing stock and distribution coverage could capture this latent demand.'
    )
    action, reasoning = _call_claude(context, fallback_action, fallback_reasoning)

    decision_id = f'DEC-{uuid.uuid4().hex[:8].upper()}'
    return {
        'id': decision_id,
        'action': action,
        'type': 'grow',
        'severity': 'high' if skip_rate > 0.50 else 'medium',
        'confidence': min(95, int(skip_rate * 100 + 40)),
        'city': city,
        'state': get_state_for_city(city),
        'platform': platform or None,
        'flavour': None,
        'reasoning': reasoning,
        'scope_hash': scope_hash,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'evidence': [
            {'label': 'Skip Rate', 'detail': f'{skip_rate*100:.0f}% skipped due to unavailability ({skipped}/{total_resp})', 'source': 'Customer Survey', 'trend': 'down'},
            {'label': 'May PODs Sales', 'detail': f'₹{may_sales:,.0f}', 'source': 'PODs Sales', 'trend': 'flat'},
        ],
        'raw_data_refs': [
            {'source': 'Customer Survey', 'rows': [{'location': r['location'], 'skipped': r['skipped_due_to_unavailability'], 'platform': r['platform']} for r in city_survey[:10]]},
        ],
    }


# ---------------------------------------------------------------------------
# Rule 2 — Platform Expansion
# ---------------------------------------------------------------------------

def _check_platform_expansion(
    city: str,
    pods_rows: list[dict], survey_rows: list[dict],
    scope_hash: str,
) -> dict | None:
    """
    Trigger: Blinkit/Zepto demand in survey for this city,
    but low or zero BB/Instamart pods_sales.
    """
    city_survey = [r for r in survey_rows if r['location'] == city]
    total_resp = len(city_survey)
    if total_resp < settings.min_survey_sample:
        return None

    ext_platform_resp = [r for r in city_survey if r.get('platform') in ('Blinkit', 'Zepto')]
    ext_pct = len(ext_platform_resp) / total_resp

    if ext_pct < 0.40:  # less than 40% shop on Blinkit/Zepto — not strong enough signal
        return None

    city_pods_may = sum(r['sales_mrp'] for r in pods_rows if r['city'] == city and 'May' in r['month'])
    if city_pods_may > settings.low_sales_mrp_threshold * 5:
        return None  # already selling well on existing platforms

    blinkit_n = sum(1 for r in ext_platform_resp if r['platform'] == 'Blinkit')
    zepto_n = sum(1 for r in ext_platform_resp if r['platform'] == 'Zepto')
    top_ext = 'Blinkit' if blinkit_n >= zepto_n else 'Zepto'

    context = (
        f'City: {city}\n'
        f'Survey respondents: {total_resp} | Shopping on Blinkit/Zepto: {len(ext_platform_resp)} ({ext_pct*100:.0f}%)\n'
        f'Blinkit users: {blinkit_n} | Zepto users: {zepto_n}\n'
        f'Current May PODs sales (BB+Instamart): ₹{city_pods_may:,.0f}'
    )
    fallback_action = f'Expand MadMix listing onto {top_ext} in {city}'
    fallback_reasoning = (
        f'{ext_pct*100:.0f}% of surveyed customers in {city} primarily shop on Blinkit or Zepto, '
        f'but MadMix currently has only ₹{city_pods_may:,.0f} in May sales through Big Basket and Instamart. '
        f'Listing on {top_ext} could directly capture this existing customer base.'
    )
    action, reasoning = _call_claude(context, fallback_action, fallback_reasoning)

    decision_id = f'DEC-{uuid.uuid4().hex[:8].upper()}'
    return {
        'id': decision_id,
        'action': action,
        'type': 'expand',
        'severity': 'medium',
        'confidence': min(90, int(ext_pct * 80 + 20)),
        'city': city,
        'state': get_state_for_city(city),
        'platform': top_ext,
        'flavour': None,
        'reasoning': reasoning,
        'scope_hash': scope_hash + '_expand',
        'created_at': datetime.now(timezone.utc).isoformat(),
        'evidence': [
            {'label': f'{top_ext} Demand', 'detail': f'{ext_pct*100:.0f}% of city respondents shop on Blinkit/Zepto', 'source': 'Customer Survey', 'trend': 'up'},
            {'label': 'Current Platform Sales', 'detail': f'₹{city_pods_may:,.0f} May (BB+Instamart only)', 'source': 'PODs Sales', 'trend': 'flat'},
        ],
        'raw_data_refs': [
            {'source': 'Customer Survey', 'rows': [{'location': r['location'], 'platform': r['platform']} for r in city_survey[:10]]},
        ],
    }


# ---------------------------------------------------------------------------
# Rule 3 — Spend Leak
# ---------------------------------------------------------------------------

def _check_spend_leak(spends_rows: list[dict], platform: str, scope_hash: str) -> dict | None:
    """
    Trigger: A2S ratio > threshold for N consecutive days on a platform.
    """
    plat_rows = sorted(
        [r for r in spends_rows if r['platform'] == platform],
        key=lambda x: x['date'],
    )
    if not plat_rows:
        return None

    # Find longest consecutive run of high A2S
    streak = 0
    max_streak = 0
    peak_a2s = 0.0
    streak_start = ''
    best_start = ''
    best_end = ''

    for r in plat_rows:
        a2s = float(r.get('a2s') or 0)
        if a2s > settings.a2s_threshold:
            if streak == 0:
                streak_start = r['date']
            streak += 1
            if a2s > peak_a2s:
                peak_a2s = a2s
            if streak > max_streak:
                max_streak = streak
                best_start = streak_start
                best_end = r['date']
        else:
            streak = 0

    if max_streak < settings.a2s_consecutive_days:
        return None

    avg_a2s = sum(float(r.get('a2s') or 0) for r in plat_rows) / len(plat_rows)

    context = (
        f'Platform: {platform}\n'
        f'A2S ratio exceeded {settings.a2s_threshold*100:.0f}% threshold for {max_streak} consecutive days '
        f'(from {best_start} to {best_end}).\n'
        f'Peak A2S: {peak_a2s*100:.1f}% | Period average A2S: {avg_a2s*100:.1f}%\n'
        f'Normal target A2S: <{settings.a2s_threshold*100:.0f}%'
    )
    fallback_action = f'Reduce ad spend on {platform} — A2S ratio critically high'
    fallback_reasoning = (
        f'The A2S ratio on {platform} exceeded {settings.a2s_threshold*100:.0f}% for {max_streak} consecutive days, '
        f'peaking at {peak_a2s*100:.1f}% — significantly above the target threshold. '
        f'Reducing or pausing spend for the affected period would recover margin without impacting organic sales velocity.'
    )
    action, reasoning = _call_claude(context, fallback_action, fallback_reasoning)

    decision_id = f'DEC-{uuid.uuid4().hex[:8].upper()}'
    return {
        'id': decision_id,
        'action': action,
        'type': 'spend',
        'severity': 'high' if peak_a2s > 0.70 else 'medium',
        'confidence': 85,
        'city': None,
        'state': None,
        'platform': platform,
        'flavour': None,
        'reasoning': reasoning,
        'scope_hash': scope_hash + f'_spend_{platform}',
        'created_at': datetime.now(timezone.utc).isoformat(),
        'evidence': [
            {'label': 'Peak A2S Ratio', 'detail': f'{peak_a2s*100:.1f}% (target <{settings.a2s_threshold*100:.0f}%)', 'source': 'Sales vs Spends', 'trend': 'down'},
            {'label': 'Consecutive High Days', 'detail': f'{max_streak} days ({best_start} → {best_end})', 'source': 'Sales vs Spends', 'trend': 'down'},
        ],
        'raw_data_refs': [
            {'source': 'Sales vs Spends', 'rows': [{'date': r['date'], 'platform': r['platform'], 'spend': r['spend'], 'sales': r['sales'], 'a2s': r['a2s']} for r in plat_rows[-14:]]},
        ],
    }


# ---------------------------------------------------------------------------
# Rule 4 — Weak Demand
# ---------------------------------------------------------------------------

def _check_weak_demand(
    city: str, platform: str,
    pods_rows: list[dict], survey_rows: list[dict],
    scope_hash: str,
) -> dict | None:
    """
    Trigger: Low May PODs sales AND low skip rate (low demand, not just unavailability).
    """
    city_pods = [r for r in pods_rows if r['city'] == city]
    may_sales = sum(r['sales_mrp'] for r in city_pods if 'May' in r['month'])
    apr_sales = sum(r['sales_mrp'] for r in city_pods if 'Apr' in r['month'])

    if may_sales >= settings.low_sales_mrp_threshold:
        return None

    city_survey = [r for r in survey_rows if r['location'] == city]
    total_resp = len(city_survey)
    skip_rate = (sum(1 for r in city_survey if r.get('skipped_due_to_unavailability')) / total_resp) if total_resp > 0 else 0.0

    # Only a weak demand signal if skip rate is also low (demand genuinely absent)
    if skip_rate > settings.skip_rate_threshold:
        return None  # Supply gap rule will handle this

    delta_pct = ((may_sales - apr_sales) / apr_sales) if apr_sales > 0 else 0.0
    decision_type = 'remove' if may_sales < settings.low_sales_mrp_threshold * 0.3 else 'reduce'

    context = (
        f'City: {city} | Platform: {platform or "all"}\n'
        f'Apr 2026 PODs Sales: ₹{apr_sales:,.0f} | May 2026: ₹{may_sales:,.0f} (change: {delta_pct*100:+.1f}%)\n'
        f'Survey respondents: {total_resp} | Skip rate: {skip_rate*100:.0f}% (low — genuine low demand)'
    )
    fallback_action = f'{"Pull" if decision_type == "remove" else "Reduce"} MadMix stock in {city}' + (f' on {platform}' if platform else '')
    fallback_reasoning = (
        f'May sales in {city} are only ₹{may_sales:,.0f} and only {skip_rate*100:.0f}% of customers '
        f'report skipping due to unavailability, indicating genuinely low demand rather than a supply gap. '
        f'{"Removing" if decision_type == "remove" else "Reducing"} inventory allocation would cut holding costs without sacrificing meaningful revenue.'
    )
    action, reasoning = _call_claude(context, fallback_action, fallback_reasoning)

    decision_id = f'DEC-{uuid.uuid4().hex[:8].upper()}'
    return {
        'id': decision_id,
        'action': action,
        'type': decision_type,
        'severity': 'high' if decision_type == 'remove' else 'medium',
        'confidence': 78,
        'city': city,
        'state': get_state_for_city(city),
        'platform': platform or None,
        'flavour': None,
        'reasoning': reasoning,
        'scope_hash': scope_hash + '_weak',
        'created_at': datetime.now(timezone.utc).isoformat(),
        'evidence': [
            {'label': 'May PODs Sales', 'detail': f'₹{may_sales:,.0f} (below ₹{settings.low_sales_mrp_threshold:,.0f} threshold)', 'source': 'PODs Sales', 'trend': 'down'},
            {'label': 'Skip Rate', 'detail': f'{skip_rate*100:.0f}% — low demand signal', 'source': 'Customer Survey', 'trend': 'flat'},
        ],
        'raw_data_refs': [
            {'source': 'PODs Sales', 'rows': [{'city': r['city'], 'platform': r['platform'], 'month': r['month'], 'sales_mrp': r['sales_mrp']} for r in city_pods]},
        ],
    }


# ---------------------------------------------------------------------------
# Main engine entry point
# ---------------------------------------------------------------------------

def generate_decisions(
    db: Client,
    city: str = '',
    state: str = '',
    platform: str = '',
    flavour: str = '',
) -> list[DecisionResponse]:

    # Resolve cities to check
    if city:
        cities_to_check = [city]
    elif state:
        cities_to_check = get_cities_for_state(state) or []
    else:
        # No filter — check top cities from pods_sales
        top_rows = db.table('pods_sales').select('city').execute().data or []
        cities_to_check = list({r['city'] for r in top_rows})[:20]

    # Spend leak check uses a platform-level scope hash (not city-scoped)
    spend_scope = _scope_hash('', platform, '')
    cached_spend = _check_cache(db, spend_scope + '_spend_Big Basket')
    cached_spend_im = _check_cache(db, spend_scope + '_spend_Instamart')

    # Fetch raw data for all rules at once (avoid N+1 queries)
    pods_q = db.table('pods_sales').select('city, platform, month, sales_mrp')
    if platform:
        pods_q = pods_q.eq('platform', platform)
    if cities_to_check:
        pods_q = pods_q.in_('city', cities_to_check)
    pods_rows = pods_q.execute().data or []

    survey_q = db.table('survey_responses').select(
        'location, skipped_due_to_unavailability, platform, consumption_frequency, pincode_availability'
    )
    if cities_to_check:
        survey_q = survey_q.in_('location', cities_to_check)
    survey_rows = survey_q.execute().data or []

    spends_rows = db.table('sales_spends').select('date, platform, spend, sales, a2s').execute().data or []

    decisions_raw: list[dict] = []

    # --- Spend leak rules (platform-level) ---
    for plat in (['Big Basket', 'Instamart'] if not platform else [platform]):
        cache_key = spend_scope + f'_spend_{plat}'
        cached = _check_cache(db, cache_key)
        if cached:
            decisions_raw.extend(cached)
        else:
            result = _check_spend_leak(spends_rows, plat, spend_scope)
            if result:
                _upsert_decision(db, result)
                decisions_raw.append(result)

    # --- City-level rules ---
    for c in cities_to_check:
        city_scope = _scope_hash(c, platform, flavour)

        cached = _check_cache(db, city_scope)
        if cached:
            decisions_raw.extend(cached)
            continue

        city_decisions: list[dict] = []

        # Rule 1: Supply gap
        d = _check_supply_gap(c, platform, pods_rows, survey_rows, city_scope)
        if d:
            city_decisions.append(d)

        # Rule 2: Platform expansion (only when no platform filter — it's a platform-agnostic signal)
        if not platform:
            d = _check_platform_expansion(c, pods_rows, survey_rows, city_scope)
            if d:
                city_decisions.append(d)

        # Rule 3: Weak demand (only if supply gap didn't trigger)
        if not any(dec['type'] in ('grow',) for dec in city_decisions):
            d = _check_weak_demand(c, platform, pods_rows, survey_rows, city_scope)
            if d:
                city_decisions.append(d)

        for dec in city_decisions:
            _upsert_decision(db, dec)

        decisions_raw.extend(city_decisions)

    # Deduplicate by id
    seen_ids: set[str] = set()
    unique: list[dict] = []
    for d in decisions_raw:
        if d['id'] not in seen_ids:
            seen_ids.add(d['id'])
            unique.append(d)

    # Sort: high severity first
    severity_order = {'high': 0, 'medium': 1, 'low': 2}
    unique.sort(key=lambda d: severity_order.get(d.get('severity', 'low'), 2))

    return [DecisionResponse(**d) for d in unique]
