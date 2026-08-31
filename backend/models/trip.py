# pyrefly: ignore [missing-import]
from sqlalchemy import Column, BigInteger, Integer, String, Float, DateTime, Text, ForeignKey
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
# pyrefly: ignore [missing-import]
from sqlalchemy.sql import func
from database import Base


class Trip(Base):
    __tablename__ = "trips"

    id                 = Column(Integer,    primary_key=True)
    user_id            = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    destination        = Column(String,     nullable=False)
    days               = Column(Integer,    nullable=False)
    budget             = Column(Float,      nullable=False)
    travel_style       = Column(String,     nullable=True)
    category           = Column(String,     nullable=False)
    daily_budget       = Column(Float,      nullable=False)
    ai_recommendation  = Column(Text,       nullable=True)
    created_at         = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="trips")
