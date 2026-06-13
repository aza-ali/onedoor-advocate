import { screenCalFresh } from "../src/engine/calfresh.mjs";
import { execFileSync } from "node:child_process";
const cases = [
  {household_size:3, monthly_earned_income:2000, shelter_cost_monthly:1500},
  {household_size:3, monthly_earned_income:1000, shelter_cost_monthly:1500},
  {household_size:3, monthly_earned_income:0},
  {household_size:1, monthly_earned_income:1500, shelter_cost_monthly:900},
  {household_size:4, monthly_earned_income:3000, shelter_cost_monthly:2000},
  {household_size:2, monthly_earned_income:1200, shelter_cost_monthly:1100},
  {household_size:5, monthly_earned_income:3500, shelter_cost_monthly:2200},
];
for (const c of cases){
  const r=screenCalFresh(c);
  const o=JSON.parse(execFileSync(".oracle-venv/bin/python",["scripts/oracle.py"],{input:JSON.stringify(c)}).toString());
  const d=r.monthly_benefit-o.snap_monthly;
  console.log(`size${c.household_size} earn${c.monthly_earned_income} rent${c.shelter_cost_monthly||0}: engine=$${r.monthly_benefit} oracle=$${o.snap_monthly} Δ=$${d.toFixed(0)}`);
}
