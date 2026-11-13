/* ==========================================================================
   TursiopsX — Waitlist interactions
   Vanilla JS, no dependencies. Everything degrades to readable static HTML.
   ========================================================================== */
(() => {
  "use strict";

  const CFG = Object.assign({ endpoint: "", analyticsEndpoint: "", contactEmail: "", formVersion: "dev" }, window.TX_CONFIG || {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k, d = null) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
    sget(k, d = null) { try { const v = sessionStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    sset(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } }
  };

  /* ---------------- Analytics ---------------- */
  window.dataLayer = window.dataLayer || [];
  let lastCta = null;
  function track(event, props = {}) {
    const e = { event, ...props, ts: new Date().toISOString(), path: location.pathname };
    window.dataLayer.push(e);
    if (CFG.analyticsEndpoint && navigator.sendBeacon) {
      try { navigator.sendBeacon(CFG.analyticsEndpoint, new Blob([JSON.stringify(e)], { type: "application/json" })); } catch { /* ignore */ }
    }
  }
  window.txTrack = track;

  // Attribution: capture UTM + referrer on first landing of the session.
  if (!store.sget("tx_src")) {
    const p = new URLSearchParams(location.search);
    const utm = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"].forEach(k => { if (p.get(k)) utm[k] = p.get(k).slice(0, 120); });
    store.sset("tx_src", { utm, referrer: document.referrer.slice(0, 300), landing: location.pathname + location.search, firstSeen: new Date().toISOString() });
  }

  document.addEventListener("click", e => {
    const el = e.target.closest("[data-track]");
    if (el) { lastCta = el.dataset.track; track("cta_click", { id: el.dataset.track }); }
  });

  /* ---------------- Toast ---------------- */
  const toastEl = $("#toast");
  let toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("on"), 3600);
  }

  /* ---------------- Menu ---------------- */
  const menu = $("#menu");
  const openers = $$("[data-menu-open]");
  let lastFocus = null;
  function setMenu(open) {
    if (!menu) return;
    menu.dataset.open = String(open);
    openers.forEach(b => b.setAttribute("aria-expanded", String(open)));
    document.body.style.overflow = open ? "hidden" : "";
    if (open) { lastFocus = document.activeElement; setTimeout(() => $(".menu__close", menu).focus(), 50); }
    else if (lastFocus) lastFocus.focus();
  }
  openers.forEach(b => b.addEventListener("click", () => setMenu(true)));
  $$("[data-menu-close]").forEach(b => b.addEventListener("click", () => setMenu(false)));
  if (menu) {
    $$("a", menu).forEach(a => a.addEventListener("click", () => setMenu(false)));
    menu.addEventListener("keydown", e => {
      if (e.key === "Escape") setMenu(false);
      if (e.key === "Tab") {
        const f = $$("a, button", menu); const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------------- Contact links ---------------- */
  $$("[data-contact]").forEach(a => {
    if (CFG.contactEmail) a.href = "mailto:" + CFG.contactEmail + "?subject=" + encodeURIComponent("TursiopsX — contacto");
  });

  /* ---------------- Kinetic split text ---------------- */
  function splitText(el) {
    const full = el.textContent.replace(/\s+/g, " ").trim();
    let count = 0;
    const total = full.replace(/\s/g, "").length;
    const step = Math.min(1, 40 / Math.max(total, 1)); // cap total stagger
    const walk = node => {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span"); w.className = "w"; w.setAttribute("aria-hidden", "true");
            for (const c of part) {
              const ch = document.createElement("span"); ch.className = "ch"; ch.textContent = c;
              ch.style.setProperty("--i", (count++ * step).toFixed(2)); w.appendChild(ch);
            }
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains("sr-only")) walk(n);
      });
    };
    walk(el);
    const sr = document.createElement("span"); sr.className = "sr-only"; sr.textContent = full;
    el.prepend(sr);
  }
  if (!reduced) $$(".split").forEach(splitText);

  /* ---------------- Reveal on scroll ---------------- */
  const revealTargets = $$(".split, .reveal, .step, [data-assemble]");
  if ("IntersectionObserver" in window && !reduced) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    revealTargets.forEach(el => io.observe(el));
  } else revealTargets.forEach(el => el.classList.add("is-in"));

  /* ---------------- Rail: current section ---------------- */
  const railLinks = $$(".rail__links a");
  if (railLinks.length && "IntersectionObserver" in window) {
    const navIo = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const id = en.target.id;
        railLinks.forEach(a => a.setAttribute("aria-current", String(a.getAttribute("href") === "#" + id)));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("[data-nav]").forEach(s => navIo.observe(s));
  }

  /* ---------------- Tabs (agents, constitution, architecture) ---------------- */
  $$("[data-tabs]").forEach(list => {
    const tabs = $$('[role="tab"]', list);
    const select = (tab, focus) => {
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        const p = document.getElementById(t.getAttribute("aria-controls"));
        if (p) p.hidden = !on;
      });
      if (focus) tab.focus();
      track("tab_select", { group: list.dataset.tabs, id: tab.id });
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", e => {
        const k = e.key; let n = null;
        if (k === "ArrowRight" || k === "ArrowDown") n = tabs[(i + 1) % tabs.length];
        if (k === "ArrowLeft" || k === "ArrowUp") n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (k === "Home") n = tabs[0];
        if (k === "End") n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  });

  /* ---------------- Live mission simulation ---------------- */
  const sim = $("#simulation");
  if (sim) {
    const items = $$(".sim__log li", sim);
    const bar = $(".sim__progress i", sim);
    let timer = null, idx = 0;
    const render = () => bar.style.setProperty("--p", (idx / items.length).toFixed(3));
    const stop = () => { clearInterval(timer); timer = null; };
    const reset = () => { stop(); idx = 0; items.forEach(li => { li.hidden = true; li.classList.remove("is-new"); }); render(); };
    const play = () => {
      if (timer) return;
      if (idx >= items.length) reset();
      const tick = () => {
        if (idx >= items.length) { stop(); return; }
        const li = items[idx++]; li.hidden = false; li.classList.add("is-new"); render();
      };
      tick(); timer = setInterval(tick, 1100);
      track("simulation_play");
    };
    $('[data-sim="play"]', sim).addEventListener("click", play);
    $('[data-sim="reset"]', sim).addEventListener("click", () => { reset(); play(); });
    if (!reduced && "IntersectionObserver" in window) {
      reset();
      const sio = new IntersectionObserver(en => { if (en[0].isIntersecting) { play(); sio.disconnect(); } }, { threshold: 0.4 });
      sio.observe(sim);
    } else { idx = items.length; render(); }
  }

  /* ---------------- Kill switch demo ---------------- */
  const kill = $("#kill"), killOut = $("#kill-out");
  if (kill) kill.addEventListener("click", () => {
    const on = kill.getAttribute("aria-pressed") !== "true";
    kill.setAttribute("aria-pressed", String(on));
    killOut.textContent = on ? "TX-TA-001 · suspended · logs preserved" : "TX-TA-001 · resumed by owner";
    track("kill_switch_demo", { suspended: on });
  });

  /* ---------------- Segments carousel ---------------- */
  const segList = $("#segments");
  $$("[data-seg-scroll]").forEach(b => b.addEventListener("click", () => {
    const card = segList.firstElementChild;
    segList.scrollBy({ left: (card.getBoundingClientRect().width + 14) * Number(b.dataset.segScroll), behavior: reduced ? "auto" : "smooth" });
  }));

  /* ---------------- Mission builder ---------------- */
  const AG = {
    chief: "Chief Workforce Agent", ta: "Talent Acquisition Agent", skills: "Skills Intelligence Agent", onb: "Onboarding Agent",
    comp: "Workforce Compliance Agent", adv: "Worker Advocate Agent", audit: "Audit Agent"
  };
  const MISSIONS = {
    ta: { name: "Talent Acquisition Mission", key: "talent_acquisition", agents: ["chief", "ta", "skills", "adv", "audit"],
      gates: ["Aprovação da vaga", "Shortlist final", "Oferta", "Contratação"],
      data: "Requisitos da função, histórico recente de contratações, fontes de candidatos autorizadas e critérios de avaliação." },
    onb: { name: "Onboarding Mission", key: "onboarding", agents: ["chief", "onb", "comp", "adv", "audit"],
      gates: ["Contrato", "Alteração de condições", "Acesso sensível"],
      data: "Checklist de integração, documentação exigida, plano de formação e responsáveis por área." },
    skills: { name: "Skills Intelligence Mission", key: "skills_intelligence", agents: ["chief", "skills", "adv", "audit"],
      gates: ["Validação das competências", "Utilização em decisões laborais"],
      data: "Funções, perfis, formação realizada, provas práticas e taxonomia existente, se houver." },
    comp: { name: "Workforce Compliance Mission", key: "workforce_compliance", agents: ["chief", "comp", "audit"],
      gates: ["Exceções jurídicas", "Sanções", "Compromissos externos"],
      data: "Políticas internas, obrigações documentais, prazos, formação obrigatória e registos de aprovação." },
    plan: { name: "Skills Intelligence Mission", key: "workforce_planning", agents: ["chief", "skills", "adv", "audit"],
      gates: ["Validação das competências", "Cenários de planeamento"],
      data: "Workforce Planning é uma fase posterior do roadmap — recomendamos começar pelo mapa de capacidades: funções, perfis e lacunas." }
  };
  const mb = $("#mb");
  let mbState = null;
  function runBuilder() {
    if (!mb) return;
    const fd = new FormData(mb);
    const outcome = fd.get("outcome") || "ta", size = fd.get("size") || "m", bott = fd.get("bott"), time = fd.get("time") || "tbd";
    const sys = fd.getAll("sys"), appr = fd.getAll("appr");
    const m = MISSIONS[outcome];
    const agents = new Set(m.agents);
    if (bott === "docs") agents.add("comp");
    if (bott === "data") agents.add("skills");
    const gates = [...m.gates, ...appr.map(a => "Sign-off · " + a)];
    let data = m.data;
    if (sys.includes("sheets") || sys.includes("msg")) data += " Exportações de folhas de cálculo e mensagens relevantes, com consentimento.";
    if (sys.some(s => ["ats", "hris", "payroll", "lms"].includes(s))) data += " Acesso de leitura (API ou exportação) aos sistemas existentes.";

    let score = { s: 5, m: 25, l: 25, xl: 12 }[size];
    const frag = (sys.includes("sheets") || sys.includes("msg")) && sys.length >= 2;
    score += frag ? 20 : sys.length ? 12 : 5;
    score += bott ? 15 : 0;
    score += appr.length ? 10 : 0;
    score += appr.includes("Administração") ? 10 : 0;
    score += { "30": 10, "60": 20, "90": 20, tbd: 5 }[time];
    if (outcome === "plan") score -= 10;
    score = Math.max(0, Math.min(100, score));
    const label = score >= 75 ? "Alta — candidata a piloto supervisionado" : score >= 55 ? "Boa — requer delimitação" : "Exploratória — investigação de produto recomendada";

    $("#mb-mission").textContent = m.name;
    $("#mb-agents").innerHTML = "";
    [...agents].sort((a, b) => Object.keys(AG).indexOf(a) - Object.keys(AG).indexOf(b)).forEach(a => {
      const li = document.createElement("li"); li.textContent = AG[a]; $("#mb-agents").appendChild(li);
    });
    $("#mb-gates").innerHTML = "";
    gates.forEach(g => { const li = document.createElement("li"); li.textContent = g; $("#mb-gates").appendChild(li); });
    $("#mb-data").textContent = data;
    $("#mb-ready").textContent = label;
    $("#mb-meter").style.setProperty("--v", score + "%");
    mbState = { outcome, mission: m.key, size, sys, bott, appr, time, readiness: score };
  }
  if (mb) {
    mb.addEventListener("change", () => { runBuilder(); track("builder_change"); });
    runBuilder();
  }

  /* ==========================================================================
     Application form
     ========================================================================== */
  const form = $("#apply-form");
  if (!form) return;

  const steps = $$(".fstep[data-step]", form);
  const btnNext = $("#f-next"), btnBack = $("#f-back"), btnSubmit = $("#f-submit");
  const progress = $("#progress"), stepLabel = $("#step-label"), status = $("#form-status");
  const prefillNote = $("#prefill-note");
  let cur = 0, started = false, startedAt = 0;

  const segment = () => (form.querySelector('input[name="segment"]:checked') || {}).value || "organisation";
  const activeSteps = () => steps.filter(s => s.dataset.for.split(" ").includes(segment()));

  function applySegment() {
    const seg = segment();
    steps.forEach(s => { s.disabled = !s.dataset.for.split(" ").includes(seg); });
    $$("[data-only]", form).forEach(f => {
      const on = f.dataset.only === seg;
      f.hidden = !on;
      $$("input, select, textarea", f).forEach(i => { i.disabled = !on; });
    });
    $$("[data-required-for]", form).forEach(i => { i.required = i.dataset.requiredFor.split(" ").includes(seg); });
    $$("[data-opt-for]", form).forEach(h => { h.hidden = !h.dataset.optFor.split(" ").includes(seg); });
    if (cur >= activeSteps().length) cur = 0;
    showStep();
  }

  function showStep() {
    const act = activeSteps();
    steps.forEach(s => { s.hidden = s !== act[cur]; });
    progress.innerHTML = act.map((_, i) => `<i class="${i < cur ? "on" : i === cur ? "now" : ""}"></i>`).join("");
    stepLabel.textContent = `Passo ${cur + 1} de ${act.length} · ${act[cur].querySelector("legend").textContent}`;
    btnBack.hidden = cur === 0;
    const last = cur === act.length - 1;
    btnNext.hidden = last; btnSubmit.hidden = !last;
  }

  const MSG = {
    valueMissing: "Campo obrigatório.",
    typeMismatch: { email: "Introduza um email válido.", url: "Introduza um endereço completo, começando por https://" },
    tooLong: "Texto demasiado longo.",
    rangeOverflow: "Valor demasiado alto.", rangeUnderflow: "Valor demasiado baixo."
  };
  function fieldError(input) {
    const v = input.validity;
    if (v.valid) return "";
    if (v.valueMissing) return MSG.valueMissing;
    if (v.typeMismatch) return MSG.typeMismatch[input.type] || "Valor inválido.";
    if (v.tooLong) return MSG.tooLong;
    if (v.rangeOverflow) return MSG.rangeOverflow;
    if (v.rangeUnderflow) return MSG.rangeUnderflow;
    return "Valor inválido.";
  }
  function setErr(input, msg) {
    const field = input.closest(".field");
    if (!field) return;
    const err = field.querySelector(".err");
    field.classList.toggle("is-invalid", !!msg);
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (err) { err.textContent = msg; if (!err.id) err.id = input.id + "-err"; input.setAttribute("aria-describedby", err.id); }
  }
  function validateStep(step) {
    let firstBad = null;
    $$("input, select, textarea", step).forEach(i => {
      if (i.disabled || i.type === "radio" || i.type === "checkbox" || i.closest(".hp")) return;
      if (i.type === "url" && i.value && !/^https?:\/\//i.test(i.value)) i.value = "https://" + i.value.trim();
      const msg = fieldError(i); setErr(i, msg);
      if (msg && !firstBad) firstBad = i;
    });
    // required radio groups
    const radios = $$('input[type="radio"][required]', step).filter(r => !r.disabled);
    const groups = [...new Set(radios.map(r => r.name))];
    groups.forEach(name => {
      const ok = step.querySelector(`input[name="${name}"]:checked`);
      const err = $("#" + name + "-err");
      if (err) err.textContent = ok ? "" : "Selecione uma opção.";
      if (!ok && !firstBad) firstBad = step.querySelector(`input[name="${name}"]`);
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  form.addEventListener("input", e => {
    if (!started) { started = true; startedAt = Date.now(); track("waitlist_started", { segment: segment(), cta: lastCta }); }
    if (e.target.closest(".field.is-invalid")) setErr(e.target, fieldError(e.target));
  });
  form.addEventListener("change", e => {
    if (e.target.name === "segment") { cur = 0; applySegment(); track("segment_select", { segment: segment() }); }
    if (e.target.name === "mission") { const err = $("#mission-err"); if (err) err.textContent = ""; }
  });
  btnNext.addEventListener("click", () => {
    const act = activeSteps();
    if (!validateStep(act[cur])) return;
    cur = Math.min(cur + 1, act.length - 1); showStep();
    track("form_step", { step: act[cur].dataset.step, segment: segment() });
    form.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    setTimeout(() => { const f = $("input:not([type=hidden]):not([tabindex='-1']), select, textarea", act[cur]); if (f) f.focus({ preventScroll: true }); }, 250);
  });
  btnBack.addEventListener("click", () => { cur = Math.max(0, cur - 1); showStep(); });

  // Prefill helpers (quick form, segment CTAs, mission builder)
  function setSegment(seg) {
    const r = form.querySelector(`input[name="segment"][value="${seg}"]`);
    if (r && !r.checked) { r.checked = true; cur = 0; applySegment(); }
  }
  function note(msg) { prefillNote.textContent = msg; prefillNote.hidden = !msg; }

  document.addEventListener("click", e => {
    const a = e.target.closest("a[data-seg]");
    if (a) setSegment(a.dataset.seg);
  });

  const quick = $("#quick");
  if (quick) quick.addEventListener("submit", e => {
    e.preventDefault();
    const email = $("#q-email");
    const err = $("#q-err");
    if (!email.value || !email.checkValidity()) { err.textContent = "Introduza um email profissional válido."; email.focus(); return; }
    err.textContent = "";
    setSegment($("#q-seg").value);
    $("#f-email").value = email.value.trim();
    note("Ótimo — guardámos o seu email. Complete a candidatura abaixo; leva cerca de 4 minutos.");
    if (!started) { started = true; startedAt = Date.now(); }
    track("waitlist_started", { segment: segment(), via: "hero_quick" });
    $("#apply").scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    setTimeout(() => $("#f-name").focus({ preventScroll: true }), reduced ? 0 : 700);
  });

  const useBtn = $("#mb-use");
  if (useBtn) useBtn.addEventListener("click", () => {
    if (!mbState) return;
    setSegment("organisation");
    const mRadio = form.querySelector(`input[name="mission"][value="${mbState.mission}"]`);
    if (mRadio) mRadio.checked = true;
    const wmap = { s: "<100", m: "100-500", l: "500-2000", xl: ">2000" };
    $("#f-workers").value = wmap[mbState.size];
    const smap = { sheets: "spreadsheets", ats: "ats", hris: "hris", payroll: "payroll", lms: "lms" };
    $$('input[name="hr_systems"]', form).forEach(c => { c.checked = mbState.sys.some(s => smap[s] === c.value); });
    if (mbState.sys.includes("msg")) { const w = form.querySelector('input[name="comms"][value="whatsapp"]'); if (w) w.checked = true; }
    $("#f-deadline").value = { "30": "<3m", "60": "<3m", "90": "3-6m", tbd: "explore" }[mbState.time];
    form.dataset.builder = JSON.stringify(mbState);
    note("Pré-preenchemos a missão, dimensão e sistemas a partir do Mission Builder. Pode alterar tudo.");
    toast("Missão adicionada à candidatura");
    $("#apply").scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  });

  /* ---- Internal qualification score (section 17). Prioritisation only; recompute server-side. ---- */
  function qualify(d) {
    if (d.segment !== "organisation") return null;
    const s = {};
    const bl = (d.bottleneck || "").trim().length, pl = (d.current_process || "").trim().length;
    const heavy = { "20-40h": 1, ">40h": 1 }[d.time_spent] ? 1 : d.time_spent === "5-20h" ? .6 : .25;
    s.pain = Math.round(20 * Math.min(1, (Math.min(bl, 240) / 240) * .5 + (Math.min(pl, 400) / 400) * .2 + heavy * .3));
    s.volume = { "0-2": 3, "3-10": 9, "11-30": 13, ">30": 15 }[d.monthly_hires] || 0;
    s.measurable = Math.min(15, ((d.target_outcome || "").length > 12 ? 9 : 3) + (/\d/.test(d.target_outcome || "") ? 6 : 0));
    s.exec = d.exec_owner === "yes" ? 10 : 0;
    s.data = { yes: 10, partial: 5, no: 0 }[d.data_available] || 0;
    const sys = d.hr_systems || [], comms = d.comms || [];
    s.integration = (comms.includes("m365") || comms.includes("google") || sys.includes("spreadsheets")) ? 10 : sys.length ? 6 : 3;
    s.risk = { talent_acquisition: 10, onboarding: 10, skills_intelligence: 9, workforce_compliance: 7, workforce_planning: 5, other: 4 }[d.mission] || 4;
    s.repeat = { "1": 1, "2-5": 3, "6-20": 5, ">20": 5 }[d.locations] || 1;
    s.market = d.country === "Moçambique" ? 5 : ["Angola", "Cabo Verde", "Guiné-Bissau", "São Tomé e Príncipe", "África do Sul", "Quénia", "Nigéria", "Outro país africano"].includes(d.country) ? 3 : 1;
    if (d.workers === "<100" || d.workers === ">2000") s.volume = Math.max(0, s.volume - 3);
    const total = Object.values(s).reduce((a, b) => a + b, 0);
    const band = total >= 80 ? "priority_interview" : total >= 65 ? "good_needs_scoping" : total >= 50 ? "product_research" : "newsletter_only";
    return { total, band, breakdown: s, model: "WL-QS-v1" };
  }

  function collect() {
    const fd = new FormData(form);
    const d = {};
    for (const [k, v] of fd.entries()) {
      if (k === "company_fax") continue;
      if (["hr_systems", "comms"].includes(k)) (d[k] = d[k] || []).push(v);
      else if (!k.startsWith("consent_")) d[k] = typeof v === "string" ? v.trim() : v;
    }
    return d;
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const act = activeSteps();
    if (cur !== act.length - 1) { btnNext.click(); return; }
    for (let i = 0; i < act.length; i++) {
      if (!validateStep(act[i])) { cur = i; showStep(); validateStep(act[i]); return; }
    }
    status.className = "form-status"; status.textContent = "";

    // Spam protection: honeypot, minimum completion time, client throttle. Enforce again server-side.
    const hp = $("#f-hp").value;
    const elapsed = Date.now() - (startedAt || Date.now());
    const lastSent = store.get("tx_last_submit", 0);
    if (hp) { location.href = "welcome.html"; return; }
    if (elapsed < 4000) { status.className = "form-status err-box"; status.textContent = "Submissão demasiado rápida. Reveja os dados e tente novamente."; return; }
    if (Date.now() - lastSent < 30000) { status.className = "form-status err-box"; status.textContent = "Acabámos de receber uma candidatura deste navegador. Aguarde alguns segundos."; return; }

    const data = collect();
    const now = new Date().toISOString();
    const payload = {
      type: "waitlist_application",
      segment: data.segment,
      applicant: data,
      consents: {
        contact: !!form.consent_contact.checked,
        product_updates: !!form.consent_updates.checked,
        product_research: !!form.consent_research.checked,
        captured_at: now,
        text_version: CFG.formVersion
      },
      source: Object.assign({}, store.sget("tx_src", {}), { cta: lastCta, page: location.pathname }),
      mission_builder: form.dataset.builder ? JSON.parse(form.dataset.builder) : null,
      internal: { qualification: qualify(data) },
      meta: { submitted_at: now, form_version: CFG.formVersion, completion_ms: elapsed, lang: document.documentElement.lang }
    };

    btnSubmit.disabled = true;
    btnSubmit.firstChild.textContent = "A enviar… ";
    try {
      if (CFG.endpoint) {
        const res = await fetch(CFG.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true });
        if (!res.ok) throw new Error("HTTP " + res.status);
      } else {
        const outbox = store.get("tx_waitlist_outbox", []);
        outbox.push(payload); store.set("tx_waitlist_outbox", outbox.slice(-20));
        console.warn("[TursiopsX] DEMO MODE — no endpoint configured in assets/js/config.js. Application kept in localStorage only.", payload);
      }
      store.set("tx_last_submit", Date.now());
      store.sset("tx_applicant", { first: (data.name || "").split(" ")[0], segment: data.segment, email: data.email });
      track("waitlist_completed", { segment: data.segment, band: payload.internal.qualification && payload.internal.qualification.band });
      location.href = "welcome.html?s=" + encodeURIComponent(data.segment);
    } catch (err) {
      btnSubmit.disabled = false;
      btnSubmit.firstChild.textContent = "Submit Early Access Application ";
      status.className = "form-status err-box";
      status.textContent = "Não foi possível enviar a candidatura. Verifique a ligação e tente novamente — os seus dados continuam no formulário.";
      track("waitlist_error", { message: String(err).slice(0, 120) });
    }
  });

  applySegment();
})();
