from services.trip_service import get_travel_season


def print_trip_summary(destination, days, budget, month):
    season = get_travel_season(month)

    print(f"Destination  : {destination}")
    print(f"Days         : {days}")
    print(f"Budget       : {budget} USD")
    print(f"Travel Month : {month}")
    print(f"Season       : {season}")


print_trip_summary("Japan", 5, 1500, "December")