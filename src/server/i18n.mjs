// Presentation-layer translations. Language NEVER changes the engine result, dollars, or
// citations (K1: those are byte-identical across en/es/fa). Only chrome + templated labels
// localize. Farsi (fa) is RTL — deliberately included to prove long-tail, non-Latin coverage.

export const DICT = {
  en: {
    dir: "ltr", lang_name: "English",
    app_title: "One Door · California",
    tagline: "One door to every California benefit. Verified, cited, in your language.",
    your_situation: "Your situation",
    household_size: "People in your household",
    monthly_earned: "Monthly income from work ($)",
    monthly_unearned: "Other monthly income ($)",
    rent: "Monthly rent / mortgage ($)",
    county: "County",
    check: "Check my benefits",
    verdict: { likely_eligible: "Likely eligible", possibly_eligible: "Possibly eligible", likely_not_eligible: "Likely not eligible", needs_more_info: "We need a little more info" },
    benefit_headline: (n) => `Estimated CalFresh benefit: about $${n} per month`,
    no_dollar: "No dollar estimate — only CalFresh is computed.",
    why_title: "Why",
    flip: (fed, ca) => `A federal screener (130% of poverty = $${fed}/mo) would say no — but California raises the limit to 200% ($${ca}/mo) and waives the asset test, so you qualify.`,
    next_step: "Next step",
    apply_step: "Apply at GetCalFresh.org or call 1-877-847-3663. Bring ID, proof of income, and proof of rent.",
    disclaimer: "Screening estimate, not an official eligibility determination.",
    also_qualify: "You may also qualify for",
    advocate_title: "Walk in prepared",
    advocate_intro: "Here is what to bring, what they will ask, and how to answer:",
    verified_fact: "Verified fact",
    talk_navigator: "Apply or talk to a navigator",
    need_groups: { Food: "Food", Health: "Health", Money: "Money", Utilities: "Utilities", Housing: "Housing", Kids: "Kids" },
  },
  es: {
    dir: "ltr", lang_name: "Español",
    app_title: "One Door · California",
    tagline: "Una sola puerta a cada beneficio de California. Verificado, con fuentes, en su idioma.",
    your_situation: "Su situación",
    household_size: "Personas en su hogar",
    monthly_earned: "Ingreso mensual del trabajo ($)",
    monthly_unearned: "Otro ingreso mensual ($)",
    rent: "Renta / hipoteca mensual ($)",
    county: "Condado",
    check: "Revisar mis beneficios",
    verdict: { likely_eligible: "Probablemente elegible", possibly_eligible: "Posiblemente elegible", likely_not_eligible: "Probablemente no elegible", needs_more_info: "Necesitamos un poco más de información" },
    benefit_headline: (n) => `Beneficio estimado de CalFresh: alrededor de $${n} por mes`,
    no_dollar: "Sin estimación en dólares — solo se calcula CalFresh.",
    why_title: "Por qué",
    flip: (fed, ca) => `Un evaluador federal (130% de la pobreza = $${fed}/mes) diría que no, pero California sube el límite al 200% ($${ca}/mes) y elimina la prueba de bienes, así que usted califica.`,
    next_step: "Siguiente paso",
    apply_step: "Solicite en GetCalFresh.org o llame al 1-877-847-3663. Lleve identificación, comprobante de ingresos y de renta.",
    disclaimer: "Estimación de evaluación, no una determinación oficial de elegibilidad.",
    also_qualify: "También podría calificar para",
    advocate_title: "Llegue preparada",
    advocate_intro: "Esto es lo que debe llevar, lo que le preguntarán y cómo responder:",
    verified_fact: "Dato verificado",
    talk_navigator: "Solicite o hable con un asesor",
    need_groups: { Food: "Comida", Health: "Salud", Money: "Dinero", Utilities: "Servicios", Housing: "Vivienda", Kids: "Niños" },
  },
  fa: {
    dir: "rtl", lang_name: "فارسی",
    app_title: "One Door · کالیفرنیا",
    tagline: "یک در به همه مزایای کالیفرنیا. تأییدشده، با منبع، به زبان شما.",
    your_situation: "وضعیت شما",
    household_size: "تعداد افراد خانوار",
    monthly_earned: "درآمد ماهانه از کار (دلار)",
    monthly_unearned: "سایر درآمد ماهانه (دلار)",
    rent: "اجاره / وام مسکن ماهانه (دلار)",
    county: "شهرستان",
    check: "بررسی مزایای من",
    verdict: { likely_eligible: "به احتمال زیاد واجد شرایط", possibly_eligible: "احتمالاً واجد شرایط", likely_not_eligible: "به احتمال زیاد واجد شرایط نیست", needs_more_info: "به اطلاعات بیشتری نیاز داریم" },
    benefit_headline: (n) => `مزایای تخمینی CalFresh: حدود ${n} دلار در ماه`,
    no_dollar: "بدون تخمین دلاری — فقط CalFresh محاسبه می‌شود.",
    why_title: "چرا",
    flip: (fed, ca) => `یک ارزیاب فدرال (۱۳۰٪ خط فقر = ${fed} دلار در ماه) می‌گوید نه، اما کالیفرنیا حد را به ۲۰۰٪ (${ca} دلار در ماه) افزایش می‌دهد و آزمون دارایی را حذف می‌کند، پس شما واجد شرایط هستید.`,
    next_step: "گام بعدی",
    apply_step: "در GetCalFresh.org درخواست دهید یا با ۱-۸۷۷-۸۴۷-۳۶۶۳ تماس بگیرید. مدرک شناسایی، گواهی درآمد و گواهی اجاره بیاورید.",
    disclaimer: "این یک تخمین غربالگری است، نه تعیین رسمی واجد شرایط بودن.",
    also_qualify: "ممکن است واجد شرایط این موارد نیز باشید",
    advocate_title: "آماده وارد شوید",
    advocate_intro: "این چیزی است که باید بیاورید، آنچه می‌پرسند و چگونه پاسخ دهید:",
    verified_fact: "واقعیت تأییدشده",
    talk_navigator: "درخواست دهید یا با یک راهنما صحبت کنید",
    need_groups: { Food: "غذا", Health: "سلامت", Money: "پول", Utilities: "خدمات", Housing: "مسکن", Kids: "کودکان" },
  },
};

// Build a presentation object from an engine result. Dollars/verdict/citations are taken
// VERBATIM from the engine (never re-derived), so they are byte-identical across languages.
export function localize(result, lang) {
  const t = DICT[lang] || DICT.en;
  const c = result.computation || {};
  const pres = {
    dir: t.dir,
    lang,
    verdict_label: t.verdict[result.status] || result.status,
    headline: result.monthly_benefit != null && result.status !== "likely_not_eligible"
      ? t.benefit_headline(result.monthly_benefit) : t.no_dollar,
    why_title: t.why_title,
    why_flip: c.flip_federal_not_to_ca_eligible ? t.flip(c.gross_limit_federal_130, c.gross_limit_ca_200) : null,
    next_step_label: t.next_step,
    next_step: t.apply_step,
    disclaimer: t.disclaimer, // NOTE: result.disclaimer (engine) is the canonical compliance string; this is its localized echo
    also_qualify: t.also_qualify,
    talk_navigator: t.talk_navigator,
  };
  return pres;
}

export const LANGS = Object.keys(DICT);
