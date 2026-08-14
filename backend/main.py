from fastapi import FastAPI
from pydantic import BaseModel
from services.trip_service import (
    calculate_daily_budget,
    get_trip_category,
    get_transportation,
    get_recommended_places,
    transportation_list
)

class TripRequest(BaseModel):
    destination: str
    days: int
    budget: float
    month: str = "December"
    travel_style: str = "Family"


app = FastAPI()

# GET endpoint at the root path
@app.get("/")
def home():
    return {
        "message" : "Welcome to KelanaAI"
    }


# GET endpoint at the root path
@app.get("/health")
def health_check():
    return {
        "status" : "OK"
    }    

# POST endpoint – receives JSON, returns JSON
@app.post("/api/v1/trips")
def create_trip(request: TripRequest):
    daily_budget = calculate_daily_budget(
        request.budget, request.days
    )
    category = get_trip_category(
        request.budget
    )
    transport = get_transportation(category)
    return {
        "destination" : request.destination,
        "budget" : request.budget,
        "daily_budget" : daily_budget,
        "category" : category,
        "travel_style" : request.travel_style,
        "recommendation_transport" : transport,
    }

# GET endpoint – list all valid trip categories
@app.get("/api/v1/trip-categories")
def list_trip_categories():
    return get_recommended_places()


# HOME WORK
# GET endpoint – list all valid transportation
@app.get("/api/v1/transportation")
def list_transportation():
    return transportation_list
