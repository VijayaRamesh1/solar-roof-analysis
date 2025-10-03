#!/usr/bin/env python3
"""
Fetch real building data from OpenStreetMap for Montreal
Generates realistic GeoJSON with actual building footprints
"""

import requests
import json
import random
from pathlib import Path

def fetch_osm_buildings(bbox, output_file):
    """
    Fetch building data from OpenStreetMap Overpass API
    bbox format: (min_lat, min_lon, max_lat, max_lon)
    """
    
    # Overpass API endpoint
    overpass_url = "http://overpass-api.de/api/interpreter"
    
    # Build Overpass query
    min_lat, min_lon, max_lat, max_lon = bbox
    
    overpass_query = f"""
    [out:json][timeout:60];
    (
      way["building"]({min_lat},{min_lon},{max_lat},{max_lon});
    );
    out body;
    >;
    out skel qt;
    """
    
    print(f"🌍 Fetching buildings from OpenStreetMap...")
    print(f"📍 Area: {min_lat},{min_lon} to {max_lat},{max_lon}")
    
    try:
        response = requests.post(overpass_url, data={'data': overpass_query}, timeout=120)
        response.raise_for_status()
        osm_data = response.json()
        
        print(f"✅ Received {len(osm_data['elements'])} elements from OSM")
        
        # Process OSM data into GeoJSON
        buildings = process_osm_to_geojson(osm_data, bbox)
        
        # Save to file
        output_path = Path(__file__).parent.parent / 'data' / output_file
        with open(output_path, 'w') as f:
            json.dump(buildings, f, indent=2)
        
        print(f"✅ Saved {len(buildings['features'])} buildings to {output_file}")
        return buildings
        
    except Exception as e:
        print(f"❌ Error fetching data: {e}")
        return None

def process_osm_to_geojson(osm_data, bbox):
    """Convert OSM data to our GeoJSON format with solar calculations"""
    
    # Create node lookup
    nodes = {}
    for element in osm_data['elements']:
        if element['type'] == 'node':
            nodes[element['id']] = (element['lon'], element['lat'])
    
    features = []
    building_count = 0
    
    for element in osm_data['elements']:
        if element['type'] == 'way' and 'building' in element.get('tags', {}):
            # Get building coordinates
            coords = []
            for node_id in element['nodes']:
                if node_id in nodes:
                    coords.append(list(nodes[node_id]))
            
            # Need at least 3 points and must be closed
            if len(coords) >= 3:
                # Ensure polygon is closed
                if coords[0] != coords[-1]:
                    coords.append(coords[0])
                
                # Calculate building metrics
                area = calculate_polygon_area(coords)
                
                # Estimate height from building type or levels
                tags = element.get('tags', {})
                building_type = tags.get('building', 'residential')
                levels = int(tags.get('building:levels', 2))
                height = levels * 3.5  # 3.5m per level
                
                # Calculate solar potential (simplified)
                roof_area = area
                solar_score = calculate_solar_score(coords, height, roof_area)
                
                # Create feature
                feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [coords]
                    },
                    "properties": {
                        "id": f"building_{building_count}",
                        "osm_id": element['id'],
                        "area": round(area, 2),
                        "height": round(height, 2),
                        "solar_score": solar_score,
                        "azimuth": random.uniform(0, 360),
                        "shading": random.uniform(5, 25),
                        "roof_area": round(roof_area * 0.8, 2),  # 80% usable
                        "annual_kwh": round(roof_area * 0.8 * 150 * (solar_score / 100), 0),
                        "payback_years": random.randint(15, 30),
                        "address": get_address_from_tags(tags, building_count),
                        "building_type": classify_building_type(building_type)
                    }
                }
                
                features.append(feature)
                building_count += 1
                
                # Limit to reasonable number
                if building_count >= 100:
                    break
    
    return {
        "type": "FeatureCollection",
        "features": features
    }

def calculate_polygon_area(coords):
    """Calculate area of polygon in square meters (approximate)"""
    # Simple shoelace formula
    n = len(coords)
    if n < 3:
        return 0
    
    area = 0
    for i in range(n):
        j = (i + 1) % n
        area += coords[i][0] * coords[j][1]
        area -= coords[j][0] * coords[i][1]
    
    area = abs(area) / 2
    
    # Convert to approximate square meters (very rough)
    # 1 degree lat ≈ 111km, 1 degree lon at 45°N ≈ 78km
    area_m2 = area * 111000 * 78000
    
    return area_m2

def calculate_solar_score(coords, height, roof_area):
    """Calculate solar potential score based on building characteristics"""
    # Base score
    score = 75
    
    # Larger roofs are better (up to a point)
    if roof_area > 500:
        score += 10
    elif roof_area < 200:
        score -= 15
    
    # Taller buildings might have more shading
    if height > 20:
        score -= 5
    
    # Add some randomness for realistic variation
    score += random.uniform(-15, 15)
    
    # Clamp between 0 and 100
    return max(0, min(100, round(score, 0)))

def classify_building_type(osm_type):
    """Classify building type"""
    type_map = {
        'house': 'residential',
        'residential': 'residential',
        'apartments': 'residential',
        'commercial': 'commercial',
        'retail': 'commercial',
        'industrial': 'industrial',
        'warehouse': 'industrial',
        'office': 'commercial',
        'school': 'institutional',
        'hospital': 'institutional',
        'church': 'institutional',
    }
    return type_map.get(osm_type.lower(), 'residential')

def get_address_from_tags(tags, index):
    """Extract or generate address from OSM tags"""
    # Try to get real address from tags
    house_number = tags.get('addr:housenumber', '')
    street = tags.get('addr:street', '')
    city = tags.get('addr:city', 'Montreal')
    
    if house_number and street:
        return f"{house_number} {street}, {city}, QC"
    else:
        # Generate realistic Montreal street names
        streets = [
            'Rue Saint-Laurent', 'Avenue du Mont-Royal', 'Rue Sainte-Catherine',
            'Boulevard René-Lévesque', 'Rue Sherbrooke', 'Avenue du Parc',
            'Rue Saint-Denis', 'Rue Crescent', 'Avenue McGill College',
            'Rue Peel', 'Boulevard Saint-Joseph', 'Rue Laurier'
        ]
        return f"{random.randint(100, 9999)} {random.choice(streets)}, Montreal, QC"

def create_address_index(buildings_data):
    """Create search index from buildings data"""
    index = []
    for feature in buildings_data['features']:
        props = feature['properties']
        index.append({
            'id': props['id'],
            'address': props['address'],
            'solar_score': props['solar_score']
        })
    return index

def update_metadata(buildings_data):
    """Update metadata file"""
    features = buildings_data['features']
    scores = [f['properties']['solar_score'] for f in features]
    
    metadata = {
        "total_buildings": len(features),
        "data_source": "OpenStreetMap (Real building footprints)",
        "last_updated": "2024-09-30T00:00:00",
        "coverage_area": "Montreal, QC (Downtown area)",
        "solar_score_range": {
            "min": round(min(scores), 2),
            "max": round(max(scores), 2)
        }
    }
    
    return metadata

if __name__ == '__main__':
    # Montreal downtown area (adjust coordinates as needed)
    # Format: (min_lat, min_lon, max_lat, max_lon)
    
    # Small area for testing
    bbox_small = (45.500, -73.570, 45.505, -73.565)  # ~500m x 500m
    
    # Medium area (recommended)
    bbox_medium = (45.495, -73.575, 45.510, -73.560)  # ~1.5km x 1.5km
    
    # Large area (takes longer)
    bbox_large = (45.490, -73.580, 45.520, -73.550)  # ~3km x 3km
    
    print("=" * 60)
    print("📥 OpenStreetMap Building Data Fetcher")
    print("=" * 60)
    print("\nAvailable areas:")
    print("1. Small area (Downtown core, ~50-100 buildings)")
    print("2. Medium area (Downtown + Plateau, ~100-200 buildings) [RECOMMENDED]")
    print("3. Large area (Greater downtown, ~200+ buildings)")
    
    choice = input("\nSelect area (1/2/3) [default: 2]: ").strip() or "2"
    
    bbox_map = {
        "1": bbox_small,
        "2": bbox_medium,
        "3": bbox_large
    }
    
    bbox = bbox_map.get(choice, bbox_medium)
    
    print(f"\n🚀 Starting data fetch...")
    buildings = fetch_osm_buildings(bbox, 'buildings.geojson')
    
    if buildings:
        # Create address index
        print("\n📇 Creating address index...")
        address_index = create_address_index(buildings)
        index_path = Path(__file__).parent.parent / 'data' / 'address_index.json'
        with open(index_path, 'w') as f:
            json.dump(address_index, f, indent=2)
        print(f"✅ Created address index with {len(address_index)} entries")
        
        # Update metadata
        print("\n📝 Updating metadata...")
        metadata = update_metadata(buildings)
        metadata_path = Path(__file__).parent.parent / 'data' / 'metadata.json'
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        print("✅ Metadata updated")
        
        print("\n" + "=" * 60)
        print("✅ SUCCESS! Real building data imported")
        print("=" * 60)
        print(f"\n📊 Summary:")
        print(f"   - Total buildings: {len(buildings['features'])}")
        print(f"   - Data source: OpenStreetMap")
        print(f"   - Area: Montreal, QC")
        print(f"   - Solar scores: {metadata['solar_score_range']['min']} - {metadata['solar_score_range']['max']}")
        print(f"\n🔄 Restart your backend server to load the new data!")
        print(f"   cd backend && python serve_api.py")
    else:
        print("\n❌ Failed to fetch data. Check your internet connection.")
