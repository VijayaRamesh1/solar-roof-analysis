#!/usr/bin/env python3
"""
🌞 DRS Telemetry Terminal Viewer
A beautiful command-line interface for viewing telemetry data
"""

import requests
import json
import time
import os
import sys
from datetime import datetime
from typing import Dict, List, Any

class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

class TelemetryViewer:
    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'Accept': 'application/json'})
        
    def clear_screen(self):
        """Clear the terminal screen"""
        os.system('cls' if os.name == 'nt' else 'clear')
        
    def print_header(self):
        """Print the header"""
        print(f"{Colors.HEADER}{Colors.BOLD}")
        print("🌞" + "=" * 78 + "🌞")
        print("  🌞 ADVANCED DRS TELEMETRY DASHBOARD 🌞")
        print("  Real-time Digital Rights & Security Analytics")
        print("🌞" + "=" * 78 + "🌞")
        print(f"{Colors.ENDC}")
        
    def fetch_sessions(self) -> List[Dict[str, Any]]:
        """Fetch sessions data from DRS server"""
        try:
            response = self.session.get(f"{self.base_url}/sessions", timeout=5)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"{Colors.FAIL}❌ Connection Error: {e}{Colors.ENDC}")
            return []
    
    def fetch_stats(self) -> Dict[str, int]:
        """Fetch stats from DRS server"""
        try:
            response = self.session.get(f"{self.base_url}/stats", timeout=5)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException:
            return {"totalSessions": 0, "activeSessions": 0}
    
    def format_duration(self, timestamp: int) -> str:
        """Format timestamp to readable duration"""
        now = int(time.time() * 1000)
        diff_ms = now - timestamp
        diff_minutes = diff_ms // (1000 * 60)
        diff_seconds = (diff_ms % (1000 * 60)) // 1000
        
        if diff_minutes > 0:
            return f"{diff_minutes}m {diff_seconds}s ago"
        else:
            return f"{diff_seconds}s ago" if diff_seconds > 0 else "just now"
    
    def print_session_summary(self, sessions: List[Dict[str, Any]]):
        """Print session summary"""
        stats = self.fetch_stats()
        
        print(f"{Colors.OKGREEN}📊 SYSTEM STATUS{Colors.ENDC}")
        print(f"{Colors.OKCYAN}{'━' * 50}{Colors.ENDC}")
        print(f"{Colors.BOLD}Total Sessions: {Colors.OKGREEN}{stats.get('totalSessions', 0)}{Colors.ENDC}")
        print(f"{Colors.BOLD}Active Sessions: {Colors.OKGREEN}{stats.get('activeSessions', 0)}{Colors.ENDC}")
        print(f"{Colors.BOLD}Survey Time: {Colors.OKGREEN}{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.ENDC}")
        print()
    
    def print_session_details(self, sessions: List[Dict[str, Any]]):
        """Print detailed session information"""
        if not sessions:
            print(f"{Colors.WARNING}🕐 No active sessions found{Colors.ENDC}")
            print(f"{Colors.OKBLUE}💡 Generate telemetry by browsing http://localhost:3000{Colors.ENDC}")
            return
        
        print(f"{Colors.OKGREEN}🔍 ACTIVE SESSIONS DETAILS{Colors.ENDC}")
        print(f"{Colors.OKCYAN}{'━' * 80}{Colors.ENDC}")
        
        for i, session in enumerate(sessions, 1):
            print(f"{Colors.BOLD}{Colors.OKBLUE}Session #{i}{Colors.ENDC}")
            print(f"  📱 Token: {Colors.OKCYAN}{session['sessionToken']}{Colors.ENDC}")
            print(f"  ⏱️  Age: {Colors.OKGREEN}{session.get('ageMinutes', 0)}m{Colors.ENDC}")
            print(f"  📊 Events: {Colors.OKGREEN}{session.get('eventCount', 0)}{Colors.ENDC}")
            print(f"  🕐 Last Activity: {Colors.OKGREEN}{self.format_duration(session['lastSeen'])}{Colors.ENDC}")
            print(f"  🖱️  Mouse Entropy: {Colors.WARNING}{session.get('mouseEntropy', 0):.3f}{Colors.ENDC}")
            print(f"  ⌨️  Keystroke Rate: {Colors.WARNING}{session.get('keystrokeCadence', 0):.0f}ms{Colors.ENDC}")
            print(f"  🔒 Device Fingerprints: {Colors.OKCYAN}{len(session.get('deviceFingerprints', []))}{Colors.ENDC}")
            
            # Recent events preview
            recent_events = session.get('recentEvents', [])
            if recent_events:
                print(f"  📋 Recent Events ({len(recent_events)}):")
                for event in recent_events[-5:]:  # Last 5 events
                    timestamp = datetime.fromtimestamp(event['timestamp'] / 1000).strftime('%H:%M:%S')
                    event_type_color = self.get_event_color(event['type'])
                    print(f"    {event_type_color}{event['type']:<12}{Colors.ENDC} @ {Colors.OKGREEN}{timestamp}{Colors.ENDC}")
            
            print(f"{Colors.OKCYAN}{'─' * 40}{Colors.ENDC}")
    
    def get_event_color(self, event_type: str) -> str:
        """Get color for event type"""
        colors = {
            'mouse': Colors.OKCYAN,
            'focus': Colors.WARNING,
            'blur': Colors.FAIL,
            'keystroke': Colors.OKGREEN,
            'device': Colors.OKBLUE
        }
        return colors.get(event_type, Colors.ENDC)
    
    def print_event_statistics(self, sessions: List[Dict[str, Any]]):
        """Print event statistics"""
        if not sessions:
            return
        
        print(f"\n{Colors.OKGREEN}📈 EVENT STATISTICS{Colors.ENDC}")
        print(f"{Colors.OKCYAN}{'━' * 50}{Colors.ENDC}")
        
        # Count event types
        event_counts = {}
        total_events = 0
        
        for session in sessions:
            for event in session.get('events', []):
                event_type = event['type']
                event_counts[event_type] = event_counts.get(event_type, 0) + 1
                total_events += 1
        
        if total_events > 0:
            print(f"Total Events Collected: {Colors.OKGREEN}{total_events}{Colors.ENDC}")
            print()
            
            for event_type, count in sorted(event_counts.items(), key=lambda x: x[1], reverse=True):
                percentage = (count / total_events) * 100
                color = self.get_event_color(event_type)
                bar_length = int(percentage / 2)  # Scale bar to fit in terminal
                bar = "█" * bar_length + "░" * (25 - bar_length)
                
                print(f"  {color}{event_type:<12}{Colors.ENDC} {bar} {count:>3} ({percentage:.1f}%)")
    
    def print_device_analysis(self, sessions: List[Dict[str, Any]]):
        """Print device analysis"""
        if not sessions:
            return
        
        print(f"\n{Colors.OKGREEN}🔒 DEVICE SECURITY ANALYSIS{Colors.ENDC}")
        print(f"{Colors.OKCYAN}{'━' * 50}{Colors.ENDC}")
        
        # Collect all unique fingerprints
        all_fingerprints = set()
        for session in sessions:
            for fingerprint in session.get('deviceFingerprints', []):
                all_fingerprints.add(fingerprint)
        
        if not all_fingerprints:
            print(f"{Colors.WARNING}⚠️  No device fingerprints detected{Colors.ENDC}")
            return
        
        print(f"Unique Device Fingerprints: {Colors.OKGREEN}{len(all_fingerprints)}{Colors.ENDC}")
        
        if len(all_fingerprints) == 1:
            print(f"{Colors.OKGREEN}🟢 Security Status: Consistent device usage{Colors.ENDC}")
        else:
            print(f"{Colors.WARNING}🟡 Security Status: Multiple devices detected{Colors.ENDC}")
        
        print(f"\nDetected Fingerprints:")
        for i, fingerprint in enumerate(all_fingerprints, 1):
            print(f"  {i}. {Colors.OKCYAN}{fingerprint}{Colors.ENDC}")
    
    def print_live_monitoring(self):
        """Print live monitoring dashboard"""
        sessions = self.fetch_sessions()
        
        self.clear_screen()
        self.print_header()
        self.print_session_summary(sessions)
        self.print_session_details(sessions)
        self.print_event_statistics(sessions)
        self.print_device_analysis(sessions)
        
        print(f"\n{Colors.OKBLUE}🔄 Press Ctrl+C to exit{Colors.ENDC}")
        print(f"{Colors.OKBLUE}📱 Open http://localhost:3000 to generate telemetry{Colors.ENDC}")
    
    def run_live_monitor(self, refresh_interval: int = 2):
        """Run live monitoring with periodic refresh"""
        try:
            print(f"{Colors.OKBLUE}🚀 Starting live telemetry monitoring...{Colors.ENDC}")
            print(f"{Colors.OKBLUE}Refresh interval: {refresh_interval} seconds{Colors.ENDC}")
            time.sleep(2)
            
            while True:
                self.print_live_monitoring()
                time.sleep(refresh_interval)
                
        except KeyboardInterrupt:
            self.clear_screen()
            print(f"\n{Colors.OKGREEN}✅ Telemetry monitoring stopped{Colors.ENDC}")
            print(f"{Colors.OKBLUE}Thank you for using DRS Telemetry Viewer!{Colors.ENDC}")

def main():
    if len(sys.argv) > 1:
        if sys.argv[1] == "--help" or sys.argv[1] == "-h":
            print(f"{Colors.BOLD}DRS Telemetry Viewer{Colors.ENDC}")
            print(f"Usage: python terminal-viewer.py [interval]")
            print(f"Arguments:")
            print(f"  interval    Refresh interval in seconds (default: 2)")
            print(f"Options:")
            print(f"  --help, -h  Show this help message")
            return
    
    refresh_interval = 2
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        refresh_interval = int(sys.argv[1])
    
    viewer = TelemetryViewer()
    viewer.run_live_monitor(refresh_interval)

if __name__ == "__main__":
    main()

