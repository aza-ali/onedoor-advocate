import { screenCalFresh } from "../src/engine/calfresh.mjs";
const cases = [
  {label:"3p $2000earn rent1500", household_size:3, monthly_earned_income:2000, shelter_cost_monthly:1500},
  {label:"3p $1000earn rent1500", household_size:3, monthly_earned_income:1000, shelter_cost_monthly:1500},
  {label:"3p $0 income", household_size:3},
  {label:"1p $1500earn rent900", household_size:1, monthly_earned_income:1500, shelter_cost_monthly:900},
  {label:"4p $3000earn rent2000", household_size:4, monthly_earned_income:3000, shelter_cost_monthly:2000},
];
for (const c of cases){ const r=screenCalFresh(c); console.log(c.label,"=>",r.status,"$"+r.monthly_benefit,"net=$"+r.computation.net_income); }
