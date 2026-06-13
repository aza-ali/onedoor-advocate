#!/usr/bin/env python3
"""PolicyEngine-US oracle wrapper (BUILD-TIME ground truth, never the runtime brain).

Reads a household JSON (One Door's household_context shape) on stdin or as argv[1],
returns the independently-computed SNAP monthly benefit + eligibility so the compiled
JS engine can be self-tested against it. This is policyengine_us — a separate codebase
maintained by the PolicyEngine team — so agreement is a genuine accuracy signal, not
self-consistency.

Usage:
  echo '{"household_size":3,"monthly_earned_income":2000,...}' | python oracle.py
  python oracle.py path/to/household.json
"""
import json, sys
from policyengine_us import Simulation

YEAR = "2026"

def annual(v):
    return round(float(v) * 12, 2)

def build(hh):
    size = hh.get("household_size") or len(hh.get("members") or []) or 1
    members = hh.get("members")
    if not members:
        members = [{"age": 30 if i == 0 else 8} for i in range(size)]
    ids = [f"p{i}" for i in range(len(members))]
    people = {}
    earned_total = annual(hh.get("monthly_earned_income", 0))
    unearned_total = annual(hh.get("monthly_unearned_income", 0))
    for i, (pid, m) in enumerate(zip(ids, members)):
        people[pid] = {"age": {YEAR: m.get("age", 30 if i == 0 else 8)}}
        if i == 0:
            if earned_total:
                people[pid]["employment_income"] = {YEAR: earned_total}
            if unearned_total:
                people[pid]["social_security"] = {YEAR: unearned_total}
        if m.get("is_disabled"):
            people[pid]["is_disabled"] = {YEAR: True}
    spm = {"members": ids, "snap": {YEAR: None}}
    shelter = annual(hh.get("shelter_cost_monthly", 0))
    if shelter:
        spm["housing_cost"] = {YEAR: shelter}
    sit = {
        "people": people,
        "spm_units": {"s": spm},
        "households": {"h": {"members": ids, "state_name": {YEAR: hh.get("state", "CA")}}},
    }
    return sit

def run(hh):
    sim = Simulation(situation=build(hh))
    snap_annual = float(sim.calculate("snap", YEAR)[0])
    monthly = round(snap_annual / 12, 2)
    return {
        "oracle": "policyengine_us",
        "snap_monthly": monthly,
        "snap_annual": round(snap_annual, 2),
        "eligible": monthly > 0,
    }

if __name__ == "__main__":
    raw = open(sys.argv[1]).read() if len(sys.argv) > 1 else sys.stdin.read()
    hh = json.loads(raw)
    print(json.dumps(run(hh)))
