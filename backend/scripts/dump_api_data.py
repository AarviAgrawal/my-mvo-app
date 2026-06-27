"""
dump_api_data.py — Snapshot all backend API responses to timestamped JSON files.

Uses the SUPABASE_SERVICE_ROLE_KEY from backend/.env — no user login required.
Also calls FastAPI endpoints if the backend is running on localhost:8000.

Usage (from project root or backend/ folder):
    python backend/scripts/dump_api_data.py

Files are saved to:  backend/debug_dumps/YYYYMMDD_HHMMSS/
"""

import json
import os
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

import httpx
from dotenv import load_dotenv

# ── locate .env relative to this script ──────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
load_dotenv(BACKEND_DIR / '.env')

SUPABASE_URL      = os.getenv('SUPABASE_URL', '').rstrip('/')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY', '')
SERVICE_ROLE_KEY  = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')
API_BASE          = 'http://localhost:8000'

if not SUPABASE_URL or not SERVICE_ROLE_KEY:
    print('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env')
    sys.exit(1)

# ── output folder ─────────────────────────────────────────────────────────────
DUMP_DIR = BACKEND_DIR / 'debug_dumps' / datetime.now().strftime('%Y%m%d_%H%M%S')
DUMP_DIR.mkdir(parents=True, exist_ok=True)


def save(name: str, data: object) -> None:
    path = DUMP_DIR / f'{name}.json'
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)
    size = path.stat().st_size
    print(f'  saved -> {path.name}  ({size:,} bytes)')


# ── Supabase REST helpers (service role — bypasses RLS, no user login) ────────

def sb_headers() -> dict:
    return {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
        'Accept': 'application/json',
    }


def sb_table(client: httpx.Client, table: str, select: str = '*', limit: int = 2000) -> list:
    url = f'{SUPABASE_URL}/rest/v1/{table}?select={select}&limit={limit}'
    r = client.get(url, timeout=30)
    if r.status_code != 200:
        print(f'  WARN: {table} returned {r.status_code}: {r.text[:200]}')
        return []
    return r.json()


# ── FastAPI helper (optional — skips gracefully if server not running) ─────────

def api_fetch(client: httpx.Client, path: str) -> dict | list | None:
    try:
        r = client.get(f'{API_BASE}{path}', timeout=60)
        if r.status_code == 200:
            return r.json()
        print(f'  WARN: {path} returned {r.status_code}')
        return {'__error': r.status_code, '__body': r.text[:500]}
    except httpx.ConnectError:
        return None  # backend not running


def get_fastapi_token(sb_client: httpx.Client) -> str | None:
    """Sign in with DUMP_EMAIL/DUMP_PASSWORD if set; otherwise skip FastAPI calls."""
    email    = os.getenv('DUMP_EMAIL', '')
    password = os.getenv('DUMP_PASSWORD', '')
    if not email or not password or email == 'your@email.com':
        return None
    try:
        r = sb_client.post(
            f'{SUPABASE_URL}/auth/v1/token?grant_type=password',
            headers={'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json'},
            json={'email': email, 'password': password},
            timeout=15,
        )
        if r.status_code == 200:
            return r.json().get('access_token')
        print(f'  WARN: Supabase login failed ({r.status_code}) — FastAPI endpoints will be skipped.')
        return None
    except Exception as e:
        print(f'  WARN: Auth request failed ({e}) — FastAPI endpoints will be skipped.')
        return None


# ── Inline analysis — replicates metrics.py locally so no FastAPI auth needed ─

def compute_analysis_inline(
    pods_rows: list, sku_rows: list, spends_rows: list, survey_rows: list
) -> dict:
    """Mirror the key aggregations from metrics.py so we can inspect them."""

    # pods_sales — platform sums and Apr/May delta
    platform_sums: dict = defaultdict(float)
    delta_map: dict = {}
    for r in pods_rows:
        platform_sums[r['platform']] += r['sales_mrp']
        key = (r['city'], r['platform'])
        if key not in delta_map:
            delta_map[key] = {'apr': 0.0, 'may': 0.0}
        if 'Apr' in r['month']:
            delta_map[key]['apr'] += r['sales_mrp']
        elif 'May' in r['month']:
            delta_map[key]['may'] += r['sales_mrp']

    pods_delta = []
    for (c, p), v in delta_map.items():
        apr, may = v['apr'], v['may']
        delta_pct = ((may - apr) / apr) if apr > 0 else 0.0
        pods_delta.append({'city': c, 'platform': p, 'aprMrp': apr, 'mayMrp': may, 'deltaPct': round(delta_pct, 4)})
    pods_delta.sort(key=lambda x: x['deltaPct'])

    # sku_sales — by flavour
    total_sales_mrp = sum(r['sales_mrp'] for r in sku_rows)
    flavour_sums: dict = defaultdict(float)
    for r in sku_rows:
        flavour_sums[r['sku']] += r['sales_mrp']
    sales_by_flavour = sorted(
        [{'name': k, 'value': v} for k, v in flavour_sums.items()],
        key=lambda x: x['value'], reverse=True
    )[:10]

    # sales_spends — A2S
    by_platform: dict = defaultdict(list)
    for r in spends_rows:
        by_platform[r['platform']].append(float(r['a2s'] or 0))
    avg_a2s = {p: sum(v) / len(v) for p, v in by_platform.items()}
    worst_plat = max(avg_a2s, key=avg_a2s.get) if avg_a2s else None

    # survey_responses
    total_survey = len(survey_rows)
    city_survey: dict = defaultdict(lambda: {'total': 0, 'skipped': 0})
    platform_counts: dict = defaultdict(int)
    pincode_yes = 0
    for r in survey_rows:
        loc = r['location']
        city_survey[loc]['total'] += 1
        if r.get('skipped_due_to_unavailability'):
            city_survey[loc]['skipped'] += 1
        if r.get('pincode_availability'):
            pincode_yes += 1
        platform_counts[r.get('platform') or 'Other'] += 1

    skip_rates = [
        {'city': c, 'skipRate': round(v['skipped'] / v['total'], 4), 'totalRespondents': v['total']}
        for c, v in city_survey.items()
    ]
    skip_rates.sort(key=lambda x: x['skipRate'], reverse=True)

    blinkit_n = platform_counts.get('Blinkit', 0)
    zepto_n   = platform_counts.get('Zepto', 0)
    other_n   = total_survey - blinkit_n - zepto_n

    return {
        'totalSalesMrp': total_sales_mrp,
        'totalPodsSalesMrp': sum(r['sales_mrp'] for r in pods_rows),
        'salesByPlatform': [{'name': k, 'value': v} for k, v in sorted(platform_sums.items())],
        'salesByFlavour': sales_by_flavour,
        'podsSalesDelta': pods_delta,
        'a2sAvgByPlatform': avg_a2s,
        'worstA2SPlatform': {'platform': worst_plat, 'avgRatio': round(avg_a2s.get(worst_plat, 0), 4)} if worst_plat else None,
        'totalSurveyResponses': total_survey,
        'skipRateByCity': skip_rates,
        'platformGap': {
            'blinkitN': blinkit_n, 'zeptoN': zepto_n, 'otherN': other_n,
            'blinkitPct': round(blinkit_n / total_survey, 4) if total_survey else 0,
            'zeptoPct':   round(zepto_n   / total_survey, 4) if total_survey else 0,
            'otherPct':   round(other_n   / total_survey, 4) if total_survey else 0,
        },
        'pincodeAvailabilityRate': round(pincode_yes / total_survey, 4) if total_survey else 1.0,
    }


# ── Decision signals summary (which rules would fire) ─────────────────────────

def compute_decision_signals(
    pods_rows: list, survey_rows: list, spends_rows: list,
    skip_rate_threshold: float = 0.30,
    low_sales_threshold: float = 5000.0,
    a2s_threshold: float = 0.45,
    min_sample: int = 5,
) -> list:
    """Summarise which engine rules would fire per city (for debugging)."""
    cities = list({r['city'] for r in pods_rows})
    signals = []

    # Pre-group survey by city
    city_survey: dict = defaultdict(list)
    for r in survey_rows:
        city_survey[r['location']].append(r)

    for city in sorted(cities):
        survey = city_survey.get(city, [])
        total  = len(survey)
        skipped = sum(1 for r in survey if r.get('skipped_due_to_unavailability'))
        skip_rate = skipped / total if total > 0 else 0.0

        may_pods = sum(r['sales_mrp'] for r in pods_rows if r['city'] == city and 'May' in r['month'])
        apr_pods = sum(r['sales_mrp'] for r in pods_rows if r['city'] == city and 'Apr' in r['month'])

        blinkit_zepto = sum(1 for r in survey if r.get('platform') in ('Blinkit', 'Zepto'))
        ext_pct = blinkit_zepto / total if total > 0 else 0.0

        would_fire = []
        if total >= min_sample and skip_rate >= skip_rate_threshold and may_pods < low_sales_threshold * 3:
            would_fire.append(f'SUPPLY_GAP (skip={skip_rate*100:.0f}%, may_pods=₹{may_pods:,.0f})')
        if total >= min_sample and ext_pct >= 0.40 and may_pods <= low_sales_threshold * 5:
            would_fire.append(f'PLATFORM_EXPAND (blinkit/zepto={ext_pct*100:.0f}%)')
        if not any('SUPPLY_GAP' in w for w in would_fire):
            if may_pods < low_sales_threshold and skip_rate < skip_rate_threshold:
                would_fire.append(f'WEAK_DEMAND (may_pods=₹{may_pods:,.0f}, skip={skip_rate*100:.0f}%)')

        signals.append({
            'city': city,
            'survey_count': total,
            'skip_rate': round(skip_rate, 4),
            'may_pods_mrp': may_pods,
            'apr_pods_mrp': apr_pods,
            'blinkit_zepto_pct': round(ext_pct, 4),
            'rules_that_would_fire': would_fire or ['none'],
        })

    # Spend leak
    by_plat: dict = defaultdict(list)
    for r in spends_rows:
        by_plat[r['platform']].append({'date': r['date'], 'a2s': float(r['a2s'] or 0)})
    spend_signals = []
    for plat, rows in by_plat.items():
        rows = sorted(rows, key=lambda x: x['date'])
        streak = 0
        max_streak = 0
        for r in rows:
            if r['a2s'] > a2s_threshold:
                streak += 1
                max_streak = max(max_streak, streak)
            else:
                streak = 0
        spend_signals.append({'platform': plat, 'max_consecutive_high_a2s_days': max_streak, 'would_fire': max_streak >= 3})

    return {'city_signals': signals, 'spend_signals': spend_signals}


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    print(f'\nDump target: {DUMP_DIR}\n')

    with httpx.Client(headers=sb_headers()) as sb:

        # ── 1. Raw table dumps ────────────────────────────────────────────────
        print('Fetching raw Supabase tables (service role — no auth needed)...')
        pods_rows    = sb_table(sb, 'pods_sales',    'city,platform,month,sales_mrp')
        sku_rows     = sb_table(sb, 'sku_sales',     'sku,city,platform,sales_mrp')
        spends_rows  = sb_table(sb, 'sales_spends',  'date,platform,spend,sales,a2s')
        survey_rows  = sb_table(sb, 'survey_responses',
                                'location,skipped_due_to_unavailability,platform,pincode_availability,consumption_frequency')

        print(f'  pods_sales: {len(pods_rows)} rows')
        print(f'  sku_sales:  {len(sku_rows)} rows')
        print(f'  sales_spends: {len(spends_rows)} rows')
        print(f'  survey_responses: {len(survey_rows)} rows')

        save('raw_pods_sales',       pods_rows)
        save('raw_sku_sales',        sku_rows)
        save('raw_sales_spends',     spends_rows)
        save('raw_survey_responses', survey_rows)

        # ── 2. Inline analysis (mirrors metrics.py) ───────────────────────────
        print('\nComputing inline analysis (mirrors metrics.py)...')
        analysis = compute_analysis_inline(pods_rows, sku_rows, spends_rows, survey_rows)
        save('analysis_computed', analysis)

        # ── 3. Decision signal debug ──────────────────────────────────────────
        print('Computing decision signals (mirrors engine.py rules)...')
        signals = compute_decision_signals(pods_rows, survey_rows, spends_rows)
        save('decision_signals_debug', signals)

        # ── 4. FastAPI endpoints (optional — skips if server not running) ─────
        print('\nAttempting FastAPI calls (needs backend on localhost:8000)...')
        token = get_fastapi_token(sb)
        api_headers = {'Authorization': f'Bearer {token}'} if token else {}

        with httpx.Client(headers=api_headers) as api:
            for path, name in [
                ('/api/v1/hot-cities',            'api_hot_cities'),
                ('/api/v1/analysis',              'api_analysis_all_india'),
                ('/api/v1/decisions',             'api_decisions_all'),
                ('/api/v1/decisions?severity=high', 'api_decisions_high'),
            ]:
                result = api_fetch(api, path)
                if result is None:
                    print(f'  SKIP {path} (backend not reachable)')
                else:
                    save(name, result)

        # ── 5. Manifest ───────────────────────────────────────────────────────
        files = sorted(DUMP_DIR.glob('*.json'))
        manifest = {
            'dump_time': datetime.now().isoformat(),
            'raw_row_counts': {
                'pods_sales': len(pods_rows),
                'sku_sales': len(sku_rows),
                'sales_spends': len(spends_rows),
                'survey_responses': len(survey_rows),
            },
            'files': [f.name for f in files],
        }
        save('_manifest', manifest)

    print(f'\nDone — {len(files) + 1} files in backend/debug_dumps/{DUMP_DIR.name}/\n')


if __name__ == '__main__':
    main()
