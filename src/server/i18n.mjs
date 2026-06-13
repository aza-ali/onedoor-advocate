// Presentation-layer translations. Language NEVER changes the engine result, dollars, or
// citations (K1: those stay byte-identical across en/es/fa). localize() builds a fully
// localized generative-answer CARD from the engine numbers, so switching language re-renders
// the whole answer in that language with the math unchanged. Farsi (fa) is RTL.

export const DICT = {
  en: {
    dir: "ltr", lang_name: "English",
    app_title: "One Door",
    tagline: "One door to every California benefit. Verified, cited, in your language.",
    greeting: "Hi, I am your benefits advocate. Tell me a little about your situation and I will check what you may qualify for. To start, which county do you live in?",
    placeholder: "Type your answer",
    send: "Send", attach: "Attach a document",
    checking: "Checking your eligibility",
    verdict: { likely_eligible: "Likely eligible", possibly_eligible: "Possibly eligible", likely_not_eligible: "Likely not eligible", needs_more_info: "A little more info needed" },
    per_mo: "/mo",
    disclaimer: "Screening estimate, not an official eligibility determination.",
    talk_navigator: "Apply or talk to a navigator",
    sec_qualify: "What you likely qualify for",
    sec_bring: "What to bring to your interview",
    sec_ask: "What they will ask you",
    sec_also: "You may also qualify for",
    flip: (fed, ca) => `A federal screener (130% of poverty, $${fed}/mo) would say no. California raises the limit to 200% ($${ca}/mo) and waives the asset test, so you qualify.`,
    benefit_math: (max, net, ben) => `Maximum allotment $${max} minus 30% of your net income $${net} comes to about $${ben} a month.`,
    over_income: (gross, lim) => `Your gross income $${gross}/mo is above the California limit of $${lim}/mo (200% of poverty).`,
    abawd_caveat: "A 3-month work-requirement time limit may apply unless you work about 20 hours a week or qualify for an exemption.",
    bring: [
      "Photo ID (driver's license, passport, or consular ID)",
      "Proof of income (your most recent pay stub)",
      "Proof of rent or mortgage",
      "Social Security numbers for anyone applying (optional for some members)",
    ],
    ask: [
      "Your household size and who buys and prepares food together",
      "Your income and the work requirement",
      "Immigration status, where only those applying need to answer, and a citizen child can get benefits even if a parent does not",
    ],
    recs: {
      WIC: { name: "WIC", reason: "Food, formula, and nutrition support for pregnant people and kids under 5. CalFresh enrollment is adjunctively income-eligible.", step: "Call 1-888-942-9675 or apply at myfamily.wic.ca.gov." },
      SCHOOL: { name: "Free and reduced school meals", reason: "Children in CalFresh households are directly certified for free school meals, with no separate application.", step: "Your district enrolls you automatically; confirm with the school office." },
      SUN: { name: "SUN Bucks (Summer EBT)", reason: "School-age children in CalFresh households are auto-enrolled for summer grocery benefits.", step: "Issued automatically each summer to your EBT card." },
      LIFELINE: { name: "CA LifeLine", reason: "CalFresh participation qualifies you for a discount on phone or internet service.", step: "Apply at californialifeline.com." },
      CARE: { name: "CARE / FERA utility discount", reason: "Your income appears at or below the threshold for a 20 to 35% discount on your gas and electric bill.", step: "Apply through your utility (PG&E, SCE, or SDG&E)." },
      MEDICAL: { name: "Medi-Cal", reason: "Your income appears below the Medi-Cal threshold for free or low-cost health coverage.", step: "Apply at coveredca.com or benefitscal.com." },
      CALEITC: { name: "CalEITC and Young Child Tax Credit", reason: "Low to moderate earned income may qualify for cash-back state tax credits.", step: "File a California tax return free at ftb.ca.gov, even if not otherwise required." },
    },
  },
  es: {
    dir: "ltr", lang_name: "Español",
    app_title: "One Door",
    tagline: "Una puerta a cada beneficio de California. Verificado, con fuentes, en su idioma.",
    greeting: "Hola, soy su defensor de beneficios. Cuénteme un poco sobre su situación y revisaré para qué podría calificar. Para comenzar, ¿en qué condado vive?",
    placeholder: "Escriba su respuesta",
    send: "Enviar", attach: "Adjuntar un documento",
    checking: "Revisando su elegibilidad",
    verdict: { likely_eligible: "Probablemente elegible", possibly_eligible: "Posiblemente elegible", likely_not_eligible: "Probablemente no elegible", needs_more_info: "Falta un poco más de información" },
    per_mo: "/mes",
    disclaimer: "Estimación de evaluación, no una determinación oficial de elegibilidad.",
    talk_navigator: "Solicite o hable con un asesor",
    sec_qualify: "Para lo que probablemente califica",
    sec_bring: "Qué llevar a su entrevista",
    sec_ask: "Qué le preguntarán",
    sec_also: "También podría calificar para",
    flip: (fed, ca) => `Un evaluador federal (130% de la pobreza, $${fed}/mes) diría que no. California sube el límite al 200% ($${ca}/mes) y elimina la prueba de bienes, así que usted califica.`,
    benefit_math: (max, net, ben) => `La asignación máxima de $${max} menos el 30% de su ingreso neto de $${net} resulta en unos $${ben} al mes.`,
    over_income: (gross, lim) => `Su ingreso bruto de $${gross}/mes está por encima del límite de California de $${lim}/mes (200% de la pobreza).`,
    abawd_caveat: "Puede aplicar un límite de tiempo de 3 meses por requisito de trabajo, a menos que trabaje unas 20 horas por semana o tenga una exención.",
    bring: [
      "Identificación con foto (licencia, pasaporte o identificación consular)",
      "Comprobante de ingresos (su talón de pago más reciente)",
      "Comprobante de renta o hipoteca",
      "Números de Seguro Social de quienes solicitan (opcional para algunos miembros)",
    ],
    ask: [
      "El tamaño de su hogar y quién compra y prepara los alimentos juntos",
      "Sus ingresos y el requisito de trabajo",
      "Estado migratorio, donde solo responden quienes solicitan, y un hijo ciudadano puede recibir beneficios aunque un padre no",
    ],
    recs: {
      WIC: { name: "WIC", reason: "Alimentos, fórmula y apoyo nutricional para embarazadas y niños menores de 5 años. CalFresh lo hace elegible por ingreso.", step: "Llame al 1-888-942-9675 o solicite en myfamily.wic.ca.gov." },
      SCHOOL: { name: "Comidas escolares gratuitas o reducidas", reason: "Los niños en hogares con CalFresh quedan certificados directamente para comidas escolares gratuitas, sin solicitud aparte.", step: "Su distrito lo inscribe automáticamente; confirme con la escuela." },
      SUN: { name: "SUN Bucks (EBT de verano)", reason: "Los niños en edad escolar en hogares con CalFresh se inscriben automáticamente para beneficios de comida en verano.", step: "Se emite automáticamente cada verano en su tarjeta EBT." },
      LIFELINE: { name: "CA LifeLine", reason: "Participar en CalFresh lo califica para un descuento en teléfono o internet.", step: "Solicite en californialifeline.com." },
      CARE: { name: "Descuento de servicios CARE / FERA", reason: "Su ingreso parece estar en o por debajo del límite para un descuento del 20 al 35% en su factura de gas y electricidad.", step: "Solicite a través de su compañía (PG&E, SCE o SDG&E)." },
      MEDICAL: { name: "Medi-Cal", reason: "Su ingreso parece estar por debajo del límite de Medi-Cal para cobertura de salud gratuita o de bajo costo.", step: "Solicite en coveredca.com o benefitscal.com." },
      CALEITC: { name: "CalEITC y Crédito por Hijos Pequeños", reason: "Un ingreso del trabajo bajo o moderado puede calificar para créditos fiscales estatales reembolsables.", step: "Presente una declaración de impuestos de California gratis en ftb.ca.gov." },
    },
  },
  fa: {
    dir: "rtl", lang_name: "فارسی",
    app_title: "One Door",
    tagline: "یک در به همه مزایای کالیفرنیا. تأییدشده، با منبع، به زبان شما.",
    greeting: "سلام، من مدافع مزایای شما هستم. کمی درباره وضعیت خود بگویید تا بررسی کنم واجد شرایط چه چیزی هستید. برای شروع، در کدام شهرستان زندگی می‌کنید؟",
    placeholder: "پاسخ خود را بنویسید",
    send: "ارسال", attach: "پیوست سند",
    checking: "در حال بررسی واجد شرایط بودن شما",
    verdict: { likely_eligible: "به احتمال زیاد واجد شرایط", possibly_eligible: "احتمالاً واجد شرایط", likely_not_eligible: "به احتمال زیاد واجد شرایط نیست", needs_more_info: "به اطلاعات بیشتری نیاز است" },
    per_mo: "در ماه",
    disclaimer: "این یک تخمین غربالگری است، نه تعیین رسمی واجد شرایط بودن.",
    talk_navigator: "درخواست دهید یا با یک راهنما صحبت کنید",
    sec_qualify: "آنچه احتمالاً واجد شرایط آن هستید",
    sec_bring: "چه چیزی به مصاحبه ببرید",
    sec_ask: "چه چیزی از شما می‌پرسند",
    sec_also: "ممکن است واجد شرایط این موارد نیز باشید",
    flip: (fed, ca) => `یک ارزیاب فدرال (۱۳۰٪ خط فقر، ${fed} دلار در ماه) می‌گوید نه. کالیفرنیا حد را به ۲۰۰٪ (${ca} دلار در ماه) افزایش می‌دهد و آزمون دارایی را حذف می‌کند، پس شما واجد شرایط هستید.`,
    benefit_math: (max, net, ben) => `حداکثر سهمیه ${max} دلار منهای ۳۰٪ درآمد خالص شما ${net} دلار، حدود ${ben} دلار در ماه می‌شود.`,
    over_income: (gross, lim) => `درآمد ناخالص شما ${gross} دلار در ماه بالاتر از حد کالیفرنیا یعنی ${lim} دلار در ماه (۲۰۰٪ خط فقر) است.`,
    abawd_caveat: "ممکن است یک محدودیت زمانی سه‌ماهه برای شرط کار اعمال شود، مگر اینکه حدود ۲۰ ساعت در هفته کار کنید یا معافیت داشته باشید.",
    bring: [
      "کارت شناسایی عکس‌دار (گواهینامه، گذرنامه یا کارت کنسولی)",
      "مدرک درآمد (آخرین فیش حقوقی شما)",
      "مدرک اجاره یا وام مسکن",
      "شماره تأمین اجتماعی برای متقاضیان (برای برخی اعضا اختیاری است)",
    ],
    ask: [
      "تعداد افراد خانوار شما و اینکه چه کسی با هم غذا می‌خرد و آماده می‌کند",
      "درآمد شما و شرط کار",
      "وضعیت مهاجرت، که فقط متقاضیان باید پاسخ دهند، و فرزند شهروند می‌تواند مزایا بگیرد حتی اگر والد نگیرد",
    ],
    recs: {
      WIC: { name: "WIC", reason: "غذا، شیرخشک و حمایت تغذیه‌ای برای زنان باردار و کودکان زیر ۵ سال. ثبت‌نام CalFresh شما را از نظر درآمد واجد شرایط می‌کند.", step: "با ۱-۸۸۸-۹۴۲-۹۶۷۵ تماس بگیرید یا در myfamily.wic.ca.gov درخواست دهید." },
      SCHOOL: { name: "وعده‌های غذایی رایگان یا کم‌هزینه مدرسه", reason: "کودکان در خانوارهای CalFresh به‌طور مستقیم برای وعده‌های رایگان مدرسه تأیید می‌شوند، بدون درخواست جداگانه.", step: "ناحیه شما به‌طور خودکار ثبت‌نام می‌کند؛ با دفتر مدرسه تأیید کنید." },
      SUN: { name: "SUN Bucks (EBT تابستانی)", reason: "کودکان سن مدرسه در خانوارهای CalFresh به‌طور خودکار برای مزایای غذایی تابستان ثبت‌نام می‌شوند.", step: "هر تابستان به‌طور خودکار به کارت EBT شما واریز می‌شود." },
      LIFELINE: { name: "CA LifeLine", reason: "مشارکت در CalFresh شما را واجد شرایط تخفیف تلفن یا اینترنت می‌کند.", step: "در californialifeline.com درخواست دهید." },
      CARE: { name: "تخفیف خدمات CARE / FERA", reason: "به نظر می‌رسد درآمد شما در حد یا پایین‌تر از آستانه تخفیف ۲۰ تا ۳۵٪ روی قبض گاز و برق است.", step: "از طریق شرکت خود (PG&E، SCE یا SDG&E) درخواست دهید." },
      MEDICAL: { name: "Medi-Cal", reason: "به نظر می‌رسد درآمد شما پایین‌تر از آستانه Medi-Cal برای پوشش درمانی رایگان یا کم‌هزینه است.", step: "در coveredca.com یا benefitscal.com درخواست دهید." },
      CALEITC: { name: "CalEITC و اعتبار مالیاتی کودک خردسال", reason: "درآمد کاری کم تا متوسط ممکن است واجد شرایط اعتبارهای مالیاتی بازگشتی ایالتی باشد.", step: "اظهارنامه مالیاتی کالیفرنیا را رایگان در ftb.ca.gov ثبت کنید." },
    },
  },
};

function recKey(program = "") {
  const p = program.toLowerCase();
  if (p.startsWith("wic")) return "WIC";
  if (p.includes("school meal")) return "SCHOOL";
  if (p.includes("sun bucks") || p.includes("summer ebt")) return "SUN";
  if (p.includes("lifeline")) return "LIFELINE";
  if (p.includes("care")) return "CARE";
  if (p.startsWith("medi-cal")) return "MEDICAL";
  if (p.includes("caleitc") || p.includes("eitc")) return "CALEITC";
  return null;
}

// Build the localized generative-answer CARD. Numbers come VERBATIM from the engine result;
// only the surrounding language changes. result.recommendations are re-expressed in `lang`
// by program key (citation preserved, never a dollar figure).
export function localize(result, lang) {
  const t = DICT[lang] || DICT.en;
  const c = result.computation || {};
  const eligible = result.status === "likely_eligible";
  const showDollar = result.monthly_benefit != null && result.status !== "likely_not_eligible";

  const why = [];
  if (c.flip_federal_not_to_ca_eligible) why.push({ kind: "flip", text: t.flip(c.gross_limit_federal_130, c.gross_limit_ca_200) });
  if (showDollar && c.max_allotment != null) why.push({ kind: "math", text: t.benefit_math(c.max_allotment, c.net_income, result.monthly_benefit) });
  if (result.status === "likely_not_eligible" && c.gross_income != null && !c.passes_gross_ca) why.push({ kind: "over", text: t.over_income(c.gross_income, c.gross_limit_ca_200) });
  if (result.abawd_risk) why.push({ kind: "abawd", text: t.abawd_caveat });

  const recs = (result.recommendations || []).map((r) => {
    const k = recKey(r.program);
    const loc = k && t.recs[k];
    return {
      program: loc ? loc.name : r.program,
      reason: loc ? loc.reason : r.reason,
      next_step: loc ? loc.step : r.next_step,
      citation: r.adjunctive_or_threshold_citation || null,
    };
  });

  const nav = result.navigator_fallback || {};

  return {
    dir: t.dir,
    lang,
    tagline: t.tagline,
    greeting: t.greeting,
    placeholder: t.placeholder,
    send: t.send,
    attach: t.attach,
    checking: t.checking,
    // the generative answer card
    verdict_label: t.verdict[result.status] || result.status,
    status: result.status,
    amount: showDollar ? result.monthly_benefit : null,
    per_mo: t.per_mo,
    why,
    sec_qualify: t.sec_qualify,
    sec_bring: t.sec_bring,
    sec_ask: t.sec_ask,
    sec_also: t.sec_also,
    bring: t.bring,
    ask: t.ask,
    recs,
    next_step: result.fallback?.url || nav.url ? { phone: nav.phone, url: nav.url } : null,
    disclaimer: t.disclaimer,
    talk_navigator: t.talk_navigator,
    navigator: { phone: nav.phone, url: nav.url },
  };
}

export const LANGS = Object.keys(DICT);
