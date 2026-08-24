#!/usr/bin/env python3
"""
NEXUS Platform — Unified Database Seeder
"""

import argparse
import os
import random
import sys
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from faker import Faker
from shapely.geometry import MultiPoint, Point, Polygon
from geoalchemy2.shape import from_shape

# Safe console output for Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Ensure project root is in sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

ZONES: list[dict[str, Any]] = [
    {
        "name": "Johannesburg CBD",
        "center": (28.0473, -26.2041),
        "spread": 0.025,
        "population_density": 12000.0,
        "vulnerability_index": 45.0,
        "infra_scores": {
            "water_quality_score": 58.0,
            "road_condition_score": 62.0,
            "grid_reliability_score": 55.0,
            "digital_connectivity_score": 65.0,
        },
        "budget_projects": [
            ("Joburg Inner City Water Main Upgrade", "Water", 2_500_000),
            ("CBD Traffic Light Modernization", "Roads", 800_000),
            ("Free Public WiFi Rollout Phase 2", "Internet", 1_200_000),
        ],
        "request_weight": 0.25,
        "languages": ["en", "zu", "xh", "af"],
    },
    {
        "name": "Soweto",
        "center": (27.8546, -26.2485),
        "spread": 0.035,
        "population_density": 8500.0,
        "vulnerability_index": 78.0,
        "infra_scores": {
            "water_quality_score": 22.0,
            "road_condition_score": 30.0,
            "grid_reliability_score": 25.0,
            "digital_connectivity_score": 35.0,
        },
        "budget_projects": [],  # Intentionally $0 for equity contrast
        "request_weight": 0.35,
        "languages": ["zu", "st", "en", "ts"],
    },
    {
        "name": "Sandton",
        "center": (28.0570, -26.1076),
        "spread": 0.020,
        "population_density": 3200.0,
        "vulnerability_index": 12.0,
        "infra_scores": {
            "water_quality_score": 92.0,
            "road_condition_score": 88.0,
            "grid_reliability_score": 95.0,
            "digital_connectivity_score": 90.0,
        },
        "budget_projects": [
            ("Sandton Fibre Backbone Expansion", "Internet", 8_500_000),
            ("Marlboro Road Widening Project", "Roads", 5_200_000),
            ("Sandton Stormwater Drainage Upgrade", "Sanitation", 3_800_000),
            ("Sandton Green Energy Grid Pilot", "Other", 6_000_000),
        ],
        "request_weight": 0.10,
        "languages": ["en", "af"],
    },
    {
        "name": "Pretoria Central",
        "center": (28.1881, -25.7479),
        "spread": 0.022,
        "population_density": 5500.0,
        "vulnerability_index": 38.0,
        "infra_scores": {
            "water_quality_score": 70.0,
            "road_condition_score": 68.0,
            "grid_reliability_score": 72.0,
            "digital_connectivity_score": 66.0,
        },
        "budget_projects": [
            ("Tshwane Sewer Rehabilitation", "Sanitation", 3_100_000),
            ("Church Street Resurfacing", "Roads", 1_900_000),
        ],
        "request_weight": 0.15,
        "languages": ["af", "en", "nso", "tn"],
    },
    {
        "name": "Mamelodi",
        "center": (28.3975, -25.7200),
        "spread": 0.030,
        "population_density": 9800.0,
        "vulnerability_index": 88.0,
        "infra_scores": {
            "water_quality_score": 15.0,
            "road_condition_score": 18.0,
            "grid_reliability_score": 10.0,
            "digital_connectivity_score": 12.0,
        },
        "budget_projects": [],  # Intentionally $0 for equity contrast
        "request_weight": 0.15,
        "languages": ["nso", "zu", "en", "ts"],
    },
]

COMPLAINT_TEMPLATES = {
    "Roads": [
        "There is a massive pothole on {street} that has been there for months",
        "The road near {landmark} is completely destroyed, vehicles are getting damaged",
        "Street lights on {street} have not been working for weeks, very dangerous at night",
    ],
    "Water": [
        "We have had no running water for {days} days in {area}",
        "The water coming from our taps is brown and smells bad",
        "There is a burst water pipe on {street} flooding the road",
    ],
    "Sanitation": [
        "Raw sewage is flowing in the streets of {area}, health hazard",
        "The communal toilets have been broken for {days} days",
        "Refuse collection has stopped in our area for over a month",
    ],
    "Internet": [
        "There is no mobile signal in {area}, we cannot make calls",
        "The community WiFi hotspot at {landmark} has been offline for weeks",
        "We need internet connectivity in our school",
    ],
    "Other": [
        "Public infrastructure in {area} requires immediate attention",
    ],
}

STREETS = ["Vilakazi Street", "Mandela Drive", "Church Street", "Rivonia Road", "Oxford Road"]
LANDMARKS = ["the clinic", "the primary school", "the taxi rank", "the community hall"]


def build_zone_polygon(center_lon: float, center_lat: float, spread: float) -> Polygon:
    random.seed(hash((center_lon, center_lat)))
    pts = [
        (center_lon + random.uniform(-spread, spread), center_lat + random.uniform(-spread, spread))
        for _ in range(10)
    ]
    hull = MultiPoint(pts).convex_hull
    if not isinstance(hull, Polygon) or not hull.is_valid:
        hull = Point(center_lon, center_lat).buffer(spread)
    random.seed()
    return hull


def generate_point_in_polygon(polygon: Polygon) -> Point:
    minx, miny, maxx, maxy = polygon.bounds
    for _ in range(500):
        pt = Point(random.uniform(minx, maxx), random.uniform(miny, maxy))
        if polygon.contains(pt):
            return pt
    return polygon.representative_point()


def generate_complaint_text(category: str) -> str:
    templates = COMPLAINT_TEMPLATES.get(category, COMPLAINT_TEMPLATES["Roads"])
    return random.choice(templates).format(
        street=random.choice(STREETS),
        landmark=random.choice(LANDMARKS),
        area="our area",
        days=random.randint(3, 45),
    )


def seed_all(dry_run: bool = False, total_requests: int = 200):
    try:
        from backend.app.models import (
            DemographicData, InfrastructureIndex, CitizenRequest,
            PublicBudgetPlan, HumanOversightQueue, CategoryEnum, ProjectStatusEnum, OversightStatusEnum
        )
        from backend.app.core.database import init_db, SyncSessionLocal
    except ImportError:
        from app.models import (
            DemographicData, InfrastructureIndex, CitizenRequest,
            PublicBudgetPlan, HumanOversightQueue, CategoryEnum, ProjectStatusEnum, OversightStatusEnum
        )
        from app.core.database import init_db, SyncSessionLocal

    print("=" * 60)
    print(f"NEXUS Platform — Database Seeder ({'DRY RUN' if dry_run else 'LIVE DATABASE'})")
    print("=" * 60)

    if not dry_run:
        print("\n0. Initializing database (PostGIS + tables)...")
        init_db()
        print("  ✓ Database schema created")

    session = None if dry_run else SyncSessionLocal()

    try:
        print("\n1. Seeding zones & infrastructure indexes...")
        zone_map = {}
        for zone_def in ZONES:
            poly = build_zone_polygon(zone_def["center"][0], zone_def["center"][1], zone_def["spread"])
            reg_id = uuid.uuid4()
            zone_map[zone_def["name"]] = {"region_id": reg_id, "polygon": poly, "definition": zone_def}

            if not dry_run:
                demo = DemographicData(
                    region_id=reg_id,
                    region_name=zone_def["name"],
                    population_density=zone_def["population_density"],
                    vulnerability_index=zone_def["vulnerability_index"],
                    boundary=from_shape(poly, srid=4326),
                )
                infra = InfrastructureIndex(region_id=reg_id, **zone_def["infra_scores"])
                session.add(demo)
                session.add(infra)
            else:
                print(f"  [DRY] Zone: {zone_def['name']}, Pop: {zone_def['population_density']}")

        if not dry_run:
            session.flush()
        print(f"  ✓ Created {len(ZONES)} regions")

        print(f"\n2. Seeding {total_requests} citizen requests...")
        request_ids = []
        zone_names = list(zone_map.keys())
        weights = [zone_map[n]["definition"]["request_weight"] for n in zone_names]
        categories = list(CategoryEnum)

        for i in range(total_requests):
            zone_name = random.choices(zone_names, weights=weights, k=1)[0]
            z_info = zone_map[zone_name]
            poly = z_info["polygon"]
            cat = random.choice(categories)
            pt = generate_point_in_polygon(poly)
            req_id = uuid.uuid4()
            request_ids.append(req_id)
            lang = random.choice(z_info["definition"]["languages"])
            sentiment = round(max(-1.0, min(1.0, -0.3 if z_info["definition"]["vulnerability_index"] > 60 else 0.1 + random.gauss(0, 0.3))), 2)

            if not dry_run:
                cr = CitizenRequest(
                    id=req_id,
                    raw_text=generate_complaint_text(cat.value),
                    category=cat,
                    language=lang,
                    sentiment_score=sentiment,
                    location=from_shape(pt, srid=4326),
                    latitude=pt.y,
                    longitude=pt.x,
                    timestamp=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 60)),
                    metadata_json={"channel": "sms", "zone": zone_name},
                )
                session.add(cr)

        if not dry_run:
            session.flush()
        print(f"  ✓ Created {total_requests} citizen requests")

        print("\n3. Seeding budget plans...")
        for zone_name, z_info in zone_map.items():
            for proj_name, cat_str, budget_val in z_info["definition"]["budget_projects"]:
                cat_enum = CategoryEnum(cat_str) if cat_str in [c.value for c in CategoryEnum] else CategoryEnum.OTHER
                pt = generate_point_in_polygon(z_info["polygon"])
                if not dry_run:
                    bp = PublicBudgetPlan(
                        project_id=uuid.uuid4(),
                        region_id=z_info["region_id"],
                        project_name=proj_name,
                        category=cat_enum,
                        allocated_budget_usd=budget_val,
                        start_date=date(2026, 1, 1),
                        status=random.choice(list(ProjectStatusEnum)),
                        location=from_shape(pt, srid=4326),
                    )
                    session.add(bp)
        if not dry_run:
            session.flush()
        print("  ✓ Created budget plans")

        print("\n4. Seeding human oversight queue...")
        for req_id in request_ids[:8]:
            if not dry_run:
                oq = HumanOversightQueue(
                    id=uuid.uuid4(),
                    request_or_insight_id=req_id,
                    trigger_reason="Low NLP classification confidence",
                    confidence_score=0.45,
                    status=OversightStatusEnum.PENDING,
                )
                session.add(oq)
        if not dry_run:
            session.commit()
        print("  ✓ Created oversight queue items")

        print("\n✅ Seeding complete!")

    finally:
        if session:
            session.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Validate without DB")
    parser.add_argument("--requests", type=int, default=200, help="Number of requests")
    args = parser.parse_args()
    seed_all(dry_run=args.dry_run, total_requests=args.requests)
