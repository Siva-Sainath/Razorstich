"""
Backend API tests for RazorStitch recovery console.
Tests all three endpoints: /api/case/current, /api/policy/recommend, /api/events/stream
"""
import requests
import sys
import json
from datetime import datetime

# Public endpoint from frontend/.env
BASE_URL = "https://recovery-theater-1.preview.emergentagent.com/api"

class RazorStitchTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.failures = []

    def log_pass(self, test_name):
        self.tests_passed += 1
        self.tests_run += 1
        print(f"✅ PASS: {test_name}")

    def log_fail(self, test_name, reason):
        self.tests_run += 1
        self.failures.append({"test": test_name, "reason": reason})
        print(f"❌ FAIL: {test_name}")
        print(f"   Reason: {reason}")

    def test_case_current(self):
        """Test GET /api/case/current - should return 72h MDP case structure"""
        print("\n🔍 Testing GET /api/case/current...")
        try:
            response = requests.get(f"{BASE_URL}/case/current", timeout=10)
            
            if response.status_code != 200:
                self.log_fail("GET /api/case/current status", f"Expected 200, got {response.status_code}")
                return False
            
            data = response.json()
            
            # Check case structure
            if "case" not in data:
                self.log_fail("GET /api/case/current structure", "Missing 'case' key")
                return False
            
            case = data["case"]
            required_fields = ["windowHours", "tickHours", "maxSteps", "maxContacts", 
                             "failureReason", "errorSource"]
            
            for field in required_fields:
                if field not in case:
                    self.log_fail("GET /api/case/current case fields", f"Missing '{field}' in case")
                    return False
            
            # Verify specific values
            if case["windowHours"] != 72:
                self.log_fail("GET /api/case/current windowHours", f"Expected 72, got {case['windowHours']}")
                return False
            
            if case["tickHours"] != 6:
                self.log_fail("GET /api/case/current tickHours", f"Expected 6, got {case['tickHours']}")
                return False
            
            if case["maxSteps"] != 12:
                self.log_fail("GET /api/case/current maxSteps", f"Expected 12, got {case['maxSteps']}")
                return False
            
            if case["maxContacts"] != 3:
                self.log_fail("GET /api/case/current maxContacts", f"Expected 3, got {case['maxContacts']}")
                return False
            
            # Check events (should have 15)
            if "events" not in data:
                self.log_fail("GET /api/case/current events", "Missing 'events' key")
                return False
            
            if len(data["events"]) != 15:
                self.log_fail("GET /api/case/current events count", f"Expected 15 events, got {len(data['events'])}")
                return False
            
            # Check other required structures
            required_keys = ["recoveryCurve", "ghostRuns", "stages", "interventions", "trustLedger"]
            for key in required_keys:
                if key not in data:
                    self.log_fail("GET /api/case/current structure", f"Missing '{key}' key")
                    return False
            
            # Verify ghostRuns has 5 entries
            if len(data["ghostRuns"]) != 5:
                self.log_fail("GET /api/case/current ghostRuns", f"Expected 5 ghost runs, got {len(data['ghostRuns'])}")
                return False
            
            # Verify trustLedger has 3 entries
            if len(data["trustLedger"]) != 3:
                self.log_fail("GET /api/case/current trustLedger", f"Expected 3 trust ledger entries, got {len(data['trustLedger'])}")
                return False
            
            self.log_pass("GET /api/case/current - complete structure")
            return True
            
        except Exception as e:
            self.log_fail("GET /api/case/current", f"Exception: {str(e)}")
            return False

    def test_policy_recommend_normal(self):
        """Test POST /api/policy/recommend - normal case (tick 4, contacts 1)"""
        print("\n🔍 Testing POST /api/policy/recommend (normal case)...")
        try:
            payload = {
                "tick": 4,
                "contacts_used": 1,
                "method": "card",
                "hours_since_failure": 24.0
            }
            
            response = requests.post(f"{BASE_URL}/policy/recommend", json=payload, timeout=10)
            
            if response.status_code != 200:
                self.log_fail("POST /api/policy/recommend status", f"Expected 200, got {response.status_code}")
                return False
            
            data = response.json()
            
            # Check required fields
            required_fields = ["selected_action", "q_values", "policy_version", "source", 
                             "constraints_passed", "constraints_total", "guardrails"]
            
            for field in required_fields:
                if field not in data:
                    self.log_fail("POST /api/policy/recommend fields", f"Missing '{field}'")
                    return False
            
            # Verify selected_action is create_payment_link for tick 4
            if data["selected_action"] != "create_payment_link":
                self.log_fail("POST /api/policy/recommend selected_action", 
                            f"Expected 'create_payment_link', got '{data['selected_action']}'")
                return False
            
            # Verify Q-values has 11 keys
            if len(data["q_values"]) != 11:
                self.log_fail("POST /api/policy/recommend q_values", 
                            f"Expected 11 Q-values, got {len(data['q_values'])}")
                return False
            
            # Verify create_payment_link Q-value is 2.75
            if abs(data["q_values"]["create_payment_link"] - 2.75) > 0.01:
                self.log_fail("POST /api/policy/recommend Q-value", 
                            f"Expected create_payment_link Q=2.75, got {data['q_values']['create_payment_link']}")
                return False
            
            # Verify policy version
            if data["policy_version"] != "dqn-export-4748":
                self.log_fail("POST /api/policy/recommend policy_version", 
                            f"Expected 'dqn-export-4748', got '{data['policy_version']}'")
                return False
            
            # Verify source
            if data["source"] != "dqn_export":
                self.log_fail("POST /api/policy/recommend source", 
                            f"Expected 'dqn_export', got '{data['source']}'")
                return False
            
            # Verify constraints
            if data["constraints_passed"] != 3 or data["constraints_total"] != 3:
                self.log_fail("POST /api/policy/recommend constraints", 
                            f"Expected 3/3, got {data['constraints_passed']}/{data['constraints_total']}")
                return False
            
            # Verify all guardrails are 'ok'
            for gr in data["guardrails"]:
                if gr["status"] != "ok":
                    self.log_fail("POST /api/policy/recommend guardrails", 
                                f"Expected all 'ok', but {gr['rule']} is '{gr['status']}'")
                    return False
            
            self.log_pass("POST /api/policy/recommend (tick 4, contacts 1) - create_payment_link selected")
            return True
            
        except Exception as e:
            self.log_fail("POST /api/policy/recommend (normal)", f"Exception: {str(e)}")
            return False

    def test_policy_recommend_contact_budget_exhausted(self):
        """Test POST /api/policy/recommend - contact budget exhausted (tick 8, contacts 3)"""
        print("\n🔍 Testing POST /api/policy/recommend (contact budget exhausted)...")
        try:
            payload = {
                "tick": 8,
                "contacts_used": 3,
                "method": "card",
                "hours_since_failure": 48.0
            }
            
            response = requests.post(f"{BASE_URL}/policy/recommend", json=payload, timeout=10)
            
            if response.status_code != 200:
                self.log_fail("POST /api/policy/recommend (budget) status", f"Expected 200, got {response.status_code}")
                return False
            
            data = response.json()
            
            # Verify contact_budget guardrail is enforced
            contact_guardrail = None
            for gr in data["guardrails"]:
                if gr["rule"] == "contact_budget":
                    contact_guardrail = gr
                    break
            
            if not contact_guardrail:
                self.log_fail("POST /api/policy/recommend (budget) guardrail", "contact_budget guardrail not found")
                return False
            
            if contact_guardrail["status"] != "enforced":
                self.log_fail("POST /api/policy/recommend (budget) guardrail status", 
                            f"Expected 'enforced', got '{contact_guardrail['status']}'")
                return False
            
            # Verify selected_action is NOT in contact actions
            contact_actions = ["notify_sms", "notify_whatsapp", "notify_email", "create_payment_link", "offer_incentive"]
            if data["selected_action"] in contact_actions:
                self.log_fail("POST /api/policy/recommend (budget) selected_action", 
                            f"Expected non-contact action, got '{data['selected_action']}'")
                return False
            
            self.log_pass("POST /api/policy/recommend (tick 8, contacts 3) - contact budget enforced")
            return True
            
        except Exception as e:
            self.log_fail("POST /api/policy/recommend (budget)", f"Exception: {str(e)}")
            return False

    def test_policy_recommend_upi_pending_window(self):
        """Test POST /api/policy/recommend - UPI pending window (tick 0, method upi)"""
        print("\n🔍 Testing POST /api/policy/recommend (UPI pending window)...")
        try:
            payload = {
                "tick": 0,
                "contacts_used": 0,
                "method": "upi",
                "hours_since_failure": 2.0
            }
            
            response = requests.post(f"{BASE_URL}/policy/recommend", json=payload, timeout=10)
            
            if response.status_code != 200:
                self.log_fail("POST /api/policy/recommend (UPI) status", f"Expected 200, got {response.status_code}")
                return False
            
            data = response.json()
            
            # Verify upi_pending_window guardrail is enforced
            upi_guardrail = None
            for gr in data["guardrails"]:
                if gr["rule"] == "upi_pending_window":
                    upi_guardrail = gr
                    break
            
            if not upi_guardrail:
                self.log_fail("POST /api/policy/recommend (UPI) guardrail", "upi_pending_window guardrail not found")
                return False
            
            if upi_guardrail["status"] != "enforced":
                self.log_fail("POST /api/policy/recommend (UPI) guardrail status", 
                            f"Expected 'enforced', got '{upi_guardrail['status']}'")
                return False
            
            # Verify retry actions are not selected
            retry_actions = ["retry_same_method", "retry_upi"]
            if data["selected_action"] in retry_actions:
                self.log_fail("POST /api/policy/recommend (UPI) selected_action", 
                            f"Expected non-retry action, got '{data['selected_action']}'")
                return False
            
            self.log_pass("POST /api/policy/recommend (tick 0, method upi) - UPI pending window enforced")
            return True
            
        except Exception as e:
            self.log_fail("POST /api/policy/recommend (UPI)", f"Exception: {str(e)}")
            return False

    def test_events_stream(self):
        """Test GET /api/events/stream - SSE endpoint"""
        print("\n🔍 Testing GET /api/events/stream (SSE)...")
        try:
            response = requests.get(f"{BASE_URL}/events/stream", stream=True, timeout=15)
            
            if response.status_code != 200:
                self.log_fail("GET /api/events/stream status", f"Expected 200, got {response.status_code}")
                return False
            
            # Check headers
            if "text/event-stream" not in response.headers.get("content-type", ""):
                self.log_fail("GET /api/events/stream content-type", 
                            f"Expected 'text/event-stream', got '{response.headers.get('content-type')}'")
                return False
            
            # Read first few events
            events_received = 0
            for line in response.iter_lines(decode_unicode=True):
                if line and line.startswith("data: "):
                    try:
                        event_data = json.loads(line[6:])  # Remove "data: " prefix
                        
                        # Verify event structure
                        required_fields = ["id", "seq", "ts", "type", "severity", "summary"]
                        for field in required_fields:
                            if field not in event_data:
                                self.log_fail("GET /api/events/stream event structure", 
                                            f"Missing '{field}' in event")
                                return False
                        
                        events_received += 1
                        print(f"   Received event {events_received}: {event_data['type']} - {event_data['summary'][:50]}...")
                        
                        if events_received >= 3:
                            break
                    except json.JSONDecodeError as e:
                        self.log_fail("GET /api/events/stream JSON", f"Invalid JSON: {str(e)}")
                        return False
            
            if events_received < 3:
                self.log_fail("GET /api/events/stream events", f"Expected at least 3 events, got {events_received}")
                return False
            
            self.log_pass("GET /api/events/stream - SSE emitting events")
            return True
            
        except Exception as e:
            self.log_fail("GET /api/events/stream", f"Exception: {str(e)}")
            return False

    def print_summary(self):
        print("\n" + "="*70)
        print(f"📊 TEST SUMMARY")
        print("="*70)
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failures)}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100) if self.tests_run > 0 else 0:.1f}%")
        
        if self.failures:
            print("\n❌ FAILURES:")
            for failure in self.failures:
                print(f"  - {failure['test']}: {failure['reason']}")
        
        print("="*70)
        return len(self.failures) == 0

def main():
    print("🚀 Starting RazorStitch Backend API Tests")
    print(f"Testing against: {BASE_URL}")
    print("="*70)
    
    tester = RazorStitchTester()
    
    # Run all tests
    tester.test_case_current()
    tester.test_policy_recommend_normal()
    tester.test_policy_recommend_contact_budget_exhausted()
    tester.test_policy_recommend_upi_pending_window()
    tester.test_events_stream()
    
    # Print summary
    success = tester.print_summary()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
