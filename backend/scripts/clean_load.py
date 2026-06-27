"""
clean_load.py — MadMix data normalizer
Reads the actual Excel files and upserts to Supabase.

Usage:
    python scripts/clean_load.py --dry-run          # print row counts only
    python scripts/clean_load.py                     # insert everything
    python scripts/clean_load.py --table pods_sales  # insert only one table

Requires:  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment (or .env file).
"""

import argparse
import hashlib
import os
import sys
from datetime import date, datetime, timedelta, timezone

import pandas as pd
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

COMMERCE_FILE = os.path.join(
    os.path.dirname(__file__), '..', '..', 'assets', 'PODs-Data.xlsx'
)
SURVEY_FILE = os.path.join(
    os.path.dirname(__file__), '..', '..', 'assets',
    'form customer data.xlsx'
)

# ---------------------------------------------------------------------------
# City name normalizer — maps Excel variants to canonical names
# ---------------------------------------------------------------------------
CITY_NORMALIZER: dict[str, str] = {
    'ahmedabad-gandhinagar': 'Ahmedabad',
    'adalaj': 'Ahmedabad',
    'ahmedabad': 'Ahmedabad',
    'bangalore': 'Bangalore',
    'bengaluru': 'Bangalore',
    'bengaluru/bangalore': 'Bangalore',
    'chandigarh tricity': 'Chandigarh',
    'chandigarh': 'Chandigarh',
    'dehradun': 'Dehradun',
    'dehra dun': 'Dehradun',
    'gurgaon': 'Gurugram',
    'gurugram': 'Gurugram',
    'mysore': 'Mysuru',
    'mysuru': 'Mysuru',
    'bombay': 'Mumbai',
    'mumbai': 'Mumbai',
    'delhi': 'Delhi',
    'new delhi': 'Delhi',
    'hyderabad': 'Hyderabad',
    'noida': 'Noida',
    'pune': 'Pune',
    'chennai': 'Chennai',
    'kolkata': 'Kolkata',
    'surat': 'Surat',
    'anand': 'Anand',
    'vapi': 'Vapi',
    'vijayawada': 'Vijayawada',
    'silchar': 'Silchar',
    'coimbatore': 'Coimbatore',
    'ajmer': 'Ajmer',
    'agra': 'Agra',
    'adichanalloor': 'Tirunelveli',
    'adichanalur': 'Tirunelveli',
}

def normalize_city(raw: str) -> str:
    key = str(raw).strip().lower()
    return CITY_NORMALIZER.get(key, str(raw).strip().title())

# ---------------------------------------------------------------------------
# SKU normalizer — maps Excel strings to canonical flavour names
# ---------------------------------------------------------------------------
SKU_NORMALIZER: dict[str, str] = {
    'madmix aloo-sev-millet-bhujia':                   'Aloo Sev Millet Bhujia',
    'madmix aloo sev millet bhujia':                   'Aloo Sev Millet Bhujia',
    'madmix bbq-blast-millet-bhujia':                  'BBQ Blast Millet Bhujia',
    'madmix bbq blast millet bhujia':                  'BBQ Blast Millet Bhujia',
    'madmix millet bhujia bbq blast baked snack':      'BBQ Blast Millet Bhujia',
    'madmix chaat-corner-quinoa-millet-puffs':         'Chaat Corner Quinoa Millet Puffs',
    'madmix chaat corner quinoa millet puffs':         'Chaat Corner Quinoa Millet Puffs',
    'madmix baked millet bhujia- masala masti':        'Masala Masti Bhujia',
    'madmix baked millet bhujia- pudina picnic':       'Pudina Picnic Bhujia',
    'madmix baked millet bhujia- tangy twist':         'Tangy Twist Bhujia',
    'madmix baked quinoa puffs- pizza party':          'Pizza Party Quinoa Puffs',
    'madmix paan raisins':                             'Flavoured Raisins',
    'madmix flavoured raisins':                        'Flavoured Raisins',
}

FLAVOUR_LINE: dict[str, str] = {
    'Aloo Sev Millet Bhujia':          'Baked Millet Bhujia',
    'BBQ Blast Millet Bhujia':         'Baked Millet Bhujia',
    'Masala Masti Bhujia':             'Baked Millet Bhujia',
    'Pudina Picnic Bhujia':            'Baked Millet Bhujia',
    'Tangy Twist Bhujia':              'Baked Millet Bhujia',
    'Chaat Corner Quinoa Millet Puffs':'Baked Millet Puffs',
    'Pizza Party Quinoa Puffs':        'Baked Millet Puffs',
    'Flavoured Raisins':               'Flavoured Raisins',
}

def normalize_sku(raw: str) -> tuple[str, str]:
    """Returns (canonical_sku, product_line)."""
    key = str(raw).strip().lower()
    # strip weight/size suffixes like ' 135 g', ' 50 g'
    for suffix in [' 135 g', ' 50 g', ' 80 g', ' 100 g', ' 200 g']:
        key = key.replace(suffix, '')
    key = key.strip()
    sku = SKU_NORMALIZER.get(key)
    if sku is None:
        # fallback: try prefix match
        for k, v in SKU_NORMALIZER.items():
            if key.startswith(k) or k.startswith(key):
                sku = v
                break
    if sku is None:
        sku = str(raw).strip().title()
    line = FLAVOUR_LINE.get(sku, 'Other')
    return sku, line

def is_sku_string(s) -> bool:
    """Detect if a cell value is a SKU name (not a city name)."""
    if not isinstance(s, str):
        return False
    lower = s.strip().lower()
    sku_keywords = ['madmix', 'baked millet', 'baked quinoa', 'paan raisins', 'millet bhujia', 'quinoa puffs']
    return any(kw in lower for kw in sku_keywords)

# ---------------------------------------------------------------------------
# Parsers
# ---------------------------------------------------------------------------

def parse_pods_sales() -> list[dict]:
    """
    PODs Availability sheet structure:
      Row 0: date timestamps at cols 0 (Apr 2026) and 6 (May 2026)
      Row 1: platform names — 'Big Basket' | 'Instamart' | 'Amazon' alternating
      Row 2: 'City' | 'Value' labels (repeated)
      Row 3+: actual data

    Column groups (each = city_col, value_col, platform, month):
      0-1:  Big Basket    Apr 2026
      2-3:  Instamart     Apr 2026
      4-5:  Amazon        Apr 2026
      6-7:  Big Basket    May 2026
      8-9:  Instamart     May 2026
    """
    df = pd.read_excel(COMMERCE_FILE, sheet_name='PODs Availability', header=None)
    row1 = df.iloc[1]  # platform names

    col_groups = []
    for i in range(0, len(df.columns) - 1, 2):
        platform_raw = row1.iloc[i]
        if pd.isna(platform_raw):
            break
        # determine month from the nearest date header in row 0
        date_val = None
        for j in range(i, -1, -1):
            if not pd.isna(df.iloc[0, j]):
                date_val = df.iloc[0, j]
                break
        if isinstance(date_val, datetime):
            month = date_val.strftime('%b %Y')
        else:
            month = 'Unknown'
        col_groups.append((i, i + 1, str(platform_raw).strip(), month))

    # Use a dict to aggregate: multiple raw city names can normalize to the same
    # canonical city (e.g. "Ahmedabad-Gandhinagar" + "ADALAJ" → "Ahmedabad").
    # Summing their MRP prevents ON CONFLICT duplicates within a single batch.
    agg: dict[tuple, float] = {}
    for city_col, val_col, platform, month in col_groups:
        for idx in range(3, len(df)):  # data starts at row 3
            city_raw = df.iloc[idx, city_col]
            val = df.iloc[idx, val_col]
            if pd.isna(city_raw) or pd.isna(val):
                continue
            city = normalize_city(str(city_raw))
            key = (city, platform, month)
            agg[key] = agg.get(key, 0.0) + float(val)

    rows = [
        {'city': c, 'platform': p, 'month': m, 'sales_mrp': v}
        for (c, p, m), v in agg.items()
    ]
    print(f'  pods_sales: {len(rows)} rows parsed')
    return rows


def parse_sku_sales() -> list[dict]:
    """
    SKU Level Sales sheet structure:
      Row 0: platform headers ('Big Basket - April', _, _, 'Instamart - April', _)
      Row 1: BB column labels (source_sku_id, source_city_name, Sum of total_mrp)
             + first Instamart data row (date-like value, total MRP) — skip
      Row 2+: actual data

    Big Basket (cols 0-2):
      col0 = SKU name (only on first row of that SKU; nan for city sub-rows)
      col1 = city name
      col2 = MRP

    Instamart (cols 3-4):
      col3 = SKU name (if is_sku_string) or city name
      col4 = MRP for that sku/city
      The SKU sub-total row (when col3=sku_name) is included but we only store city-level rows.
    """
    df = pd.read_excel(COMMERCE_FILE, sheet_name='SKU Level Sales', header=None)

    # Aggregate into (sku, line, city, platform) → mrp to merge any city name variants
    agg: dict[tuple, dict] = {}

    # ---- Big Basket ----
    current_bb_sku = None
    current_bb_line = None
    for idx in range(1, len(df)):  # row 1 has column labels, row 2+ has data
        row = df.iloc[idx]
        sku_raw = row.iloc[0]
        city_raw = row.iloc[1]
        mrp_raw = row.iloc[2]

        if pd.isna(city_raw) or pd.isna(mrp_raw):
            continue
        if not pd.isna(sku_raw) and isinstance(sku_raw, str):
            sku, line = normalize_sku(sku_raw)
            current_bb_sku = sku
            current_bb_line = line

        if current_bb_sku and isinstance(city_raw, str) and not is_sku_string(city_raw):
            city = normalize_city(city_raw)
            try:
                mrp = float(mrp_raw)
            except (TypeError, ValueError):
                continue
            key = (current_bb_sku, current_bb_line, city, 'Big Basket')
            if key in agg:
                agg[key]['sales_mrp'] += mrp
            else:
                agg[key] = {
                    'sku': current_bb_sku,
                    'sku_raw': str(sku_raw) if not pd.isna(sku_raw) else None,
                    'line': current_bb_line,
                    'city': city,
                    'platform': 'Big Basket',
                    'sales_mrp': mrp,
                }

    # ---- Instamart ----
    current_im_sku = None
    current_im_line = None
    for idx in range(1, len(df)):  # skip row 0 (platform headers)
        row = df.iloc[idx]
        col3 = row.iloc[3]
        col4 = row.iloc[4]

        if pd.isna(col3) or pd.isna(col4):
            continue
        if isinstance(col3, datetime):
            continue  # grand-total/date row — skip

        if is_sku_string(col3):
            sku, line = normalize_sku(col3)
            current_im_sku = sku
            current_im_line = line
            # col4 here is the subtotal MRP; don't add as a city row
        elif current_im_sku and isinstance(col3, str):
            city = normalize_city(col3)
            try:
                mrp = float(col4)
            except (TypeError, ValueError):
                continue
            key = (current_im_sku, current_im_line, city, 'Instamart')
            if key in agg:
                agg[key]['sales_mrp'] += mrp
            else:
                agg[key] = {
                    'sku': current_im_sku,
                    'sku_raw': None,
                    'line': current_im_line,
                    'city': city,
                    'platform': 'Instamart',
                    'sales_mrp': mrp,
                }

    rows = list(agg.values())
    print(f'  sku_sales: {len(rows)} rows parsed')
    return rows


def parse_sales_spends() -> list[dict]:
    """
    Sales vs Spends sheet structure:
      Row 0: _, _, 'Date', BB_total, BB_total, BB_A2S, IM_total, IM_total, IM_A2S
      Row 1: _, _, _, 'Big Basket', _, _, 'Instamart', _, _
      Row 2: _, _, _, 'Spends', 'Sales', 'A2S', 'Spends', 'Sales', 'A2S'
      Row 3+: _, _, date, bb_spend, bb_sales, bb_a2s, im_spend, im_sales, im_a2s
    """
    df = pd.read_excel(COMMERCE_FILE, sheet_name='Sales vs Spends', header=None)

    rows = []
    for idx in range(3, len(df)):
        row = df.iloc[idx]
        date_raw = row.iloc[2]
        if pd.isna(date_raw):
            continue

        if isinstance(date_raw, datetime):
            d = date_raw.date().isoformat()
        else:
            try:
                d = (date(1899, 12, 30) + timedelta(days=int(date_raw))).isoformat()
            except (TypeError, ValueError):
                continue

        try:
            bb_spend = float(row.iloc[3])
            bb_sales = float(row.iloc[4])
            im_spend = float(row.iloc[6])
            im_sales = float(row.iloc[7])
        except (TypeError, ValueError):
            continue

        rows.append({'date': d, 'platform': 'Big Basket', 'spend': bb_spend, 'sales': bb_sales})
        rows.append({'date': d, 'platform': 'Instamart',  'spend': im_spend, 'sales': im_sales})

    print(f'  sales_spends: {len(rows)} rows parsed')
    return rows


# Valid categorical values for survey data filtering
VALID_LOCATIONS = {
    'Agartala', 'Agra', 'Ahmedabad', 'Aizawl', 'Alappuzha', 'Aligarh',
    'Amritsar', 'Asansol', 'Aurangabad', 'Bareilly', 'Belagavi', 'Bengaluru',
    'Bhopal', 'Bhubaneswar', 'Chandigarh', 'Chennai', 'Coimbatore',
    'Davanagere', 'Dehradun', 'Delhi', 'Dimapur', 'Durgapur', 'Faridabad',
    'Gangtok', 'Gurugram', 'Guwahati', 'Gwalior', 'Hubballi', 'Hyderabad',
    'Imphal', 'Indore', 'Itanagar', 'Jabalpur', 'Jaipur', 'Jammu',
    'Jamshedpur', 'Jodhpur', 'Kanpur', 'Kochi', 'Kohima', 'Kolkata',
    'Kollam', 'Kozhikode', 'Lucknow', 'Ludhiana', 'Madurai', 'Mangalore',
    'Meerut', 'Moradabad', 'Mumbai', 'Mysuru', 'Nagpur', 'Nashik', 'Nellore',
    'Noida', 'Panaji', 'Patna', 'Prayagraj', 'Puducherry', 'Pune', 'Raipur',
    'Rajkot', 'Ranchi', 'Salem', 'Shillong', 'Shimla', 'Siliguri', 'Solapur',
    'Srinagar', 'Surat', 'Thane', 'Thrissur', 'Tiruchirappalli', 'Tirupati',
    'Udaipur', 'Vadodara', 'Varanasi', 'Vijayawada', 'Visakhapatnam', 'Warangal',
}

VALID_PLATFORMS = {'Blinkit', 'Zepto', 'Instamart', 'BigBasket', 'Amazon', 'Other'}
VALID_FREQUENCIES = {'Daily', 'Few times a week', 'Weekly', 'Monthly', 'Rarely', 'Occasionally'}


def parse_survey() -> list[dict]:
    """
    Survey sheet has clean headers. Filter rows with bad data (Location='Daily', etc.).
    """
    df = pd.read_excel(SURVEY_FILE, sheet_name='Sheet1', header=0)
    rows = []
    skipped = 0
    for _, r in df.iterrows():
        location = str(r.get('Location', '')).strip()
        platform = str(r.get('Platform', '')).strip()
        freq = str(r.get('Consumption Frequency', '')).strip()

        # Filter out obviously misaligned rows
        if location not in VALID_LOCATIONS:
            skipped += 1
            continue
        if platform not in VALID_PLATFORMS:
            platform = 'Other'

        skipped_flag = str(r.get('Skipped Due to Unavailability', 'No')).strip().lower() == 'yes'
        pincode_avail = str(r.get('Pincode Availability', 'Yes')).strip().lower() == 'yes'

        rows.append({
            'id': str(r['MadMix Code']).strip(),
            'submitted_at': datetime.now(timezone.utc).isoformat(),
            'age_group': str(r.get('Age Group', '')).strip() or None,
            'location': location,
            'consumption_frequency': freq if freq in VALID_FREQUENCIES else None,
            'skipped_due_to_unavailability': skipped_flag,
            'platform': platform,
            'pincode_availability': pincode_avail,
        })
    print(f'  survey_responses: {len(rows)} rows parsed ({skipped} skipped/invalid)')
    return rows


# ---------------------------------------------------------------------------
# Supabase upserter
# ---------------------------------------------------------------------------

def get_client():
    from supabase import create_client
    url = os.environ['SUPABASE_URL']
    key = os.environ['SUPABASE_SERVICE_ROLE_KEY']
    return create_client(url, key)


UPSERT_CONFLICTS = {
    'pods_sales':        'city, platform, month',
    'sku_sales':         None,               # no unique constraint; insert fresh
    'sales_spends':      'date, platform',
    'survey_responses':  'id',
}

BATCH_SIZE = 200

def upsert_table(client, table: str, rows: list[dict], dry_run: bool) -> None:
    if not rows:
        print(f'  {table}: 0 rows — nothing to insert')
        return
    if dry_run:
        print(f'  {table}: would insert {len(rows)} rows (dry run)')
        return

    conflict = UPSERT_CONFLICTS.get(table)
    for start in range(0, len(rows), BATCH_SIZE):
        batch = rows[start:start + BATCH_SIZE]
        if conflict:
            client.table(table).upsert(batch, on_conflict=conflict).execute()
        else:
            client.table(table).insert(batch).execute()

    print(f'  {table}: {len(rows)} rows inserted/updated')


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description='MadMix data normalizer')
    parser.add_argument('--dry-run', action='store_true', help='Print counts only, no DB writes')
    parser.add_argument('--table', choices=['pods_sales', 'sku_sales', 'sales_spends', 'survey_responses', 'all'],
                        default='all', help='Which table to load')
    args = parser.parse_args()

    client = None if args.dry_run else get_client()

    tables_to_run = (
        ['pods_sales', 'sku_sales', 'sales_spends', 'survey_responses']
        if args.table == 'all' else [args.table]
    )

    parsers = {
        'pods_sales':       parse_pods_sales,
        'sku_sales':        parse_sku_sales,
        'sales_spends':     parse_sales_spends,
        'survey_responses': parse_survey,
    }

    print('MadMix clean_load.py')
    print(f'Mode: {"DRY RUN" if args.dry_run else "LIVE INSERT"}')
    print('-' * 40)

    for table in tables_to_run:
        print(f'\nParsing {table}...')
        rows = parsers[table]()
        if not args.dry_run:
            print(f'  Upserting to Supabase...')
            upsert_table(client, table, rows, dry_run=False)
        else:
            upsert_table(client, table, rows, dry_run=True)

    print('\nDone.')


if __name__ == '__main__':
    main()
