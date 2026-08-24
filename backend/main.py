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
from services.bedrock_service import get_ai_recommendation


app = FastAPI()

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
    ai_recommendation = get_ai_recommendation(
        request.days,
        request.destination,
        request.budget,
        request.travel_style
    )

    # create a Trip ORM object
    trip = Trip(
        destination  = request.destination,
        days         = request.days,
        budget       = request.budget,
        category     = category,
        daily_budget = daily_budget,
        ai_recommendation = ai_recommendation,
        travel_style= request.travel_style
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
    trip.travel_style = request.travel_style
    db.commit()
    db.refresh(trip)
    db.close()
    return trip


# POST endpoint – generate & persist AI recommendation for an existing trip
@app.post("/api/v1/trips/{trip_id}/generate")
def generate_trip_recommendation(trip_id: int):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")

    ai_rec = get_ai_recommendation(
        days=trip.days,
        destination=trip.destination,
        budget=trip.budget,
        travel_style=trip.travel_style,
    )

    trip.ai_recommendation = ai_rec
    db.commit()
    db.refresh(trip)
    db.close()
    return trip