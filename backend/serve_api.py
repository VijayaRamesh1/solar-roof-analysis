#!/usr/bin/env python3
"""
Flask API server for Project SolisCAN
Serves geospatial data and building analysis endpoints
"""

import json
import os
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
from drs_middleware import DRSMiddleware, add_drs_headers

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000'])

# Add DRS middleware
drs = DRSMiddleware(app, drs_url='http://localhost:8080')

# Data directory
DATA_DIR = Path(__file__).parent.parent / 'data'

def load_geojson():
    """Load the buildings GeoJSON data"""
    geojson_path = DATA_DIR / 'buildings.geojson'
    if not geojson_path.exists():
        return None
    
    with open(geojson_path, 'r') as f:
        return json.load(f)

def load_metadata():
    """Load metadata about the dataset"""
    metadata_path = DATA_DIR / 'metadata.json'
    if not metadata_path.exists():
        return {}
    
    with open(metadata_path, 'r') as f:
        return json.load(f)

def load_address_index():
    """Load address search index"""
    address_path = DATA_DIR / 'address_index.json'
    if not address_path.exists():
        return []
    
    with open(address_path, 'r') as f:
        return json.load(f)

@app.route('/api/buildings', methods=['GET'])
def get_buildings():
    """Get all building data as GeoJSON"""
    geojson_data = load_geojson()
    if not geojson_data:
        return jsonify({'error': 'No building data available'}), 404
    
    return jsonify(geojson_data)

@app.route('/api/buildings/<building_id>', methods=['GET'])
@drs.protect(action='building_details')  # Add DRS protection
def get_building_details(building_id):
    """Get detailed information for a specific building"""
    geojson_data = load_geojson()
    if not geojson_data:
        return jsonify({'error': 'No building data available'}), 404
    
    # Find the building by ID (check if id exists in properties, otherwise use index)
    for i, feature in enumerate(geojson_data['features']):
        # Use the building_id to find the correct building
        if feature['properties'].get('id') == building_id or f'building_{i}' == building_id:
            # Return the full building object (including geometry)
            building_data = {
                'id': feature['properties']['id'],
                'geometry': feature['geometry'],
                'properties': feature['properties'].copy()
            }
            
            # Add monthly production data
            annual_kwh = building_data['properties']['annual_kwh']
            monthly_data = create_monthly_production_data(annual_kwh)
            building_data['properties']['monthly_production'] = monthly_data
            
            # Add environmental benefits
            building_data['properties']['co2_savings'] = round(annual_kwh * 0.4, 0)  # kg CO2 per year
            building_data['properties']['trees_equivalent'] = round(building_data['properties']['co2_savings'] / 22, 0)
            
            return jsonify(building_data)
    
    return jsonify({'error': 'Building not found'}), 404

@app.route('/api/search', methods=['GET'])
def search_addresses():
    """Search for addresses"""
    query = request.args.get('q', '').lower()
    if not query:
        return jsonify([])
    
    address_index = load_address_index()
    results = []
    
    for address_data in address_index:
        if query in address_data['address'].lower():
            results.append({
                'id': address_data['id'],
                'address': address_data['address'],
                'solar_score': address_data['solar_score']
            })
    
    # Sort by solar score (highest first)
    results.sort(key=lambda x: x['solar_score'], reverse=True)
    
    return jsonify(results[:10])  # Limit to 10 results

@app.route('/api/metadata', methods=['GET'])
def get_metadata():
    """Get dataset metadata"""
    metadata = load_metadata()
    return jsonify(metadata)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'Project SolisCAN API'})

def create_monthly_production_data(annual_kwh):
    """Create monthly production data for charts"""
    # Montreal has seasonal variation
    monthly_factors = [0.3, 0.5, 0.8, 1.0, 1.2, 1.3, 1.4, 1.2, 1.0, 0.7, 0.4, 0.2]
    monthly_data = []
    
    for i, factor in enumerate(monthly_factors):
        monthly_kwh = annual_kwh * factor / 12
        monthly_data.append({
            'month': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
            'kwh': round(monthly_kwh, 0)
        })
    
    return monthly_data

@app.after_request
def after_request(response):
    add_drs_headers(response)
    return response

if __name__ == '__main__':
    print("🌞 Starting Project SolisCAN API Server...")
    print("📍 Available endpoints:")
    print("   GET /api/buildings - All building data")
    print("   GET /api/buildings/<id> - Building details")
    print("   GET /api/search?q=<query> - Address search")
    print("   GET /api/metadata - Dataset info")
    print("   GET /api/health - Health check")
    print("\n🚀 Server starting on http://localhost:5001")
    
    app.run(debug=True, host='0.0.0.0', port=5001)
