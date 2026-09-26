/* =============================================================
   AcrossAds: interactions
   No dependencies. Everything respects prefers-reduced-motion.
   ============================================================= */

/* ─────────────────────────────────────────────────────────────
   CONFIG: edit these
   ───────────────────────────────────────────────────────────── */

// Used only if the Web3Forms access key in index.html hasn't been set yet:
// the form then opens the visitor's email app addressed to this inbox.
// ✏️ Replace with the email you want leads sent to.
const FALLBACK_EMAIL = "YOUR_EMAIL@example.com";

// The animated WhatsApp conversation in the hero phone.
// from: "in" = lead, "out" = AI agent. Keep messages short so they fit.
const HERO_CHAT = [
  { from: "in",  text: "Hi, saw your ad for the 2 & 3 BHK flats. What's the price?" },
  { from: "out", text: "Hi! 👋 2 BHK starts at ₹78L and 3 BHK at ₹1.1Cr. Are you buying to live in or as an investment?" },
  { from: "in",  text: "To live in. Budget is around 85L" },
  { from: "out", text: "Perfect, a 2 BHK on a higher floor fits that. Possession is Dec 2027 and we have home-loan tie-ups. Would you like to see the sample flat?" },
  { from: "in",  text: "Yes, this weekend?" },
  { from: "out", text: "✅ Site visit booked: Sat, 11:00 AM. Our manager Rahul will meet you at the gate. Location pin sent 📍", booked: true },
];

/* ───────────────────────────────────────────────────────────── */

document.documentElement.classList.remove("no-js");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- Navbar: scrolled state, mobile menu, active link ---------- */
(() => {
  const nav = $("#nav");
  const toggle = $("#navToggle");
  const links = $$("#navLinks a");

  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 10);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  links.forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => e.key === "Escape" && setOpen(false));

  // Highlight the nav link of the section in view
  const sections = links.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id && !a.classList.contains("btn")));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  new Set(sections).forEach((s) => spy.observe(s));
})();

/* ---------- Scroll reveal (with stagger for siblings) ---------- */
(() => {
  const items = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }
  // stagger siblings inside the same parent
  const groups = new Map();
  items.forEach((el) => {
    const list = groups.get(el.parentElement) || [];
    list.push(el);
    groups.set(el.parentElement, list);
  });
  groups.forEach((list) => list.forEach((el, i) => el.style.setProperty("--d", `${Math.min(i, 6) * 0.08}s`)));

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  items.forEach((el) => io.observe(el));
})();

/* ---------- System flow: fill the spine + light up steps as you scroll ---------- */
(() => {
  const flow = $("#flow");
  const fill = $("#flowFill");
  const steps = $$(".step", flow);
  if (!flow) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    const r = flow.getBoundingClientRect();
    const trigger = window.innerHeight * 0.6; // line "head" sits at 60% of viewport height
    const p = Math.max(0, Math.min(1, (trigger - r.top) / r.height));
    fill.style.height = `${p * 100}%`;
    steps.forEach((s) => {
      const sr = s.getBoundingClientRect();
      s.classList.toggle("is-lit", sr.top + 32 < trigger);
    });
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
})();

/* ---------- Stat counters ---------- */
(() => {
  const nums = $$("[data-count]");
  const fmt = new Intl.NumberFormat("en-IN");
  const render = (el, v) => {
    el.textContent = `${el.dataset.prefix || ""}${fmt.format(v)}${el.dataset.suffix || ""}`;
  };
  const run = (el) => {
    const target = parseFloat(el.dataset.count);
    if (reduceMotion) return render(el, target);
    const dur = 1600;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      render(el, Math.round(target * eased));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  nums.forEach((el) => render(el, 0));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
  }, { threshold: 0.6 });
  nums.forEach((el) => io.observe(el));
})();

/* ---------- Hero: animated WhatsApp chat (loops) ---------- */
(() => {
  const body = $("#heroChat");
  const status = $("#waStatus");
  if (!body) return;

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const time = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const bubble = (m) => {
    const el = document.createElement("div");
    el.className = `msg msg--${m.from}${m.booked ? " msg--booked" : ""}`;
    el.textContent = m.text;
    const t = document.createElement("small");
    t.textContent = time() + (m.from === "out" ? " ✓✓" : "");
    el.appendChild(t);
    return el;
  };
  // keep the visible stack tidy: drop the oldest bubbles once they overflow
  const trim = () => { while (body.scrollHeight > body.clientHeight + 2 && body.children.length > 1) body.firstElementChild.remove(); };

  if (reduceMotion) { HERO_CHAT.forEach((m) => body.appendChild(bubble(m))); trim(); return; }

  let visible = true;
  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(body);

  (async function loop() {
    while (true) {
      body.innerHTML = "";
      await wait(700);
      for (const m of HERO_CHAT) {
        while (!visible) await wait(400);
        if (m.from === "out") {
          status.textContent = "typing…";
          const typing = document.createElement("div");
          typing.className = "typing";
          typing.innerHTML = "<i></i><i></i><i></i>";
          body.appendChild(typing); trim();
          await wait(1100 + Math.min(m.text.length * 12, 1100));
          typing.remove();
          status.textContent = "AI assistant · online";
        } else {
          await wait(900);
        }
        body.appendChild(bubble(m)); trim();
        await wait(m.from === "in" ? 500 : 1300);
      }
      await wait(4500);
    }
  })();
})();

/* ---------- Hero particle mesh (canvas) ---------- */
(() => {
  const canvas = $("#mesh");
  if (!canvas || reduceMotion) return;
  const ctx = canvas.getContext("2d");
  let w, h, dpr, pts = [], running = true, raf;
  const mouse = { x: -1e4, y: -1e4 };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(90, (w * h) / 16000)); // fewer points on mobile
    pts = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.4 + 0.4,
    }));
  };

  const LINK = 130;
  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      // gentle pull towards the cursor
      const dx = mouse.x - p.x, dy = mouse.y - p.y, dm = Math.hypot(dx, dy);
      if (dm < 180) { p.x += dx * 0.004; p.y += dy * 0.004; }
    }
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(172,188,203,${(1 - d / LINK) * 0.22})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      ctx.fillStyle = "rgba(220,230,240,.7)";
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
    }
    if (running) raf = requestAnimationFrame(draw);
  };

  resize();
  draw();
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
  canvas.parentElement.parentElement.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  // pause when the hero is off-screen or the tab is hidden (saves battery on mobile)
  const setRun = (v) => { if (v && !running) { running = true; draw(); } else if (!v) { running = false; cancelAnimationFrame(raf); } };
  new IntersectionObserver(([en]) => setRun(en.isIntersecting)).observe(canvas);
  document.addEventListener("visibilitychange", () => setRun(!document.hidden));
})();

/* ---------- Subtle parallax (hero orbs + phone) ---------- */
(() => {
  if (reduceMotion) return;
  const els = $$("[data-parallax]");
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = window.scrollY;
    if (y > window.innerHeight * 1.2) return;
    els.forEach((el) => (el.style.translate = `0 ${y * parseFloat(el.dataset.parallax)}px`));
  };
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
})();

/* ---------- Industry cards: cursor spotlight ---------- */
$$(".i-card").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});

/* ---------- Lead form → Web3Forms (with mailto fallback) ---------- */
(() => {
  const form = $("#leadForm");
  const btn = $("#submitBtn");
  const statusEl = $("#formStatus");
  if (!form) return;

  const setStatus = (msg, type) => { statusEl.textContent = msg; statusEl.className = `form__status ${type || ""}`; };

  const validate = () => {
    let ok = true;
    $$("input[required], select[required]", form).forEach((f) => {
      const bad = !f.checkValidity() || !f.value.trim();
      f.closest(".field").classList.toggle("has-error", bad);
      if (bad && ok) { f.focus(); ok = false; }
    });
    return ok;
  };
  $$("input, select", form).forEach((f) => f.addEventListener("input", () => f.closest(".field")?.classList.remove("has-error")));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form.botcheck.checked) return; // spam bot
    if (!validate()) { setStatus("Please fill in all fields correctly.", "err"); return; }

    const data = Object.fromEntries(new FormData(form));
    delete data.botcheck;

    // No access key yet → open the visitor's email app pre-filled (works with zero setup)
    if (!data.access_key || data.access_key.startsWith("YOUR_")) {
      const body =
        `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\nIndustry: ${data.industry}\nBusiness Name: ${data.business_name}`;
      window.location.href = `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(body)}`;
      setStatus("Opening your email app to send your details…", "ok");
      return;
    }

    btn.classList.add("is-loading"); btn.disabled = true;
    setStatus("");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Submission failed");
      form.reset();
      setStatus("Thanks! We've got your details and will reach out within one business day.", "ok");
      // Hook for ad tracking, e.g. Meta Pixel:  if (window.fbq) fbq('track', 'Lead');
    } catch (err) {
      setStatus("Something went wrong. Please try again or message us on WhatsApp.", "err");
    } finally {
      btn.classList.remove("is-loading"); btn.disabled = false;
    }
  });
})();
