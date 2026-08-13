#Printing Output
# # Variables store the trip data
# destination = "Japan"
# days = 5
# budget = 1500
# travel_style = "Family"

# # Reuse them anywhere
# print(f"I'm going to {destination} for {days} days")
# print(f"My budget is ${budget} USD and I like {travel_style} style of travel")
# print(f"I'm going to {destination}")
# print(f"For {days} days")
# print(f"My budget is {budget}")
# print(f"Travel style: {travel_style}")

# User Input
# Ask the user for trip details
# destination  = input("Destination : ")
# days         = int(input("Days : "))
# budget       = float(input("Budget : "))
# travel_style = input("Travel Style : ")

# # Now use them
# print(f"Destination : {destination}")
# print(f"Days        : {days}")
# print(f"Budget      : {budget}")


# functions 
# def print_trip_summary(destination, days, budget, travel_style):
#     print("========================")
#     print("KelanaAI")
#     print("========================")
#     print(f"Destination : {destination}")
#     print(f"Days        : {days}")
#     print(f"Budget      : {budget}")
#     print(f"Style       : {travel_style}")
    
# # Call it with any trip
# print_trip_summary("Japan", 5, 1500, "Family")
# print_trip_summary("Bali", 3, 800, "Backpacker")


# # SESSION 2
# recommended_places = [
#     "Tokyo Tower",
#     "Shibuya",
#     "Mount Fuji"
# ]

# for place in recommended_places:
#     print(f"- {place}")

# print(recommended_places[0])

# def calculate_daily_budget(budget,days):
#     return budget/days

# # function print trip with calculate daily budget
# def print_trip_summary_with_calculate_daily(destination, days, budget, travel_style):
#     daily_budget = calculate_daily_budget(budget,days)
#     print("========================")
#     print("KelanaAI")
#     print("========================")
#     print(f"Destination : {destination}")
#     print(f"Days        : {days}")
#     print(f"Budget      : {budget}")
#     print(f"Style       : {travel_style}")
#     print(f"Daily Budget : {daily_budget}")
    
# # Call it with any trip
# print_trip_summary_with_calculate_daily("Jakarta", 2, 1500, "Family")


# print("========================")

# def get_trip_category(budget):
#     if budget < 1000:
#         return "Backpacker"
#     elif budget <= 3000:
#         return "Standard"
#     else:
#         return "Luxry"

# daily = calculate_daily_budget(1500,5)
# category = get_trip_category(1500)
# print(f"Daily Budget : {daily} USD/day")
# print(f"Category : {category}")


from services.trip_service import (
    calculate_daily_budget,
    get_trip_category,
    get_transportation,
    recommended_places,
)


def print_trip_summary(destination, days, budget):
    daily_budget = calculate_daily_budget(budget, days)
    category = get_trip_category(budget)
    transport = get_transportation(category)

    print("========================================")
    print("KelanaAI")
    print("========================================")
    print()
    print(f'Destination  = "{destination}"')
    print(f"Days         = {days}")
    print(f"Budget       = {budget} USD")
    print(f'Category     = "{category}"')
    print(f"Daily Budget = {int(daily_budget)} USD/Day")
    print()
    print(f"Recommended Transportation: {transport}")
    print()
    print("Recommended Places")
    print()
    for place in recommended_places:
        print(f"- {place}")


print_trip_summary("Japan", 5, 1500)



