import argparse
import json
import os
from datetime import datetime, timezone

def load_claims():
    seed_path = os.path.join(os.path.dirname(__file__), "claims_seed.json")
    with open(seed_path, "r") as f:
        return json.load(f)

def is_due_for_refresh(claim, current_time=None):
    if current_time is None:
        current_time = datetime.now(timezone.utc)
        
    last_verified_str = claim.get("last_verified")
    if not last_verified_str:
        return True
        
    # Simple naive check: if older than 30 days, it's due
    try:
        # handle Z suffix if present
        if last_verified_str.endswith('Z'):
            last_verified_str = last_verified_str[:-1] + '+00:00'
        last_verified = datetime.fromisoformat(last_verified_str)
        delta = current_time - last_verified
        return delta.days > 30
    except ValueError:
        return True

def main():
    parser = argparse.ArgumentParser(description="Refresh Living Research Knowledge Base claims")
    parser.add_argument("--dry-run", action="store_true", help="Print claims due for refresh without making changes")
    args = parser.parse_args()

    print("Loading LRKB claims...")
    try:
        claims = load_claims()
    except FileNotFoundError:
        print("Error: claims_seed.json not found.")
        return
    
    if args.dry_run:
        print("\n--- DRY RUN: Identifying claims due for refresh ---")
        due_claims = [c for c in claims if is_due_for_refresh(c)]
        
        if not due_claims:
            print("No claims currently due for refresh.")
        else:
            print(f"Found {len(due_claims)} claims due for refresh:\n")
            for claim in due_claims:
                print(f"- [{claim['id']}] {claim['statement']}")
                print(f"  Last verified: {claim['last_verified']}")
        print("\nNote: Network calls are disabled in dry-run mode. Human gating required for policy updates.")
    else:
        print("Error: Live refresh not implemented. Use --dry-run.")

if __name__ == "__main__":
    main()
