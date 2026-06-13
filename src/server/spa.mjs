export const SPA_HTML = String.raw`<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>One Door · California</title>
<style>
:root{--bg:#0d1117;--panel:#161b22;--line:#26303d;--ink:#e6edf3;--mut:#8b97a6;--accent:#3fb950;--accent2:#58a6ff;--warn:#d29922;--bad:#f85149;--radius:14px;font-synthesis:none}
*{box-sizing:border-box}
body{margin:0;background:linear-gradient(180deg,#0b0f14,#0d1117);color:var(--ink);font-family:"Google Sans Flex","Google Sans",system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.5}
.mono{font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace}
header{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid var(--line);position:sticky;top:0;background:rgba(13,17,23,.85);backdrop-filter:blur(8px);z-index:5}
.brand{font-weight:600;font-size:19px;letter-spacing:-.01em}
.brand b{color:var(--accent)}
.tag{color:var(--mut);font-size:13px;margin-top:2px}
.langs button{background:transparent;border:1px solid var(--line);color:var(--ink);padding:6px 12px;border-radius:999px;margin-left:6px;cursor:pointer;font-family:inherit;font-size:13px}
.langs button.on{background:var(--accent2);border-color:var(--accent2);color:#06121f;font-weight:600}
main{max-width:1080px;margin:0 auto;padding:24px;display:grid;grid-template-columns:380px 1fr;gap:22px}
@media(max-width:880px){main{grid-template-columns:1fr}}
.card{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:20px}
h2{font-size:15px;margin:0 0 14px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;color:var(--mut)}
label{display:block;font-size:13px;color:var(--mut);margin:12px 0 5px}
input,select{width:100%;background:#0d1117;border:1px solid var(--line);color:var(--ink);border-radius:9px;padding:10px 12px;font-family:inherit;font-size:15px}
.btn{margin-top:18px;width:100%;background:var(--accent);color:#04210d;border:none;border-radius:10px;padding:13px;font-weight:600;font-size:15px;cursor:pointer;font-family:inherit}
.btn.alt{background:transparent;color:var(--accent2);border:1px solid var(--accent2);margin-top:10px}
.verdict{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
.pill{font-weight:600;padding:5px 12px;border-radius:999px;font-size:14px}
.pill.ok{background:rgba(63,185,80,.16);color:var(--accent)}
.pill.maybe{background:rgba(210,153,34,.16);color:var(--warn)}
.pill.no{background:rgba(248,81,73,.16);color:var(--bad)}
.dollar{font-size:34px;font-weight:600;letter-spacing:-.02em}
.dollar small{font-size:15px;color:var(--mut);font-weight:400}
.why{margin:14px 0;padding-left:0;list-style:none}
.why li{padding:9px 12px;border-left:3px solid var(--accent2);background:#0d1117;border-radius:0 8px 8px 0;margin:7px 0;font-size:14px}
.split{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
.split>div{background:#0d1117;border:1px solid var(--line);border-radius:10px;padding:12px;font-size:12.5px}
.split h4{margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
.split .e h4{color:var(--accent)} .split .o h4{color:var(--accent2)}
.cite{font-size:11px;color:var(--mut)} .cite code{color:var(--accent2)}
.disc{margin-top:14px;font-size:12px;color:var(--warn);border:1px dashed var(--warn);border-radius:8px;padding:8px 10px}
.shelf{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
.tile{background:#0d1117;border:1px solid var(--line);border-radius:11px;padding:13px}
.tile .ng{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--accent2)}
.tile b{display:block;margin:4px 0;font-size:14px}
.tile p{margin:4px 0;font-size:12.5px;color:var(--mut)}
.tile a{color:var(--accent);font-size:12px;text-decoration:none}
.verified{margin-top:14px;background:rgba(88,166,255,.08);border:1px solid var(--accent2);border-radius:10px;padding:12px;font-size:13px}
.verified .t{color:var(--accent2);font-weight:600;font-size:12px}
.adv{margin-top:10px}
.adv li{font-size:13.5px;margin:6px 0}
.muted{color:var(--mut);font-size:12px}
.flag{font-size:11px;color:var(--warn);border:1px solid var(--warn);border-radius:6px;padding:2px 7px;display:inline-block}
section{margin-bottom:18px}
.hidden{display:none}
[dir=rtl] .why li{border-left:none;border-right:3px solid var(--accent2);border-radius:8px 0 0 8px}
</style></head>
<body>
<header>
  <div><div class="brand">One <b>Door</b> · California</div><div class="tag" id="tagline"></div></div>
  <div class="langs" id="langs">
    <button data-l="en" class="on">English</button>
    <button data-l="es">Español</button>
    <button data-l="fa">فارسی</button>
  </div>
</header>
<main>
  <div class="card" id="form-card">
    <h2 id="situation-title">Your situation</h2>
    <label id="l-size">People in your household</label><input id="size" type="number" value="3" min="1">
    <label id="l-earn">Monthly income from work ($)</label><input id="earn" type="number" value="3500">
    <label id="l-rent">Monthly rent / mortgage ($)</label><input id="rent" type="number" value="2200">
    <label id="l-county">County</label>
    <select id="county"><option>San Francisco</option><option>Los Angeles</option><option>Fresno</option><option>Tulare</option><option>Alameda</option><option>San Diego</option></select>
    <button class="btn" id="go">Check my benefits</button>
    <button class="btn alt" id="doc">Drop in a pay stub instead (demo)</button>
    <div class="muted" id="anon" style="margin-top:10px">Anonymous by default. No account, no PII stored.</div>
  </div>

  <div>
    <section class="card" id="result" style="display:none">
      <h2>CalFresh — engine-computed</h2>
      <div class="verdict"><span class="pill" id="pill"></span><span class="dollar" id="dollar"></span></div>
      <ul class="why" id="why"></ul>
      <div class="split">
        <div class="e"><h4>Rules engine (deterministic)</h4><div id="engine-side" class="mono"></div></div>
        <div class="o"><h4>Opus 4.8 (reasoning)</h4><div id="opus-side"></div></div>
      </div>
      <div class="verified hidden" id="verified"></div>
      <div class="disc" id="disc"></div>
      <div class="cite" id="cites" style="margin-top:10px"></div>
    </section>

    <section class="card" id="adv-card" style="display:none">
      <h2 id="adv-title">Walk in prepared</h2>
      <div id="adv-intro" class="muted"></div>
      <ul class="adv" id="adv-list"></ul>
    </section>

    <section class="card" id="rec-card" style="display:none">
      <h2 id="rec-title">You may also qualify for</h2>
      <div class="shelf" id="recs"></div>
    </section>

    <section class="card">
      <h2 id="shelf-title">The full California shelf</h2>
      <div class="shelf" id="shelf"></div>
    </section>
  </div>
</main>
<script>
let LANG="en", DICT={}, LAST=null;
const $=(id)=>document.getElementById(id);
async function boot(){ const r=await fetch("/api/i18n").then(r=>r.json()); DICT=r.dict; render(); loadShelf(); }
function t(){ return DICT[LANG]||DICT.en; }
document.getElementById("langs").addEventListener("click",e=>{ if(e.target.dataset.l){ LANG=e.target.dataset.l; [...document.querySelectorAll('#langs button')].forEach(b=>b.classList.toggle('on',b.dataset.l===LANG)); document.documentElement.dir=t().dir; document.documentElement.lang=LANG; render(); if(LAST) paint(LAST); }});
function render(){ const d=t(); $("tagline").textContent=d.tagline; $("situation-title").textContent=d.your_situation; $("l-size").textContent=d.household_size; $("l-earn").textContent=d.monthly_earned; $("l-rent").textContent=d.rent; $("l-county").textContent=d.county; $("go").textContent=d.check; $("rec-title").textContent=d.also_qualify; $("adv-title").textContent=d.advocate_title; $("adv-intro").textContent=d.advocate_intro; }
async function loadShelf(){ const {shelf}=await fetch("/api/shelf").then(r=>r.json()); const g=$("shelf"); g.innerHTML=""; shelf.forEach(s=>{ const ng=(t().need_groups||{})[s.need_group]||s.need_group; g.innerHTML+='<div class="tile"><div class="ng">'+ng+'</div><b>'+s.program+'</b><p>'+s.one_line+'</p><p class="cite">'+s.why_short+'</p><a href="#">'+s.next_step+'</a></div>'; }); }
$("doc").addEventListener("click",async()=>{ const r=await fetch("/api/extract",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({fixture:"paystub"})}).then(r=>r.json()); const e=r.extracted; $("size").value=e.household_size; $("earn").value=e.monthly_earned_income; $("doc").textContent="✓ Extracted from pay stub (confirm fields, then Check)"; $("anon").innerHTML='<span class="flag">demo</span> Parsed by Opus vision · confirm/correct before it computes · document not stored'; });
$("go").addEventListener("click",screen);
async function screen(){
  const household={ today:"2026-06-13", county:$("county").value, household_size:+$("size").value, monthly_earned_income:+$("earn").value, shelter_cost_monthly:+$("rent").value,
    members:Array.from({length:+$("size").value},(_,i)=>i===0?{age:34,work_hours_per_week:38}:{age:6+i*3}) };
  const res=await fetch("/api/screen",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({household,lang:LANG})}).then(r=>r.json());
  LAST=res; // try to resolve the one uncertain fact via the (captured/live) county-line call
  if((res.uncertain_facts||[]).length || res.abawd_risk){ res._verified=await fetch("/api/verify-resource",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({callee_id:"cdss-calfresh-helpline",question:"ABAWD exemption hours"})}).then(r=>r.json()).catch(()=>null); }
  paint(res);
}
function paint(res){
  const d=t(), p=res.presentation, c=res.computation;
  $("result").style.display="block";
  const pill=$("pill"); pill.textContent=p.verdict_label; pill.className="pill "+(res.status==="likely_eligible"?"ok":res.status==="likely_not_eligible"?"no":"maybe");
  $("dollar").innerHTML = (res.monthly_benefit!=null && res.status!=="likely_not_eligible") ? "$"+res.monthly_benefit+" <small>/mo</small>" : "";
  const why=$("why"); why.innerHTML=""; if(p.why_flip) why.innerHTML+="<li>"+p.why_flip+"</li>"; (res.why||[]).slice(0,4).forEach(w=>why.innerHTML+="<li>"+w+"</li>");
  $("engine-side").innerHTML = "gross $"+c.gross_income+"/mo<br>fed 130% limit $"+c.gross_limit_federal_130+" → "+(c.passes_gross_federal?"pass":"<b style='color:var(--bad)'>FAIL</b>")+"<br>CA 200% limit $"+c.gross_limit_ca_200+" → "+(c.passes_gross_ca?"pass":"fail")+"<br>net income $"+c.net_income+"<br>max allotment $"+c.max_allotment+"<br>− 30% × net = <b>$"+(res.monthly_benefit||0)+"</b>";
  $("opus-side").innerHTML = "Structured the household, judged date/status/county, flagged the one uncertain fact for a live call, and reviewed the full trace. "+(res.abawd_risk?"<br><span class='flag'>flagged</span> ABAWD work-requirement seam.":"")+(res._catch?"<br><b style='color:var(--accent)'>self-catch:</b> "+res._catch:"");
  $("disc").textContent="⚠ "+(res.disclaimer||d.disclaimer);
  $("cites").innerHTML="Sources: "+(res.citations||[]).map(x=>'<code>'+x.source_id+'</code>').join(" · ");
  const v=$("verified");
  if(res._verified && res._verified.value && res._verified.value!=="REFUSED" && res._verified.value!=="WITHHELD"){ v.classList.remove("hidden"); v.innerHTML='<div class="t">'+d.verified_fact+' · '+res._verified.verified_at+'</div>ABAWD work-requirement exemption: <b>'+res._verified.value+' hours/week</b>.<br><span class="cite">“'+res._verified.quote+'” — '+res._verified.method+'</span>'; }
  else v.classList.add("hidden");
  // recommendations
  const rc=$("rec-card"), rg=$("recs"); if((res.recommendations||[]).length){ rc.style.display="block"; rg.innerHTML=""; res.recommendations.forEach(r=>{ rg.innerHTML+='<div class="tile"><b>'+r.program+'</b><p>'+r.reason+'</p><a href="#">'+r.next_step+'</a></div>'; }); }
  // advocate briefing
  const ac=$("adv-card"); if(res.status==="likely_eligible"){ ac.style.display="block"; const docs=["Photo ID (driver's license, passport, or consular ID)","Proof of income (your last pay stub — about $"+c.gross_income+"/mo)","Proof of rent ($"+(res.inputs_echo?res.inputs_echo.shelter_cost_monthly:$("rent").value)+"/mo)","Social Security numbers for anyone applying (optional for some members)"]; const ask=["They will ask your household size and who buys/prepares food together.","They will ask about income and the work requirement — you can say you work "+(38)+" hours a week.","If asked about immigration status, only those applying need to answer; a citizen child can get benefits even if a parent does not."]; $("adv-list").innerHTML = "<b>"+d.next_step+":</b> "+d.apply_step+"<br><br><b>Bring:</b>"+docs.map(x=>"<li>"+x+"</li>").join("")+"<br><b>They'll ask:</b>"+ask.map(x=>"<li>"+x+"</li>").join(""); }
  document.documentElement.dir=t().dir;
}
boot();
</script>
</body></html>`;
