# pyrefly: ignore [missing-import]
from fastapi import FastAPI,HTTPException
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from services.trip_service import (
    calculate_daily_budget,
    get_trip_category,
    get_transportation,
    get_recommended_places,
    transportation_list
)


app = FastAPI()

# SESSION 3
# # GET endpoint at the root path
# @app.get("/")
# def home():
#     return {
#         "message" : "Welcome to KelanaAI"
#     }


# # GET endpoint at the root path
# @app.get("/health")
# def health_check():
#     return {
#         "status" : "OK"
#     }    

# # POST endpoint – receives JSON, returns JSON
# @app.post("/api/v1/trips")
# def create_trip(request: TripRequest):
#     daily_budget = calculate_daily_budget(
#         request.budget, request.days
#     )
#     category = get_trip_category(
#         request.budget
#     )
#     transport = get_transportation(category)
#     return {
#         "destination" : request.destination,
#         "budget" : request.budget,
#         "daily_budget" : daily_budget,
#         "category" : category,
#         "travel_style" : request.travel_style,
#         "recommendation_transport" : transport,
#     }

# # GET endpoint – list all valid trip categories
# @app.get("/api/v1/trip-categories")
# def list_trip_categories():
#     return get_recommended_places()


# HOME WORK
# GET endpoint – list all valid transportation
# @app.get("/api/v1/transportation")
# def list_transportation():
#     return transportation_list

# GET endpoint – list all valid trip categories
# @app.get("/api/v1/recommendations")
# def list_recommendations():
#     return get_recommended_places()
# END SESSION 3

# SESSION 4
from models.trip import Trip
from database import SessionLocal, init_db

class TripRequest(BaseModel):
    destination: str
    days: int
    budget: float
    month: str = "December"
    travel_style: str = "Family"



# Create table in PostgreSQL
init_db()


@app.post("/api/v1/trips")
def create_trip(request: TripRequest):
    # reuse Session 2 business logic
    daily_budget = calculate_daily_budget(request.budget, request.days)
    category     = get_trip_category(request.budget)

    # create a Trip ORM object
    trip = Trip(
        destination  = request.destination,
        days         = request.days,
        budget       = request.budget,
        category     = category,
        daily_budget = daily_budget,
    )

    # save to PostgreSQL
    db = SessionLocal()
    db.add(trip)
    db.commit()
    db.refresh(trip)   # get the auto-generated id
    db.close()
    return trip


@app.get("/api/v1/trips")
def list_trips():
    db = SessionLocal()
    trips = db.query(Trip).all()
    db.close()
    return trips


@app.get("/api/v1/trips/{trip_id}")
def get_trip(trip_id: int):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    db.close()
  # handling not found
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")
    return trip



# CHALLENGE & HOMEWORK
# DELETE endpoint – remove a trip by ID
@app.delete("/api/v1/trips/{trip_id}")
def delete_trip(trip_id: int):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")
    db.delete(trip)
    db.commit()
    db.close()
    return {"message": f"Trip {trip_id} deleted"}

# PUT endpoint – update budget, recalculate category + daily_budget
@app.put("/api/v1/trips/{trip_id}")
def update_trip(trip_id: int, request: TripRequest):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")
    # update fields & recalculate
    trip.destination  = request.destination
    trip.days         = request.days
    trip.budget       = request.budget
    trip.category     = get_trip_category(request.budget)
    trip.daily_budget = calculate_daily_budget(request.budget, request.days)
    db.commit()
    db.refresh(trip)
    db.close()
    return trip