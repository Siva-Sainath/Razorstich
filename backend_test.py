"""
Backend API tests for RazorStitch recovery console.
Tests all endpoints with specific requirements from the review request.
"""
import requests
import json
import sys
import time

BASE_URL = "https://recovery-theater-1.preview.emergentagent.com/api"

class TestResults:
    def __init__(self):
        self.total = 0
        self.passed = 0
        self.failed = 0
        self.details = []
    
    def add_pass(self, test_name, detail=""):
        self.total += 1
        self.passed += 1
        self.details.append({"test": test_name, "status": "PASS", "detail": detail})
        print(f"✅ PASS: {test_name}")
        if detail:
            print(f"   {detail}")
    
    def add_fail(self, test_name, detail=""):
        self.total += 1
        self.failed += 1
        self.details.append({"test": test_name, "status": "FAIL", "detail": detail})
        print(f"❌ FAIL: {test_name}")
        if detail:
            print(f"   {detail}")
    
    def summary(self):
        print("\n" + "="*60)
        print(f"BACKEND TEST SUMMARY: {self.passed}/{self.total} passed")
        print("="*60)
        return self.failed == 0


def test_case_current(results):
    """Test GET /api/case/current endpoint"""
    print("\n🔍 Testing GET /api/case/current...")
    try:
        response = requests.get(f"{BASE_URL}/case/current", timeout=10)
        
        if response.status_code != 200:
            results.add_fail("GET /api/case/current status", f"Expected 200, got {response.status_code}")
            return
        
        results.add_pass("GET /api/case/current status", "Returns 200")
        
        data = response.json()
        
        # Check case structure
        if "case" not in data:
            results.add_fail("case object", "Missing 'case' key")
            return
        
        case = data["case"]
        
        # Check windowHours=72
        if case.get("windowHours") == 72:
            results.add_pass("case.windowHours", "Equals 72")
        else:
            results.add_fail("case.windowHours", f"Expected 72, got {case.get('windowHours')}")
        
        # Check maxContacts=3
        if case.get("maxContacts") == 3:
            results.add_pass("case.maxContacts", "Equals 3")
        else:
            results.add_fail("case.maxContacts", f"Expected 3, got {case.get('maxContacts')}")
        
        # Check events (should have 15)
        events = data.get("events", [])
        if len(events) == 15:
            results.add_pass("events count", "Has 15 events")
        else:
            results.add_fail("events count", f"Expected 15, got {len(events)}")
        
        # Check recoveryCurve exists
        if "recoveryCurve" in data and len(data["recoveryCurve"]) > 0:
            results.add_pass("recoveryCurve", f"Present with {len(data['recoveryCurve'])} points")
        else:
            results.add_fail("recoveryCurve", "Missing or empty")
        
        # Check ghostRuns (should have 5)
        ghost_runs = data.get("ghostRuns", [])
        if len(ghost_runs) == 5:
            results.add_pass("ghostRuns count", "Has 5 ghost runs")
        else:
            results.add_fail("ghostRuns count", f"Expected 5, got {len(ghost_runs)}")
        
        # Check stages exists
        if "stages" in data and len(data["stages"]) > 0:
            results.add_pass("stages", f"Present with {len(data['stages'])} stages")
        else:
            results.add_fail("stages", "Missing or empty")
        
        # Check interventions exists
        if "interventions" in data and len(data["interventions"]) > 0:
            results.add_pass("interventions", f"Present with {len(data['interventions'])} interventions")
        else:
            results.add_fail("interventions", "Missing or empty")
        
        # Check trustLedger (should have 3)
        trust_ledger = data.get("trustLedger", [])
        if len(trust_ledger) == 3:
            results.add_pass("trustLedger count", "Has 3 entries")
        else:
            results.add_fail("trustLedger count", f"Expected 3, got {len(trust_ledger)}")
        
    except Exception as e:
        results.add_fail("GET /api/case/current", f"Exception: {str(e)}")


def test_policy_recommend_tick4(results):
    """Test POST /api/policy/recommend with tick:4"""
    print("\n🔍 Testing POST /api/policy/recommend (tick:4)...")
    try:
        payload = {
            "tick": 4,
            "contacts_used": 1,
            "method": "card",
            "hours_since_failure": 24
        }
        response = requests.post(f"{BASE_URL}/policy/recommend", json=payload, timeout=10)
        
        if response.status_code != 200:
            results.add_fail("POST /api/policy/recommend status", f"Expected 200, got {response.status_code}")
            return
        
        results.add_pass("POST /api/policy/recommend status", "Returns 200")
        
        data = response.json()
        
        # Check selected_action='create_payment_link'
        if data.get("selected_action") == "create_payment_link":
            results.add_pass("selected_action (tick:4)", "Equals 'create_payment_link'")
        else:
            results.add_fail("selected_action (tick:4)", f"Expected 'create_payment_link', got {data.get('selected_action')}")
        
        # Check q_values has 11 keys
        q_values = data.get("q_values", {})
        if len(q_values) == 11:
            results.add_pass("q_values keys", "Has 11 keys")
        else:
            results.add_fail("q_values keys", f"Expected 11, got {len(q_values)}")
        
        # Check policy_version='dqn-export-4748'
        if data.get("policy_version") == "dqn-export-4748":
            results.add_pass("policy_version", "Equals 'dqn-export-4748'")
        else:
            results.add_fail("policy_version", f"Expected 'dqn-export-4748', got {data.get('policy_version')}")
        
        # Check constraints 3/3
        if data.get("constraints_passed") == 3 and data.get("constraints_total") == 3:
            results.add_pass("constraints", "3/3 passed")
        else:
            results.add_fail("constraints", f"Expected 3/3, got {data.get('constraints_passed')}/{data.get('constraints_total')}")
        
    except Exception as e:
        results.add_fail("POST /api/policy/recommend (tick:4)", f"Exception: {str(e)}")


def test_policy_recommend_tick8_guardrail(results):
    """Test POST /api/policy/recommend with tick:8, contacts_used:3 (guardrail enforcement)"""
    print("\n🔍 Testing POST /api/policy/recommend (tick:8, contacts_used:3)...")
    try:
        payload = {
            "tick": 8,
            "contacts_used": 3,
            "method": "card",
            "hours_since_failure": 48
        }
        response = requests.post(f"{BASE_URL}/policy/recommend", json=payload, timeout=10)
        
        if response.status_code != 200:
            results.add_fail("POST /api/policy/recommend (guardrail) status", f"Expected 200, got {response.status_code}")
            return
        
        results.add_pass("POST /api/policy/recommend (guardrail) status", "Returns 200")
        
        data = response.json()
        
        # Check guardrails for contact_budget enforcement
        guardrails = data.get("guardrails", [])
        contact_budget_guardrail = None
        for g in guardrails:
            if g.get("rule") == "contact_budget":
                contact_budget_guardrail = g
                break
        
        if contact_budget_guardrail and contact_budget_guardrail.get("status") == "enforced":
            results.add_pass("contact_budget guardrail", "Status is 'enforced'")
        else:
            results.add_fail("contact_budget guardrail", f"Expected status 'enforced', got {contact_budget_guardrail.get('status') if contact_budget_guardrail else 'not found'}")
        
        # Check selected_action is NOT in contact actions
        blocked_actions = ["notify_sms", "notify_whatsapp", "notify_email", "create_payment_link", "offer_incentive"]
        selected = data.get("selected_action")
        if selected not in blocked_actions:
            results.add_pass("selected_action (guardrail)", f"'{selected}' is not a contact action (correctly blocked)")
        else:
            results.add_fail("selected_action (guardrail)", f"'{selected}' should be blocked when contacts_used=3")
        
    except Exception as e:
        results.add_fail("POST /api/policy/recommend (guardrail)", f"Exception: {str(e)}")


def test_events_stream_sse(results):
    """Test GET /api/events/stream SSE endpoint"""
    print("\n🔍 Testing GET /api/events/stream (SSE)...")
    try:
        response = requests.get(f"{BASE_URL}/events/stream", stream=True, timeout=15)
        
        if response.status_code != 200:
            results.add_fail("GET /api/events/stream status", f"Expected 200, got {response.status_code}")
            return
        
        results.add_pass("GET /api/events/stream status", "Returns 200")
        
        # Check content-type
        content_type = response.headers.get("content-type", "")
        if "text/event-stream" in content_type:
            results.add_pass("SSE content-type", "Correct (text/event-stream)")
        else:
            results.add_fail("SSE content-type", f"Expected text/event-stream, got {content_type}")
        
        # Try to read first few events
        events_received = 0
        valid_json = True
        for line in response.iter_lines(decode_unicode=True):
            if line.startswith("data: "):
                try:
                    event_data = json.loads(line[6:])  # Remove "data: " prefix
                    events_received += 1
                    if events_received >= 2:  # Read at least 2 events
                        break
                except json.JSONDecodeError:
                    valid_json = False
                    break
        
        response.close()
        
        if events_received >= 2 and valid_json:
            results.add_pass("SSE streaming", f"Received {events_received} valid JSON events")
        elif not valid_json:
            results.add_fail("SSE streaming", "Events are not valid JSON")
        else:
            results.add_fail("SSE streaming", f"Only received {events_received} events")
        
    except Exception as e:
        results.add_fail("GET /api/events/stream", f"Exception: {str(e)}")


def main():
    print("="*60)
    print("RAZORSTITCH BACKEND API TESTS")
    print("="*60)
    print(f"Testing against: {BASE_URL}")
    
    results = TestResults()
    
    # Run all tests
    test_case_current(results)
    test_policy_recommend_tick4(results)
    test_policy_recommend_tick8_guardrail(results)
    test_events_stream_sse(results)
    
    # Print summary
    success = results.summary()
    
    # Return exit code
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
