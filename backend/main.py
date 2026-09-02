import os

# pyrefly: ignore [missing-import]
from fastapi import Depends, FastAPI, HTTPException

# pyrefly: ignore [missing-import]
from pydantic import BaseModel
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
from services.trip_service import (
    calculate_daily_budget,
    get_trip_category,
    get_transportation,
    get_recommended_places,
    transportation_list
)
from services.bedrock_service import get_ai_recommendation
from services.kb_service import retrieve_and_generate
from services.chat_service import (
    create_conversation,
    delete_conversation,
    end_conversation,
    list_conversations,
    list_messages,
    rename_conversation,
    send_message,
)

load_dotenv()

app = FastAPI()

# CORS – read FRONTEND_URL from .env so production only needs a Vercel URL change
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_methods=["*"],
    allow_headers=["*"],
)

# SESSION 4
from models.trip import Trip
from models.user import User
from database import SessionLocal, init_db
from schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserPublic
from schemas.chat import (
    ConversationCreated,
    ConversationPublic,
    MessagePublic,
    RenameConversationRequest,
    SendMessageRequest,
    SendMessageResponse,
)
from services.auth_service import get_current_user, login as login_user, register as register_user

class TripRequest(BaseModel):
    destination: str
    days: int
    budget: float
    month: str = "December"
    travel_style: str = "Family"


class AskRequest(BaseModel):
    question: str



# Create table in PostgreSQL
init_db()


@app.post("/api/v1/auth/register", response_model=UserPublic)
def register(request: RegisterRequest):
    user = register_user(request.name, request.email, request.password)
    return UserPublic(id=user.id, name=user.name, email=user.email)


@app.post("/api/v1/auth/login", response_model=TokenResponse)
def login(request: LoginRequest):
    return login_user(request.email, request.password)


@app.get("/api/v1/auth/me", response_model=UserPublic)
def me(user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        trip_count = db.query(Trip).filter(Trip.user_id == user.id).count()
        return UserPublic(
            id=user.id,
            name=user.name,
            email=user.email,
            trip_count=trip_count,
        )
    finally:
        db.close()


@app.post("/api/v1/trips")
def create_trip(request: TripRequest, user: User = Depends(get_current_user)):
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
        travel_style= request.travel_style,
        user_id=user.id,  # ownership — backend sets this
    )

    # save to PostgreSQL
    db = SessionLocal()
    db.add(trip)
    db.commit()
    db.refresh(trip)   # get the auto-generated id
    db.close()
    return trip


@app.get("/api/v1/trips")
def list_trips(user: User = Depends(get_current_user)):
    db = SessionLocal()
    trips = db.query(Trip).filter(Trip.user_id == user.id).all()
    db.close()
    return trips


def _load_trip(db, trip_id: int) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")
    return trip


def _reject_if_not_owner(trip: Trip, user: User) -> None:
    if trip.user_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot modify another user's trip",
        )


@app.get("/api/v1/trips/{trip_id}")
def get_trip(trip_id: int, user: User = Depends(get_current_user)):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == user.id).first()
    db.close()
  # handling not found
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")
    return trip



# CHALLENGE & HOMEWORK
# DELETE endpoint – remove a trip by ID
@app.delete("/api/v1/trips/{trip_id}")
def delete_trip(trip_id: int, user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        trip = _load_trip(db, trip_id)
        _reject_if_not_owner(trip, user)
        db.delete(trip)
        db.commit()
        return {"message": f"Trip {trip_id} deleted"}
    finally:
        db.close()

# PUT endpoint – update budget, recalculate category + daily_budget
@app.put("/api/v1/trips/{trip_id}")
def update_trip(trip_id: int, request: TripRequest, user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        trip = _load_trip(db, trip_id)
        _reject_if_not_owner(trip, user)
        # update fields & recalculate
        trip.destination  = request.destination
        trip.days         = request.days
        trip.budget       = request.budget
        trip.category     = get_trip_category(request.budget)
        trip.daily_budget = calculate_daily_budget(request.budget, request.days)
        trip.travel_style = request.travel_style
        db.commit()
        db.refresh(trip)
        return trip
    finally:
        db.close()


# POST endpoint – generate & persist AI recommendation for an existing trip
@app.post("/api/v1/trips/{trip_id}/generate")
def generate_trip_recommendation(trip_id: int, user: User = Depends(get_current_user)):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == user.id).first()
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


@app.post("/api/v1/ask")
def ask(request: AskRequest):
    try:
        result = retrieve_and_generate(request.question)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "question": request.question,
        "answer": result["answer"],
        "source": result["source"],
    }



@app.post("/api/v1/conversations", response_model=ConversationCreated, status_code=201)
def start_conversation(user: User = Depends(get_current_user)):
    conversation_id = create_conversation(user.id)
    return ConversationCreated(conversation_id=conversation_id)


@app.get("/api/v1/conversations", response_model=list[ConversationPublic])
def get_conversations(user: User = Depends(get_current_user)):
    return list_conversations(user.id)


@app.patch("/api/v1/conversations/{conversation_id}", response_model=ConversationPublic)
def patch_conversation(
    conversation_id: int,
    request: RenameConversationRequest,
    user: User = Depends(get_current_user),
):
    return rename_conversation(conversation_id, user.id, request.title)


@app.post("/api/v1/conversations/{conversation_id}/end", response_model=ConversationPublic)
def close_conversation(conversation_id: int, user: User = Depends(get_current_user)):
    return end_conversation(conversation_id, user.id)


@app.delete("/api/v1/conversations/{conversation_id}")
def remove_conversation(conversation_id: int, user: User = Depends(get_current_user)):
    return delete_conversation(conversation_id, user.id)


@app.get(
    "/api/v1/conversations/{conversation_id}/messages",
    response_model=list[MessagePublic],
)
def get_messages(conversation_id: int, user: User = Depends(get_current_user)):
    return list_messages(conversation_id, user.id)


@app.post(
    "/api/v1/conversations/{conversation_id}/messages",
    response_model=SendMessageResponse,
    status_code=201,
)
def post_message(
    conversation_id: int,
    request: SendMessageRequest,
    user: User = Depends(get_current_user),
):
    return send_message(conversation_id, user.id, request.content)
