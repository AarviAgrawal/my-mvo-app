"""
Python mirror of the frontend's STATE_CITY_MAPPING and related constants.
Used by the backend for state→city lookups without a geo_reference DB round-trip.
"""

STATE_CITY_MAPPING: dict[str, list[str]] = {
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane', 'Solapur'],
    'Karnataka': ['Bangalore', 'Mysuru', 'Mangalore', 'Hubballi', 'Belagavi', 'Davanagere'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Anand', 'Vapi'],
    'Delhi': ['Delhi', 'Noida', 'Gurugram', 'Faridabad'],
    'Haryana': ['Gurugram', 'Faridabad', 'Chandigarh'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut', 'Noida', 'Bareilly', 'Aligarh', 'Moradabad'],
    'West Bengal': ['Kolkata', 'Durgapur', 'Asansol', 'Siliguri'],
    'Telangana': ['Hyderabad', 'Warangal'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirupati', 'Nellore'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Ajmer', 'Udaipur'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur'],
    'Kerala': ['Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Alappuzha'],
    'Andhra Pradesh': ['Vijayawada', 'Visakhapatnam', 'Tirupati', 'Nellore'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Chandigarh'],
    'Odisha': ['Bhubaneswar'],
    'Jharkhand': ['Jamshedpur', 'Ranchi'],
    'Bihar': ['Patna'],
    'Assam': ['Guwahati', 'Silchar'],
    'Uttarakhand': ['Dehradun'],
    'Goa': ['Panaji'],
}

# Flat set of all known canonical city names (for fast membership check)
ALL_CITIES: set[str] = {city for cities in STATE_CITY_MAPPING.values() for city in cities}

def get_cities_for_state(state: str) -> list[str]:
    return STATE_CITY_MAPPING.get(state, [])

def get_state_for_city(city: str) -> str | None:
    for state, cities in STATE_CITY_MAPPING.items():
        if city in cities:
            return state
    return None
