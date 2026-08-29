#!/usr/bin/env python3
"""
Backend API tests for Midnight Operating Theater
Tests the two key endpoints: /api/case/current and /api/events/stream
"""
import requests
import sys
import json
import time
from datetime import datetime

# Use the public endpoint
BASE_URL = "https://recovery-theater-1.preview.emergentagent.com/api"

class TheaterAPITester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.issues = []

    def log_pass(self, test_name):
        """Log a passing test"""
        self.tests_run += 1
        self.tests_passed += 1
        print(f"✅ PASS: {test_name}")

    def log_fail(self, test_name, reason):
        """Log a failing test"""
        self.tests_run += 1
        print(f"❌ FAIL: {test_name}")
        print(f"   Reason: {reason}")
        self.issues.append({"test": test_name, "reason": reason})

    def test_case_current_endpoint(self):
        """Test GET /api/case/current returns full mock case JSON"""
        print("\n🔍 Testing GET /api/case/current...")
        
        try:
            response = requests.get(f"{BASE_URL}/case/current", timeout=10)
            
            if response.status_code != 200:
                self.log_fail("GET /api/case/current status", f"Expected 200, got {response.status_code}")
                return False
            
            self.log_pass("GET /api/case/current returns 200")
            
            # Parse JSON
            try:
                data = response.json()
            except json.JSONDecodeError as e:
                self.log_fail("GET /api/case/current JSON parsing", f"Invalid JSON: {e}")
                return False
            
            self.log_pass("GET /api/case/current returns valid JSON")
            
            # Check required top-level keys
            required_keys = [
                "case", "events", "recoveryCurve", "ghostRuns", 
                "policySnapshots", "stages", "interventions", 
                "trustLedger", "riskSignals", "networkPath"
            ]
            
            missing_keys = [key for key in required_keys if key not in data]
            if missing_keys:
                self.log_fail("GET /api/case/current structure", f"Missing keys: {missing_keys}")
                return False
            
            self.log_pass("GET /api/case/current has all required top-level keys")
            
            # Check events array has 15 items
            if not isinstance(data.get("events"), list):
                self.log_fail("GET /api/case/current events", "events is not a list")
                return False
            
            if len(data["events"]) != 15:
                self.log_fail("GET /api/case/current events count", f"Expected 15 events, got {len(data['events'])}")
                return False
            
            self.log_pass("GET /api/case/current has 15 events")
            
            # Check ghostRuns array has 5 items
            if not isinstance(data.get("ghostRuns"), list):
                self.log_fail("GET /api/case/current ghostRuns", "ghostRuns is not a list")
                return False
            
            if len(data["ghostRuns"]) != 5:
                self.log_fail("GET /api/case/current ghostRuns count", f"Expected 5 ghostRuns, got {len(data['ghostRuns'])}")
                return False
            
            self.log_pass("GET /api/case/current has 5 ghostRuns")
            
            # Check policySnapshots array has 3 items
            if not isinstance(data.get("policySnapshots"), list):
                self.log_fail("GET /api/case/current policySnapshots", "policySnapshots is not a list")
                return False
            
            if len(data["policySnapshots"]) != 3:
                self.log_fail("GET /api/case/current policySnapshots count", f"Expected 3 policySnapshots, got {len(data['policySnapshots'])}")
                return False
            
            self.log_pass("GET /api/case/current has 3 policySnapshots")
            
            # Check case object has required fields
            case = data.get("case", {})
            case_required = ["id", "paymentId", "merchant", "amount", "customer", "failedAt", "windowMinutes"]
            missing_case_fields = [field for field in case_required if field not in case]
            if missing_case_fields:
                self.log_fail("GET /api/case/current case object", f"Missing case fields: {missing_case_fields}")
                return False
            
            self.log_pass("GET /api/case/current case object has required fields")
            
            print(f"   📊 Case ID: {case.get('id')}, Merchant: {case.get('merchant')}, Amount: {case.get('amount')}")
            
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_fail("GET /api/case/current connection", f"Request failed: {e}")
            return False

    def test_sse_stream_endpoint(self):
        """Test GET /api/events/stream is a working SSE stream"""
        print("\n🔍 Testing GET /api/events/stream (SSE)...")
        
        try:
            # Connect to SSE stream with streaming=True
            response = requests.get(
                f"{BASE_URL}/events/stream", 
                stream=True, 
                timeout=15,
                headers={"Accept": "text/event-stream"}
            )
            
            if response.status_code != 200:
                self.log_fail("GET /api/events/stream status", f"Expected 200, got {response.status_code}")
                return False
            
            self.log_pass("GET /api/events/stream returns 200")
            
            # Check content-type
            content_type = response.headers.get("content-type", "")
            if "text/event-stream" not in content_type:
                self.log_fail("GET /api/events/stream content-type", f"Expected text/event-stream, got {content_type}")
                return False
            
            self.log_pass("GET /api/events/stream has correct content-type")
            
            # Try to read a few events from the stream
            events_received = []
            start_time = time.time()
            max_wait = 8  # Wait up to 8 seconds to receive events
            
            print("   📡 Listening for SSE events...")
            
            for line in response.iter_lines(decode_unicode=True):
                if line and line.startswith("data: "):
                    data_str = line[6:]  # Remove "data: " prefix
                    try:
                        event_data = json.loads(data_str)
                        events_received.append(event_data)
                        print(f"   📨 Received event #{len(events_received)}: type={event_data.get('type')}, severity={event_data.get('severity')}")
                        
                        # Check event structure
                        required_fields = ["id", "seq", "ts", "type", "severity", "summary"]
                        missing_fields = [field for field in required_fields if field not in event_data]
                        if missing_fields:
                            self.log_fail("SSE event structure", f"Event missing fields: {missing_fields}")
                        
                        # Stop after receiving 3 events
                        if len(events_received) >= 3:
                            break
                            
                    except json.JSONDecodeError as e:
                        self.log_fail("SSE event JSON parsing", f"Invalid JSON in event: {e}")
                
                # Timeout check
                if time.time() - start_time > max_wait:
                    break
            
            # Close the connection
            response.close()
            
            if len(events_received) == 0:
                self.log_fail("GET /api/events/stream events", "No events received within 8 seconds")
                return False
            
            self.log_pass(f"GET /api/events/stream emits events ({len(events_received)} received)")
            
            # Check that events have required fields
            all_valid = True
            for i, event in enumerate(events_received):
                required_fields = ["id", "seq", "ts", "type", "severity", "summary"]
                missing_fields = [field for field in required_fields if field not in event]
                if missing_fields:
                    all_valid = False
                    break
            
            if all_valid:
                self.log_pass("SSE events have all required fields (id, seq, ts, type, severity, summary)")
            else:
                self.log_fail("SSE event structure", "Some events missing required fields")
            
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_fail("GET /api/events/stream connection", f"Request failed: {e}")
            return False

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print(f"📊 TEST SUMMARY")
        print("="*60)
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100) if self.tests_run > 0 else 0:.1f}%")
        
        if self.issues:
            print("\n❌ ISSUES FOUND:")
            for issue in self.issues:
                print(f"  - {issue['test']}: {issue['reason']}")
        else:
            print("\n✅ ALL BACKEND TESTS PASSED!")
        
        print("="*60)
        
        return self.tests_run == self.tests_passed

def main():
    print("="*60)
    print("🎭 MIDNIGHT OPERATING THEATER - BACKEND API TESTS")
    print("="*60)
    print(f"Testing endpoint: {BASE_URL}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tester = TheaterAPITester()
    
    # Run tests
    tester.test_case_current_endpoint()
    tester.test_sse_stream_endpoint()
    
    # Print summary
    success = tester.print_summary()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
