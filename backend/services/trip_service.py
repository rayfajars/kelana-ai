# ─── 1. CONDITIONALS ────────────────────────
def get_trip_category(budget):
    if budget < 1000:
        return "Backpacker"
    elif budget < 3000:
        return "Standard"
    else:
        return "Luxury"


def get_transportation(category):
    if category == "Backpacker":
        return "Bus"
    elif category == "Standard":
        return "Train"
    elif category == "Luxury":
        return "Flight"
    return "Unknown"


def get_travel_season(month):
    if month == "December" or month == 12:
        return "Peak Season"
    elif month == "June" or month == 6:
        return "Holiday Season"
    else:
        return "Regular Season"



# ─── 2. ARITHMETIC ──────────────────────────
def calculate_daily_budget(budget, days):
    return budget / days


def calculate_total_cost(hotel, food, trans):
    return hotel + food + trans


# ─── 3. LISTS ───────────────────────────────
recommended_places = [
    "Tokyo Tower",
    "Shibuya",
    "Mount Fuji"
]


def get_recommended_places():
    return recommended_places
