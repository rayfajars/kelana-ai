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
def print_trip_summary(destination, days, budget, travel_style):
    print("========================")
    print("KelanaAI")
    print("========================")
    print(f"Destination : {destination}")
    print(f"Days        : {days}")
    print(f"Budget      : {budget}")
    print(f"Style       : {travel_style}")
    
# Call it with any trip
print_trip_summary("Japan", 5, 1500, "Family")
print_trip_summary("Bali", 3, 800, "Backpacker")
