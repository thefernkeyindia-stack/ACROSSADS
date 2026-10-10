/* =============================================================
   Interactive demo: a scripted WhatsApp-style conversation simulator.
   NOT a live AI. Every reply is pre-written and the page says so.
   The visitor plays the customer by tapping suggested replies; the "AI" answers
   using what they chose and fills in a lead profile as it goes.
   Self-contained (wrapped in a function) so it cannot clash with script.js globals.
   ============================================================= */
(function () {
  "use strict";

  var root = document.getElementById("demo");
  if (!root) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Scenario scripts ---------- */
  var SCENARIOS = {
    realestate: {
      business: "Skyline Residences",
      initial: "S",
      steps: ["Replies instantly", "Understands the need", "Qualifies the budget", "Checks the timing", "Books the site visit"],
      fields: [["config", "Looking for"], ["purpose", "Purpose"], ["budget", "Budget"], ["timeline", "Timeline"], ["slot", "Site visit"]],
      greeting: function () { return "Hi 👋 Welcome to Skyline Residences. What would you like to know?"; },
      stages: [
        { key: "config", options: [["Is the 3 BHK still available?", "3 BHK"], ["Do you have a 2 BHK?", "2 BHK"], ["Any 4 BHK left?", "4 BHK"]] },
        { key: "purpose", ai: function (s) { return "Yes, we have " + s.config + " homes available in Tower B. Is this to live in, or an investment?"; }, options: [["To live in", "To live in"], ["An investment", "Investment"]] },
        { key: "budget", ai: function (s) { return s.purpose === "Investment" ? "Good to know. What budget range are you considering?" : "Lovely. What budget range works for you?"; }, options: [["₹80–90 L", "₹80–90 L"], ["₹1.2–1.4 Cr", "₹1.2–1.4 Cr"], ["₹1.8 Cr+", "₹1.8 Cr+"]] },
        { key: "timeline", ai: function (s) { return s.budget + " fits several " + s.config + " options on higher floors. How soon are you planning to decide?"; }, options: [["Within 3 months", "Within 3 months"], ["In 3–6 months", "3–6 months"], ["Just exploring", "Just exploring"]] },
        { key: "slot", ai: function () { return "Thanks, that helps a lot. Would you like to see the sample flat? I can book a site visit for you."; }, options: [["Saturday, 11 AM", "Sat, 11:00 AM"], ["Sunday, 4 PM", "Sun, 4:00 PM"], ["Call me instead", "Callback requested"]] }
      ],
      finish: function (s) {
        if (s.slot === "Callback requested") {
          return { lead: "No problem. I'll ask our sales team to call you.", card: { soft: true, title: "Callback requested", rows: [["For", s.config + " · " + s.budget], ["Next", "A sales executive will call you"]], foot: "Your chat summary was shared with the team." }, tag: "🔔 Qualified lead · sales team notified" };
        }
        return { lead: "Done ✅ I've booked it for you.", card: { title: "Site visit confirmed", rows: [["When", s.slot], ["Where", "Skyline Residences, Tower B"], ["Interested in", s.config + " · " + s.budget]], foot: "A reminder will arrive on WhatsApp." }, tag: "🔔 Qualified lead · sales team notified" };
      }
    },

    ecom: {
      business: "Noor & Co. Store",
      initial: "N",
      steps: ["Answers product questions", "Checks the size", "Confirms the colour", "Handles delivery & payment", "Turns intent into an order"],
      fields: [["product", "Product"], ["size", "Size"], ["colour", "Colour"], ["payment", "Payment"], ["intent", "Purchase"]],
      greeting: function () { return "Hi 👋 Welcome to Noor & Co. What are you shopping for today?"; },
      stages: [
        { key: "product", options: [["Is the linen shirt in stock?", "Linen Shirt"], ["Do you have the wrap dress?", "Wrap Dress"], ["Show me kurta sets under ₹2,000", "Kurta Set"]] },
        { key: "size", ai: function (s) { return "Yes, the " + s.product + " is in stock 🙌 What size do you usually wear?"; }, options: [["S", "S"], ["M", "M"], ["L", "L"], ["XL", "XL"]] },
        { key: "colour", ai: function (s) { return "Size " + s.size + " is available in Ivory and Sage. Which colour would you like?"; }, options: [["Ivory", "Ivory"], ["Sage", "Sage"]] },
        { key: "payment", ai: function (s) { return "Great pick, " + s.colour + " looks lovely. Delivery usually takes 3–5 days and COD is available. How would you like to pay?"; }, options: [["Pay online (UPI)", "UPI"], ["Cash on delivery", "Cash on delivery"]] },
        { key: "intent", ai: function () { return "Shall I place the order for you now?"; }, options: [["Yes, place my order", "Order placed"], ["Not now, just browsing", "Saved for later"]] }
      ],
      finish: function (s) {
        if (s.intent === "Saved for later") {
          return { lead: "No worries. I've saved your selection. I'll check back with you in a day or two.", card: { soft: true, title: "Selection saved", rows: [["Item", s.product + " · " + s.size + " · " + s.colour], ["Next", "Friendly follow-up scheduled"]], foot: "Follow-ups continue without manual effort." }, tag: "🔔 Warm lead · follow-up scheduled" };
        }
        return { lead: "Done ✅ Your order is ready.", card: { title: "Order ready", rows: [["Item", s.product + " · " + s.size + " · " + s.colour], ["Payment", s.payment], ["Delivery", "3–5 days"]], foot: s.payment === "UPI" ? "A secure payment link is sent on WhatsApp." : "Pay when it arrives. Confirmation sent on WhatsApp." }, tag: "🔔 Purchase intent captured · order created" };
      }
    },

    clinic: {
      business: "Lumen Skin Clinic",
      initial: "L",
      steps: ["Answers treatment questions", "Understands the history", "Finds a preferred day", "Finds a preferred time", "Books the consultation"],
      fields: [["treatment", "Treatment"], ["history", "History"], ["day", "Preferred day"], ["time", "Preferred time"], ["confirm", "Consultation"]],
      greeting: function () { return "Hi 👋 Welcome to Lumen Skin Clinic. How can we help today?"; },
      stages: [
        { key: "treatment", options: [["Do you offer acne treatment?", "Acne treatment"], ["I'd like to ask about laser hair removal", "Laser hair removal"], ["Do you treat pigmentation?", "Pigmentation care"]] },
        { key: "history", ai: function (s) { return "Yes, we do offer " + s.treatment.toLowerCase() + ". A short consultation helps our doctor plan it properly. Have you had treatment for this before?"; }, options: [["It's my first time", "First time"], ["I've tried before", "Tried before"]] },
        { key: "day", ai: function () { return "Thanks for sharing. Which days suit you best?"; }, options: [["Weekdays", "Weekday"], ["Weekends", "Weekend"]] },
        { key: "time", ai: function (s) { return (s.day === "Weekend" ? "Weekends" : "Weekdays") + " work well. What time of day is best?"; }, options: [["Morning", "Morning"], ["Afternoon", "Afternoon"], ["Evening", "Evening"]] },
        { key: "confirm", ai: function (s) { return "I can book your consultation for a " + s.day.toLowerCase() + " " + s.time.toLowerCase() + ". Shall I confirm it?"; }, options: [["Yes, confirm it", "Booked"], ["I have a medical question first", "Doctor callback"]] }
      ],
      finish: function (s) {
        if (s.confirm === "Doctor callback") {
          return { lead: "Of course. Medical questions are best answered by our team, so I'm passing your details to them right away.", card: { soft: true, title: "Handed to our team", rows: [["Topic", s.treatment], ["Preferred", s.day + " · " + s.time]], foot: "A team member will reply on WhatsApp." }, tag: "🔔 Human handoff · full summary shared" };
        }
        return { lead: "Done ✅ Your consultation is booked.", card: { title: "Consultation booked", rows: [["Treatment", s.treatment], ["When", s.day + " · " + s.time], ["With", "Our doctor"]], foot: "We'll send a reminder before your visit." }, tag: "🔔 Qualified · appointment booked" };
      }
    }
  };

  var ORDER = ["realestate", "ecom", "clinic"];
  var CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  var ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>';

  /* ---------- DOM ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var body = $("dmBody"), opts = $("dmOpts"), hint = $("dmHint"), status = $("dmStatus");
  var nameEl = $("dmName"), avatar = $("dmAvatar"), bar = $("dmBar"), barWrap = $("dmBarWrap");
  var stepTxt = $("dmStep"), stepsEl = $("dmSteps"), leadRows = $("dmLeadRows"), leadCard = $("dmLead");
  var leadStatus = $("dmLeadStatus"), panel = $("dmPanel"), restartBtn = $("dmRestart"), autoBtn = $("dmAuto");
  var tabs = Array.prototype.slice.call(root.querySelectorAll(".dm-tab"));

  var current = "realestate";
  var run = 0; // token: any async chain holding a stale token just stops
  var auto = false;
  var state = {};
  var answered = 0;

  var speed = reduceMotion ? 0.12 : 1;
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms * speed); }); };
  var time = function () { return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); };
  var scrollDown = function () { body.scrollTo({ top: body.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" }); };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------- renderers ---------- */
  function renderSteps(sc) {
    stepsEl.innerHTML = "";
    sc.steps.forEach(function (label, i) {
      var li = el("li");
      li.setAttribute("data-i", i);
      var n = el("span", "dm-steps__n");
      n.appendChild(el("span", "", String(i + 1)));
      n.insertAdjacentHTML("beforeend", CHECK);
      li.appendChild(n);
      li.appendChild(document.createTextNode(label));
      stepsEl.appendChild(li);
    });
  }
  function renderLead(sc) {
    leadRows.innerHTML = "";
    sc.fields.forEach(function (f) {
      var row = el("div");
      row.setAttribute("data-k", f[0]);
      row.appendChild(el("dt", "", f[1]));
      row.appendChild(el("dd", "", "—"));
      leadRows.appendChild(row);
    });
    leadCard.classList.remove("is-complete");
    leadStatus.textContent = "Collecting…";
  }
  function setProgress(n, total) {
    answered = n;
    bar.style.width = (n / total) * 100 + "%";
    barWrap.setAttribute("aria-valuenow", String(n));
    barWrap.setAttribute("aria-valuemax", String(total));
    stepTxt.textContent = n >= total ? "Complete" : "Step " + (n + 1) + " of " + total;
    Array.prototype.forEach.call(stepsEl.children, function (li, i) {
      li.classList.toggle("is-done", i < n);
      li.classList.toggle("is-current", i === n && n < total);
    });
  }
  function fillLead(key, value) {
    var row = leadRows.querySelector('[data-k="' + key + '"]');
    if (!row) return;
    row.querySelector("dd").textContent = value;
    row.classList.add("is-set");
  }
  function add(node) { body.appendChild(node); scrollDown(); return node; }

  // The AI agent speaks from the right in green (same as the hero chat); the customer from the left.
  function aiBubble(text) {
    var m = el("div", "dm-msg dm-msg--out", text);
    m.appendChild(el("small", "", time() + " ✓✓"));
    return add(m);
  }
  function customerBubble(text) {
    var m = el("div", "dm-msg dm-msg--in", text);
    m.appendChild(el("small", "", time()));
    return add(m);
  }
  function typingNode() {
    var t = el("div", "dm-typing");
    t.innerHTML = "<i></i><i></i><i></i>";
    return add(t);
  }
  function resultCard(card) {
    var c = el("div", "dm-card" + (card.soft ? " dm-card--soft" : ""));
    var head = el("div", "dm-card__head");
    head.appendChild(el("span", "dm-card__ok", "✓"));
    head.appendChild(el("b", "", card.title));
    c.appendChild(head);
    var dl = el("dl");
    card.rows.forEach(function (r) {
      dl.appendChild(el("dt", "", r[0]));
      dl.appendChild(el("dd", "", r[1]));
    });
    c.appendChild(dl);
    c.appendChild(el("p", "", card.foot));
    return add(c);
  }

  /* ---------- conversation engine ---------- */
  async function aiSay(text, token) {
    status.textContent = "typing…";
    var t = typingNode();
    await wait(650 + Math.min(text.length * 14, 1000));
    if (token !== run) return false;
    t.remove();
    status.textContent = "AI assistant · online";
    aiBubble(text);
    return true;
  }

  function showOptions(stage, token) {
    opts.innerHTML = "";
    hint.hidden = false;
    hint.textContent = "Tap a reply as the customer";
    stage.options.forEach(function (o, i) {
      var b = el("button", "dm-qr", o[0]);
      b.type = "button";
      b.style.setProperty("--i", i);
      b.addEventListener("click", function () { choose(stage, o[0], o[1], token); });
      opts.appendChild(b);
    });
    if (auto) {
      var buttons = Array.prototype.slice.call(opts.querySelectorAll(".dm-qr"));
      wait(1500).then(function () {
        if (token === run && auto && buttons[0] && buttons[0].isConnected) buttons[Math.floor(Math.random() * buttons.length)].click();
      });
    }
  }

  async function choose(stage, label, value, token) {
    if (token !== run) return;
    var sc = SCENARIOS[current];
    var idx = sc.stages.indexOf(stage);
    opts.innerHTML = "";
    hint.hidden = true;
    state[stage.key] = value;
    customerBubble(label);
    fillLead(stage.key, value);
    setProgress(idx + 1, sc.stages.length);
    await wait(500);
    if (token !== run) return;
    var next = sc.stages[idx + 1];
    if (next) {
      if (!(await aiSay(next.ai(state), token))) return;
      showOptions(next, token);
    } else {
      await finish(sc, token);
    }
  }

  async function finish(sc, token) {
    var out = sc.finish(state);
    if (!(await aiSay(out.lead, token))) return;
    await wait(300);
    if (token !== run) return;
    resultCard(out.card);
    await wait(700);
    if (token !== run) return;
    add(el("div", "dm-tag", out.tag));
    leadCard.classList.add("is-complete");
    leadStatus.textContent = "Handed to sales team";

    // end of the demo: take the next step, or try another industry
    opts.innerHTML = "";
    hint.hidden = false;
    hint.textContent = "That's the full flow";
    var cta = el("a", "btn btn--chrome btn--sm", "Book a free strategy call");
    cta.href = "#contact";
    opts.appendChild(cta);
    var nextKey = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
    var nextTab = tabs.filter(function (t) { return t.getAttribute("data-scenario") === nextKey; })[0];
    var alt = el("button", "btn btn--ghost btn--sm", "Try " + nextTab.textContent.trim());
    alt.type = "button";
    alt.addEventListener("click", function () { selectScenario(nextKey); });
    opts.appendChild(alt);
    setAuto(false);
  }

  async function start(key) {
    current = key;
    var token = ++run;
    var sc = SCENARIOS[key];
    state = {};
    body.innerHTML = "";
    body.appendChild(el("div", "dm-day", "Today"));
    opts.innerHTML = "";
    hint.hidden = true;
    nameEl.textContent = sc.business;
    avatar.textContent = sc.initial;
    status.textContent = "AI assistant · online";
    renderSteps(sc);
    renderLead(sc);
    setProgress(0, sc.stages.length);
    await wait(500);
    if (token !== run) return;
    if (!(await aiSay(sc.greeting(), token))) return;
    showOptions(sc.stages[0], token);
  }

  function setAuto(on) {
    auto = on;
    autoBtn.setAttribute("aria-pressed", String(on));
    autoBtn.innerHTML = (on ? ICON_PAUSE : ICON_PLAY) + (on ? "Pause" : "Watch it run");
  }

  function selectScenario(key, focus) {
    tabs.forEach(function (t) {
      var on = t.getAttribute("data-scenario") === key;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus({ preventScroll: true });
    });
    panel.setAttribute("aria-labelledby", "dm-tab-" + key);
    setAuto(false);
    start(key);
  }

  /* ---------- wiring ---------- */
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectScenario(t.getAttribute("data-scenario")); });
    t.addEventListener("keydown", function (e) {
      var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (e.key === "Home") { e.preventDefault(); return selectScenario(tabs[0].getAttribute("data-scenario"), true); }
      if (e.key === "End") { e.preventDefault(); return selectScenario(tabs[tabs.length - 1].getAttribute("data-scenario"), true); }
      if (!dir) return;
      e.preventDefault();
      selectScenario(tabs[(i + dir + tabs.length) % tabs.length].getAttribute("data-scenario"), true);
    });
  });
  restartBtn.addEventListener("click", function () { setAuto(false); start(current); });
  autoBtn.addEventListener("click", function () {
    if (auto) return setAuto(false);
    var finished = answered >= SCENARIOS[current].stages.length;
    setAuto(true);
    if (finished) { start(current); return; }
    // resume from wherever the visitor is: pick for them after a beat
    var buttons = Array.prototype.slice.call(opts.querySelectorAll(".dm-qr"));
    if (buttons.length) {
      wait(900).then(function () {
        if (auto && buttons[0].isConnected) buttons[Math.floor(Math.random() * buttons.length)].click();
      });
    }
  });

  start("realestate");
})();
