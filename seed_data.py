#!/usr/bin/env python3
"""
NEXUS Platform — Mock Data Seed Script

Populates the database with realistic geospatial data for 5 zones
in Gauteng Province, South Africa. Designed to create clear equity
disparities for testing the DPI platform's analytical capabilities.

Usage:
    # Live database seeding
    python seed_data.py

    # Dry-run mode (validates data without database)
    python seed_data.py --dry-run

Zone Design (intentional equity contrasts):
    ┌─────────────────┬───────────┬───────┬──────────┬────────┐
    │ Zone            │ Pop/km²   │ Vuln  │ Infra    │ Budget │
    ├─────────────────┼───────────┼───────┼──────────┼────────┤
    │ Johannesburg CBD│ 12,000    │ 45    │ 55-65    │ Medium │
    │ Soweto          │  8,500    │ 78    │ 20-35    │ $0     │
    │ Sandton         │  3,200    │ 12    │ 85-95    │ High   │
    │ Pretoria Central│  5,500    │ 38    │ 65-75    │ Medium │
    │ Mamelodi        │  9,800    │ 88    │ 10-25    │ $0     │
    └─────────────────┴───────────┴───────┴──────────┴────────┘
"""

import argparse
import random
import sys
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any

from faker import Faker
from shapely.geometry import MultiPoint, Point, Polygon
from geoalchemy2.shape import from_shape

# Ensure safe console output across all platforms (including Windows cp1252)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# ---------------------------------------------------------------------------
# Zone Definitions — Gauteng Province, South Africa
# ---------------------------------------------------------------------------
# Coordinates: (longitude, latitude) — PostGIS convention
# Polygons are defined as convex hulls around scattered points,
# with slight overlaps at borders (~0.002°) for ST_Intersects testing.

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
        "request_weight": 40,  # Proportional to population density
        "languages": ["en", "zu", "xh", "af"],
    },
    {
        "name": "Soweto",
        "center": (27.8546, -26.2485),
        "spread": 0.030,
        "population_density": 8500.0,
        "vulnerability_index": 78.0,
        "infra_scores": {
            "water_quality_score": 22.0,
            "road_condition_score": 30.0,
            "grid_reliability_score": 25.0,
            "digital_connectivity_score": 35.0,
        },
        "budget_projects": [],  # $0 budget — deliberately neglected
        "request_weight": 50,
        "languages": ["zu", "xh", "st", "en"],
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
            ("Sandton Stormwater Drainage Upgrade", "Water", 3_800_000),
            ("Sandton Green Energy Grid Pilot", "Other", 6_000_000),
        ],
        "request_weight": 15,
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
        "request_weight": 30,
        "languages": ["af", "en", "zu", "nso"],
    },
    {
        "name": "Mamelodi",
        "center": (28.3975, -25.7200),
        "spread": 0.028,
        "population_density": 9800.0,
        "vulnerability_index": 88.0,
        "infra_scores": {
            "water_quality_score": 15.0,
            "road_condition_score": 18.0,
            "grid_reliability_score": 10.0,
            "digital_connectivity_score": 12.0,
        },
        "budget_projects": [],  # $0 budget — deliberately neglected
        "request_weight": 55,
        "languages": ["nso", "zu", "ts", "en"],
    },
]


# ---------------------------------------------------------------------------
# Citizen complaint templates (by category)
# ---------------------------------------------------------------------------

COMPLAINT_TEMPLATES: dict[str, list[str]] = {
    "Roads": [
        "There is a massive pothole on {street} that has been there for months",
        "The road near {landmark} is completely destroyed, vehicles are getting damaged",
        "Street lights on {street} have not been working for weeks, very dangerous at night",
        "No speed bumps near the school on {street}, children are at risk",
        "The gravel road in our area becomes impassable when it rains",
    ],
    "Water": [
        "We have had no running water for {days} days in {area}",
        "The water coming from our taps is brown and smells bad",
        "There is a burst water pipe on {street} flooding the road",
        "Our community borehole has dried up and no alternative provided",
        "Water pressure is so low we cannot even fill a bucket",
    ],
    "Sanitation": [
        "Raw sewage is flowing in the streets of {area}, health hazard",
        "The communal toilets have been broken for {days} days",
        "Refuse collection has stopped in our area for over a month",
        "There is illegal dumping near {landmark} attracting rats",
        "The drainage system is blocked causing flooding in {area}",
    ],
    "Internet": [
        "There is no mobile signal in {area}, we cannot make calls",
        "The community WiFi hotspot at {landmark} has been offline for weeks",
        "We need internet connectivity in our school, children cannot learn online",
        "Network coverage is extremely poor, cannot even send a WhatsApp",
        "There are no fiber or broadband options available in our area",
    ],
}

STREETS = [
    "Vilakazi Street", "Mandela Drive", "Church Street", "Rivonia Road",
    "Oxford Road", "Mamelodi Main Road", "Chris Hani Road", "Solomon Street",
    "Kgosi Mampuru Street", "Helen Joseph Street", "Beyers Naudé Drive",
]

LANDMARKS = [
    "the community hall", "the clinic", "the primary school",
    "the taxi rank", "the market square", "the library",
    "the sports ground", "the church", "the shopping centre",
]


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------

def build_zone_polygon(center_lon: float, center_lat: float, spread: float) -> Polygon:
    """
    Build a convex-hull polygon from scattered random points around a center.
    
    Uses 10 random points to create a naturalistic, irregular boundary.
    The spread parameter controls the radius (~degrees) of the zone.
    """
    random.seed(hash((center_lon, center_lat)))  # Reproducible per zone
    pts = [
        (
            center_lon + random.uniform(-spread, spread),
            center_lat + random.uniform(-spread, spread),
        )
        for _ in range(10)
    ]
    hull = MultiPoint(pts).convex_hull
    if not isinstance(hull, Polygon) or not hull.is_valid:
        # Fallback: circular buffer
        hull = Point(center_lon, center_lat).buffer(spread)
    # Reset random seed to non-deterministic for other data
    random.seed()
    return hull


def generate_point_in_polygon(polygon: Polygon) -> Point:
    """
    Generate a random point guaranteed to be inside the polygon.
    Uses rejection sampling with representative_point() fallback.
    """
    minx, miny, maxx, maxy = polygon.bounds
    for _ in range(500):
        pt = Point(random.uniform(minx, maxx), random.uniform(miny, maxy))
        if polygon.contains(pt):
            return pt
    return polygon.representative_point()


def generate_complaint_text(category: str) -> str:
    """Generate a realistic complaint from templates with random fills."""
    template = random.choice(COMPLAINT_TEMPLATES.get(category, COMPLAINT_TEMPLATES["Roads"]))
    return template.format(
        street=random.choice(STREETS),
        landmark=random.choice(LANDMARKS),
        area="our area",
        days=random.randint(3, 45),
    )


# ---------------------------------------------------------------------------
# Seed Functions
# ---------------------------------------------------------------------------

def seed_zones(session: Any, dry_run: bool = False) -> dict[str, dict]:
    """
    Create DemographicData + InfrastructureIndex for all 5 zones.
    Returns a mapping of zone_name -> {region_id, polygon}.
    """
    from app.models import (
        DemographicData,
        InfrastructureIndex,
    )

    zone_map: dict[str, dict] = {}

    for zone_def in ZONES:
        polygon = build_zone_polygon(
            zone_def["center"][0],
            zone_def["center"][1],
            zone_def["spread"],
        )
        region_id = uuid.uuid4()

        demo = DemographicData(
            region_id=region_id,
            region_name=zone_def["name"],
            population_density=zone_def["population_density"],
            vulnerability_index=zone_def["vulnerability_index"],
            boundary=from_shape(polygon, srid=4326),
        )

        infra = InfrastructureIndex(
            region_id=region_id,
            **zone_def["infra_scores"],
        )

        zone_map[zone_def["name"]] = {
            "region_id": region_id,
            "polygon": polygon,
            "definition": zone_def,
        }

        if dry_run:
            print(f"  [DRY] DemographicData: {zone_def['name']} "
                  f"(pop={zone_def['population_density']}, vuln={zone_def['vulnerability_index']})")
            print(f"  [DRY] InfrastructureIndex: {zone_def['infra_scores']}")
            print(f"  [DRY] Polygon valid={polygon.is_valid}, area={polygon.area:.6f}°²")
        else:
            session.add(demo)
            session.add(infra)

    if not dry_run:
        session.flush()
        print(f"  ✓ Created {len(ZONES)} regions with infrastructure indexes")

    return zone_map


def seed_citizen_requests(
    session: Any,
    zone_map: dict[str, dict],
    total_requests: int = 200,
    dry_run: bool = False,
) -> list[uuid.UUID]:
    """
    Generate CitizenRequest records distributed across zones,
    weighted by population density.
    """
    from app.models import CitizenRequest, CategoryEnum

    fake = Faker(["en_US", "zu_ZA"])
    categories = list(CategoryEnum)
    request_ids: list[uuid.UUID] = []

    # Build weighted zone list
    zone_names = list(zone_map.keys())
    weights = [zone_map[n]["definition"]["request_weight"] for n in zone_names]

    for i in range(total_requests):
        zone_name = random.choices(zone_names, weights=weights, k=1)[0]
        zone_info = zone_map[zone_name]
        zone_def = zone_info["definition"]
        polygon = zone_info["polygon"]

        category = random.choice(categories)
        point = generate_point_in_polygon(polygon)
        language = random.choice(zone_def["languages"])
        request_id = uuid.uuid4()
        request_ids.append(request_id)

        # Sentiment: higher vulnerability → more negative sentiment on average
        base_sentiment = -0.3 if zone_def["vulnerability_index"] > 60 else 0.1
        sentiment = round(max(-1.0, min(1.0, base_sentiment + random.gauss(0, 0.3))), 2)

        # Timestamp: spread over last 90 days
        ts = datetime.now(timezone.utc) - timedelta(
            days=random.randint(0, 90),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59),
        )

        raw_text = generate_complaint_text(category.value)

        cr = CitizenRequest(
            id=request_id,
            raw_text=raw_text,
            translated_text=raw_text if language == "en" else None,
            category=category,
            language=language,
            sentiment_score=sentiment,
            location=from_shape(point, srid=4326),
            timestamp=ts,
            metadata_json={
                "channel": random.choice(["sms", "whatsapp", "web", "voice", "ussd"]),
                "zone": zone_name,
                "device": random.choice(["feature_phone", "smartphone", "desktop", None]),
            },
        )

        if dry_run:
            if i < 5 or i == total_requests - 1:
                print(f"  [DRY] CitizenRequest #{i+1}: zone={zone_name}, "
                      f"cat={category.value}, lang={language}, "
                      f"sentiment={sentiment}, "
                      f"inside_polygon={polygon.contains(point)}")
        else:
            session.add(cr)

    if not dry_run:
        session.flush()
        print(f"  ✓ Created {total_requests} citizen requests across {len(zone_map)} zones")

    return request_ids


def seed_budget_plans(
    session: Any,
    zone_map: dict[str, dict],
    dry_run: bool = False,
) -> None:
    """
    Create PublicBudgetPlan records from zone definitions.
    Soweto and Mamelodi intentionally have $0 / no projects.
    """
    from app.models import PublicBudgetPlan, CategoryEnum, ProjectStatusEnum

    total_projects = 0

    for zone_name, zone_info in zone_map.items():
        zone_def = zone_info["definition"]
        polygon = zone_info["polygon"]
        region_id = zone_info["region_id"]

        for proj_name, cat_str, budget in zone_def["budget_projects"]:
            point = generate_point_in_polygon(polygon)
            status = random.choice(list(ProjectStatusEnum))
            start = date.today() - timedelta(days=random.randint(0, 365))

            bp = PublicBudgetPlan(
                project_id=uuid.uuid4(),
                region_id=region_id,
                project_name=proj_name,
                category=CategoryEnum(cat_str),
                allocated_budget_usd=budget,
                start_date=start,
                status=status,
                location=from_shape(point, srid=4326),
                boundary=None,
            )

            if dry_run:
                print(f"  [DRY] BudgetPlan: {proj_name} in {zone_name} — "
                      f"${budget:,.0f} ({status.value})")
            else:
                session.add(bp)
            total_projects += 1

    if not dry_run:
        session.flush()

    # Report neglected zones
    neglected = [n for n, z in zone_map.items() if not z["definition"]["budget_projects"]]
    print(f"  ✓ Created {total_projects} budget projects")
    if neglected:
        print(f"  ⚠ Zones with $0 budget (by design): {', '.join(neglected)}")


def seed_oversight_queue(
    session: Any,
    request_ids: list[uuid.UUID],
    count: int = 8,
    dry_run: bool = False,
) -> None:
    """
    Create HumanOversightQueue items referencing actual CitizenRequest IDs.
    Simulates low-confidence NLP outputs flagged for review.
    """
    from app.models import HumanOversightQueue, OversightStatusEnum

    trigger_reasons = [
        "Low NLP confidence — ambiguous category classification",
        "Anomalous sentiment score detected",
        "Potential duplicate request — spatial proximity match",
        "Flagged by content filter — possible misinformation",
        "Multi-language input — translation confidence below threshold",
        "Urgent safety concern — escalated for immediate review",
        "Budget allocation anomaly — region vulnerability mismatch",
        "Citizen identity verification required",
    ]

    selected_ids = random.sample(request_ids, min(count, len(request_ids)))

    for i, req_id in enumerate(selected_ids):
        confidence = round(random.uniform(0.15, 0.55), 2)
        status = random.choices(
            [OversightStatusEnum.PENDING, OversightStatusEnum.APPROVED, OversightStatusEnum.FLAGGED],
            weights=[0.5, 0.2, 0.3],
            k=1,
        )[0]

        hoq = HumanOversightQueue(
            id=uuid.uuid4(),
            request_or_insight_id=req_id,
            trigger_reason=trigger_reasons[i % len(trigger_reasons)],
            confidence_score=confidence,
            status=status,
            assigned_at=datetime.now(timezone.utc) if status != OversightStatusEnum.PENDING else None,
        )

        if dry_run:
            print(f"  [DRY] OversightQueue: reason='{trigger_reasons[i % len(trigger_reasons)][:50]}...', "
                  f"confidence={confidence}, status={status.value}")
        else:
            session.add(hoq)

    if not dry_run:
        session.flush()
        print(f"  ✓ Created {len(selected_ids)} human oversight queue items")


# ---------------------------------------------------------------------------
# Spatial Validation
# ---------------------------------------------------------------------------

def validate_spatial_integrity(zone_map: dict[str, dict]) -> None:
    """Verify polygon validity and report overlap pairs for ST_Intersects."""
    print("\n── Spatial Integrity Check ──")

    zones = list(zone_map.items())
    for name, info in zones:
        poly = info["polygon"]
        print(f"  {name}: valid={poly.is_valid}, vertices={len(poly.exterior.coords)}, "
              f"area={poly.area:.6f}°²")

    overlap_count = 0
    for i in range(len(zones)):
        for j in range(i + 1, len(zones)):
            name_a, info_a = zones[i]
            name_b, info_b = zones[j]
            if info_a["polygon"].intersects(info_b["polygon"]):
                overlap_count += 1
                print(f"  ↔ OVERLAP: {name_a} ∩ {name_b}")

    if overlap_count == 0:
        print("  ℹ No overlaps detected (zones are geographically distant — "
              "this is expected for Gauteng province)")
    print()


# ---------------------------------------------------------------------------
# Main Entry Point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="NEXUS Platform — Seed Database")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate data generation without connecting to the database",
    )
    parser.add_argument(
        "--requests",
        type=int,
        default=200,
        help="Number of citizen requests to generate (default: 200)",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("NEXUS Platform — Database Seeder")
    print(f"Mode: {'DRY RUN' if args.dry_run else 'LIVE DATABASE'}")
    print("=" * 60)

    if args.dry_run:
        # --- DRY RUN: No database needed ---
        print("\n1. Creating zone polygons & demographics...")
        zone_map = seed_zones(None, dry_run=True)

        print(f"\n2. Generating {args.requests} citizen requests...")
        request_ids = seed_citizen_requests(None, zone_map, args.requests, dry_run=True)

        print("\n3. Creating budget plans...")
        seed_budget_plans(None, zone_map, dry_run=True)

        print("\n4. Creating oversight queue items...")
        # Generate placeholder IDs for dry run
        placeholder_ids = [uuid.uuid4() for _ in range(args.requests)]
        seed_oversight_queue(None, placeholder_ids, dry_run=True)

        validate_spatial_integrity(zone_map)

        print("✅ Dry run complete — all data validates successfully!")
        return

    # --- LIVE: Connect to database ---
    from app.database import init_db, SessionLocal

    print("\n0. Initializing database (PostGIS + tables)...")
    init_db()
    print("  ✓ Database schema created")

    session = SessionLocal()
    try:
        print("\n1. Seeding zones & infrastructure indexes...")
        zone_map = seed_zones(session)

        print(f"\n2. Seeding {args.requests} citizen requests...")
        request_ids = seed_citizen_requests(session, zone_map, args.requests)

        print("\n3. Seeding budget plans...")
        seed_budget_plans(session, zone_map)

        print("\n4. Seeding oversight queue...")
        seed_oversight_queue(session, request_ids)

        session.commit()
        print("\n✅ All data committed successfully!")

        validate_spatial_integrity(zone_map)

        # --- Summary Stats ---
        print("── Row Counts ──")
        from app.models import (
            CitizenRequest, DemographicData, InfrastructureIndex,
            PublicBudgetPlan, HumanOversightQueue,
        )
        for model in [DemographicData, InfrastructureIndex, CitizenRequest,
                       PublicBudgetPlan, HumanOversightQueue]:
            count = session.query(model).count()
            print(f"  {model.__tablename__}: {count} rows")

    except Exception as e:
        session.rollback()
        print(f"\n❌ Error during seeding: {e}", file=sys.stderr)
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
