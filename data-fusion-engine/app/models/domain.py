from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base, relationship
from geoalchemy2 import Geometry
from sqlalchemy.sql import func

Base = declarative_base()

class DemographicData(Base):
    __tablename__ = 'demographic_data'

    id = Column(Integer, primary_key=True, index=True)
    region_name = Column(String, unique=True, index=True)
    population = Column(Integer)
    area_sq_km = Column(Float)
    boundary = Column(Geometry(geometry_type='POLYGON', srid=4326))

    # For IDS calculation
    normalized_population_density = Column(Float, default=0.0)
    
    complaints = relationship("CitizenComplaint", back_populates="region")
    budget = relationship("PublicBudgetPlan", back_populates="region", uselist=False)
    infrastructure = relationship("InfrastructureData", back_populates="region", uselist=False)

class CitizenComplaint(Base):
    __tablename__ = 'citizen_complaints'

    id = Column(Integer, primary_key=True, index=True)
    raw_audio_id = Column(String, index=True)
    translated_text = Column(String)
    category = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    sentiment = Column(Float)
    language = Column(String)
    
    # Governance Fields
    status = Column(String, default='APPROVED') # APPROVED, NEEDS_REVIEW, REJECTED
    confidence_score = Column(Float)
    flag_reason = Column(String, nullable=True)
    
    region_id = Column(Integer, ForeignKey('demographic_data.id'))
    region = relationship("DemographicData", back_populates="complaints")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PublicBudgetPlan(Base):
    __tablename__ = 'public_budget_plan'

    id = Column(Integer, primary_key=True, index=True)
    region_id = Column(Integer, ForeignKey('demographic_data.id'), unique=True)
    allocated_amount = Column(Float)
    
    region = relationship("DemographicData", back_populates="budget")

class InfrastructureData(Base):
    __tablename__ = 'infrastructure_data'

    id = Column(Integer, primary_key=True, index=True)
    region_id = Column(Integer, ForeignKey('demographic_data.id'), unique=True)
    infrastructure_score = Column(Float) # 0 to 1
    
    region = relationship("DemographicData", back_populates="infrastructure")
