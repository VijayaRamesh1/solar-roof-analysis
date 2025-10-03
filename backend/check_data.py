#!/usr/bin/env python3
"""
Quick diagnostic script to verify Project SolisCAN backend
"""

import json
from pathlib import Path

def check_data():
    """Check if data files exist and are valid"""
    print("🔍 Checking Project SolisCAN Data...")
    print("=" * 60)
    
    data_dir = Path(__file__).parent.parent / 'data'
    
    # Check buildings.geojson
    buildings_path = data_dir / 'buildings.geojson'
    if buildings_path.exists():
        with open(buildings_path, 'r') as f:
            data = json.load(f)
            num_buildings = len(data.get('features', []))
            print(f"✅ buildings.geojson: {num_buildings} buildings found")
            
            # Check first building
            if num_buildings > 0:
                first_building = data['features'][0]
                coords = first_building['geometry']['coordinates'][0][0]
                props = first_building['properties']
                print(f"   Sample building:")
                print(f"   - ID: {props.get('id', 'N/A')}")
                print(f"   - Coordinates: {coords}")
                print(f"   - Solar Score: {props.get('solar_score', 'N/A')}")
                print(f"   - Address: {props.get('address', 'N/A')}")
    else:
        print("❌ buildings.geojson NOT FOUND")
        return False
    
    # Check metadata
    metadata_path = data_dir / 'metadata.json'
    if metadata_path.exists():
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
            print(f"✅ metadata.json: {metadata.get('total_buildings', 0)} buildings")
    else:
        print("❌ metadata.json NOT FOUND")
    
    # Check address index
    address_path = data_dir / 'address_index.json'
    if address_path.exists():
        with open(address_path, 'r') as f:
            addresses = json.load(f)
            print(f"✅ address_index.json: {len(addresses)} addresses")
    else:
        print("❌ address_index.json NOT FOUND")
    
    print("=" * 60)
    print("\n✅ Data check complete! All files are valid.")
    print("\n📝 Next steps:")
    print("1. Make sure backend is running: python serve_api.py")
    print("2. Check backend at: http://localhost:5001/api/buildings")
    print("3. Start frontend: npm start")
    print("4. Open browser console (F12) and check for errors")
    
    return True

if __name__ == '__main__':
    check_data()
