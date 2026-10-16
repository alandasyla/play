(() => {
  "use strict";

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const root = document.documentElement;
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reducedMotion = () => motionQuery.matches;
  const isTextbook = () => root.classList.contains("is-textbook");
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /* ---------- Toast & confetti ---------- */
  const toastEl = $("#toast");
  let toastTimer = 0;

  function toast(message, ms = 3400) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), ms);
  }

  const confettiEl = $("#confetti");
  const COLORS = ["#ff6b57", "#ffc23c", "#2fc8a3", "#4cb8ff", "#8b6cff", "#ff8fc7"];
  let confettiTimer = 0;

  function confetti(count = 90) {
    if (!confettiEl || reducedMotion() || isTextbook()) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("i");
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.background = COLORS[i % COLORS.length];
      piece.style.animationDelay = `${Math.random() * 0.4}s`;
      piece.style.setProperty("--dx", `${(Math.random() - 0.5) * 320}px`);
      piece.style.setProperty("--rot", `${Math.random() * 900 - 450}deg`);
      piece.style.setProperty("--t", `${1.8 + Math.random() * 1.6}s`);
      if (Math.random() > 0.5) piece.style.borderRadius = "50%";
      frag.appendChild(piece);
    }
    confettiEl.appendChild(frag);
    clearTimeout(confettiTimer);
    confettiTimer = setTimeout(() => { confettiEl.textContent = ""; }, 4400);
  }

  /* ---------- Header ---------- */
  const header = $("#site-header");
  const burger = $("#burger");
  const nav = $("#nav");

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
  }

  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  $$(".nav__link").forEach((link) => link.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  document.addEventListener("click", (e) => {
    if (nav.classList.contains("is-open") && !header.contains(e.target)) setMenu(false);
  });

  const navLinks = $$(".nav__link");
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${entry.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach((a) => {
      const section = document.getElementById(a.getAttribute("href").slice(1));
      if (section) spy.observe(section);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$(".reveal");
  revealEls.forEach((el) => {
    const siblings = Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal"));
    el.style.setProperty("--d", `${Math.min(siblings.indexOf(el), 6) * 0.08}s`);
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        obs.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Textbook mode ---------- */
  const modeToggle = $("#mode-toggle");
  const banner = $("#tb-banner");
  const swapEls = $$("[data-textbook]");
  const savedHtml = new Map();
  let sleepyTimer = 0;

  function setTextbook(on) {
    if (on === isTextbook()) return;
    root.classList.toggle("is-textbook", on);
    modeToggle.setAttribute("aria-pressed", String(on));
    banner.hidden = !on;

    swapEls.forEach((el) => {
      if (on) {
        savedHtml.set(el, el.innerHTML);
        el.textContent = el.dataset.textbook;
      } else if (savedHtml.has(el)) {
        el.innerHTML = savedHtml.get(el);
      }
    });

    clearTimeout(sleepyTimer);
    if (on) {
      toast("Textbook mode on. Sit still and read quietly…");
      sleepyTimer = setTimeout(() => toast("Feeling sleepy? That’s kind of the point. Flip the switch to play again."), 9000);
    } else {
      toast("Welcome back to play mode! 🎉");
      confetti(70);
    }
    document.dispatchEvent(new CustomEvent("textbookchange", { detail: on }));
  }

  modeToggle.addEventListener("click", () => setTextbook(!isTextbook()));
  $$("[data-textbook-off]").forEach((btn) => btn.addEventListener("click", () => setTextbook(false)));
  $$("[data-textbook-on]").forEach((btn) => btn.addEventListener("click", () => {
    setTextbook(true);
    window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" });
  }));

  /* ---------- Toy box physics ---------- */
  function initPlayground() {
    const box = $("#playground");
    if (!box) return;

    const toys = $$(".toy", box).map((el) => ({
      el, x: 0, y: 0, vx: 0, vy: 0, r: 0,
      rot: Math.random() * 30 - 15,
      drag: null,
    }));
    let W = 0;
    let H = 0;
    let zTop = 10;

    function measure() {
      W = box.clientWidth;
      H = box.clientHeight;
      toys.forEach((t) => {
        t.r = t.el.offsetWidth / 2;
        t.x = clamp(t.x, t.r, Math.max(t.r, W - t.r));
        t.y = clamp(t.y, t.r, Math.max(t.r, H - t.r));
      });
    }

    measure();
    toys.forEach((t) => {
      t.x = clamp(parseFloat(t.el.dataset.x) * W, t.r, W - t.r);
      t.y = clamp(parseFloat(t.el.dataset.y) * H, t.r, H - t.r);
      if (!reducedMotion()) {
        t.vx = (Math.random() - 0.5) * 0.08;
        t.vy = (Math.random() - 0.5) * 0.08;
      }
    });

    function render() {
      for (const t of toys) {
        t.el.style.transform = `translate3d(${(t.x - t.r).toFixed(1)}px, ${(t.y - t.r).toFixed(1)}px, 0) rotate(${t.rot.toFixed(1)}deg)`;
      }
    }

    function local(e) {
      const rect = box.getBoundingClientRect();
      return { x: e.clientX - rect.left - box.clientLeft, y: e.clientY - rect.top - box.clientTop };
    }

    toys.forEach((t) => {
      t.el.addEventListener("pointerdown", (e) => {
        if (isTextbook()) return;
        e.preventDefault();
        const p = local(e);
        t.drag = { id: e.pointerId, ox: p.x - t.x, oy: p.y - t.y, lt: performance.now() };
        t.vx = 0;
        t.vy = 0;
        t.el.style.zIndex = String(++zTop);
        t.el.classList.add("is-dragging");
        t.el.setPointerCapture(e.pointerId);
        start();
      });

      t.el.addEventListener("pointermove", (e) => {
        if (!t.drag || t.drag.id !== e.pointerId) return;
        const p = local(e);
        const now = performance.now();
        const dt = Math.max(now - t.drag.lt, 1);
        const nx = clamp(p.x - t.drag.ox, t.r, W - t.r);
        const ny = clamp(p.y - t.drag.oy, t.r, H - t.r);
        t.vx = t.vx * 0.4 + ((nx - t.x) / dt) * 0.6;
        t.vy = t.vy * 0.4 + ((ny - t.y) / dt) * 0.6;
        t.x = nx;
        t.y = ny;
        t.drag.lt = now;
      });

      const release = (e) => {
        if (!t.drag || t.drag.id !== e.pointerId) return;
        const idle = performance.now() - t.drag.lt;
        t.drag = null;
        t.el.classList.remove("is-dragging");
        if (reducedMotion() || idle > 90) {
          t.vx = 0;
          t.vy = 0;
        } else {
          const speed = Math.hypot(t.vx, t.vy);
          const max = 2.4;
          if (speed > max) { t.vx *= max / speed; t.vy *= max / speed; }
        }
      };
      t.el.addEventListener("pointerup", release);
      t.el.addEventListener("pointercancel", release);
    });

    let raf = 0;
    let last = 0;
    let running = false;
    let visible = false;

    function step(now) {
      const dt = Math.min(now - last || 16, 34);
      last = now;
      const calm = reducedMotion();

      for (const t of toys) {
        if (t.drag) continue;
        if (!calm && Math.hypot(t.vx, t.vy) < 0.02) {
          t.vx += (Math.random() - 0.5) * 0.006;
          t.vy += (Math.random() - 0.5) * 0.006;
        }
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        const friction = Math.pow(0.9988, dt);
        t.vx *= friction;
        t.vy *= friction;

        if (t.x < t.r) { t.x = t.r; t.vx = Math.abs(t.vx) * 0.8; }
        else if (t.x > W - t.r) { t.x = W - t.r; t.vx = -Math.abs(t.vx) * 0.8; }
        if (t.y < t.r) { t.y = t.r; t.vy = Math.abs(t.vy) * 0.8; }
        else if (t.y > H - t.r) { t.y = H - t.r; t.vy = -Math.abs(t.vy) * 0.8; }
      }

      for (let i = 0; i < toys.length; i++) {
        for (let j = i + 1; j < toys.length; j++) {
          const a = toys[i];
          const b = toys[j];
          if (a.drag && b.drag) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const min = (a.r + b.r) * 0.88;
          const d2 = dx * dx + dy * dy;
          if (d2 >= min * min || d2 === 0) continue;

          const d = Math.sqrt(d2);
          const nx = dx / d;
          const ny = dy / d;
          const overlap = min - d;
          const aw = a.drag ? 0 : b.drag ? 1 : 0.5;
          const bw = 1 - aw;
          a.x -= nx * overlap * aw;
          a.y -= ny * overlap * aw;
          b.x += nx * overlap * bw;
          b.y += ny * overlap * bw;

          const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rv < 0) {
            const e = 0.85;
            if (a.drag) {
              const J = -(1 + e) * rv;
              b.vx += J * nx; b.vy += J * ny;
            } else if (b.drag) {
              const J = -(1 + e) * rv;
              a.vx -= J * nx; a.vy -= J * ny;
            } else {
              const J = (-(1 + e) * rv) / 2;
              a.vx -= J * nx; a.vy -= J * ny;
              b.vx += J * nx; b.vy += J * ny;
            }
          }
        }
      }

      for (const t of toys) {
        const speed = Math.hypot(t.vx, t.vy);
        if (!t.drag && speed > 2.6) { t.vx *= 2.6 / speed; t.vy *= 2.6 / speed; }
        t.rot += t.vx * dt * 0.22;
      }

      render();
      if (running) raf = requestAnimationFrame(step);
    }

    function start() {
      if (running || isTextbook()) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(step);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    render();

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start(); else stop();
      }).observe(box);
    } else {
      visible = true;
      start();
    }

    if ("ResizeObserver" in window) {
      new ResizeObserver(() => { measure(); render(); }).observe(box);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop(); else if (visible) start();
    });
    document.addEventListener("textbookchange", (e) => {
      if (e.detail) stop(); else if (visible) start();
    });
  }

  /* ---------- Flip cards ---------- */
  const flipCards = $$(".flip");
  const flipAll = $("#flip-all");

  function syncFlipAll() {
    if (!flipAll) return;
    const allOn = flipCards.every((c) => c.getAttribute("aria-pressed") === "true");
    flipAll.textContent = allOn ? "Back to the textbook" : "Make them all playful";
  }

  flipCards.forEach((card) => card.addEventListener("click", () => {
    if (isTextbook()) return;
    card.setAttribute("aria-pressed", String(card.getAttribute("aria-pressed") !== "true"));
    syncFlipAll();
  }));

  if (flipAll) {
    flipAll.addEventListener("click", () => {
      const allOn = flipCards.every((c) => c.getAttribute("aria-pressed") === "true");
      flipCards.forEach((card, i) => {
        setTimeout(() => card.setAttribute("aria-pressed", String(!allOn)), reducedMotion() ? 0 : i * 110);
      });
      flipAll.textContent = allOn ? "Make them all playful" : "Back to the textbook";
    });
  }

  /* ---------- Tabs ---------- */
  function initTabs(tablist) {
    const tabs = $$('[role="tab"]', tablist);

    function select(tab, focus) {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab, false));
      tab.addEventListener("keydown", (e) => {
        let next = null;
        if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = tabs.length - 1;
        if (next !== null) {
          e.preventDefault();
          select(tabs[next], true);
        }
      });
    });
  }

  $$('[role="tablist"]').forEach(initTabs);

  /* ---------- Myth or Fact ---------- */
  const MYTHS = [
    {
      s: "Kids learn best by sitting still and listening quietly.",
      a: "myth",
      e: "Across 225 studies, students in lecture-only classes were 1.5× more likely to fail than students in classes with active learning.",
      src: "Freeman et al., 2014 · PNAS (university science & maths courses)",
    },
    {
      s: "Re-reading your notes is the best way to remember them.",
      a: "myth",
      e: "Practising recall beats re-reading. A week later, students who had tested themselves remembered 61% of a text vs. 40% for those who re-read it.",
      src: "Roediger & Karpicke, 2006 · Psychological Science",
    },
    {
      s: "About an hour of playing a simple number board game can boost preschoolers’ maths skills.",
      a: "fact",
      e: "Preschoolers who played a 1–10 board game in four 15–20-minute sessions got better at counting, reading, comparing and estimating numbers — and kept the gains 9 weeks later.",
      src: "Ramani & Siegler, 2008 · Child Development",
    },
    {
      s: "When an adult shows a child exactly how a new toy works, the child tends to explore it less.",
      a: "fact",
      e: "Preschoolers who were taught one function of a toy explored more narrowly and discovered fewer of its other hidden functions than children who weren’t taught.",
      src: "Bonawitz et al., 2011 · Cognition",
    },
    {
      s: "Play is just a break from learning — it doesn’t teach anything real.",
      a: "myth",
      e: "In a 2022 meta-analysis, guided play had a bigger positive effect than direct instruction on early maths skills, shape knowledge and task switching.",
      src: "Skene et al., 2022 · Child Development",
    },
    {
      s: "Learning games can help people learn and remember more than conventional lessons.",
      a: "fact",
      e: "A meta-analysis of serious games found more learning and better retention than conventional instruction — especially with several sessions, group play and extra teaching.",
      src: "Wouters et al., 2013 · Journal of Educational Psychology",
    },
    {
      s: "Free play with no adult involvement is always the best way to learn school subjects.",
      a: "myth",
      e: "For academic skills, guided play — a playful activity with a learning goal and a supportive adult — tends to beat free play and match or beat direct instruction.",
      src: "Fisher et al., 2013 · Zosh et al., 2018",
    },
    {
      s: "The “learning pyramid” (we remember 10% of what we read and 90% of what we teach) comes from solid research.",
      a: "myth",
      e: "Those tidy percentages are everywhere, but researchers who tried to trace them never found a study behind them. The evidence for active, playful learning is far stronger.",
      src: "A popular education myth",
    },
    {
      s: "Pediatricians have been advised to “prescribe” play.",
      a: "fact",
      e: "The American Academy of Pediatrics encourages a “prescription for play” at well-child visits: “Play is not frivolous: it enhances brain structure and function.”",
      src: "Yogman et al., 2018 · Pediatrics",
    },
    {
      s: "Every child has a right to play under international law.",
      a: "fact",
      e: "Article 31 of the UN Convention on the Rights of the Child recognises every child’s right to rest, leisure, play and recreational activities.",
      src: "UN Convention on the Rights of the Child, Article 31",
    },
  ];

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pop(el) {
    el.classList.remove("is-pop");
    void el.offsetWidth;
    el.classList.add("is-pop");
  }

  function initMythFact() {
    if (!$("#mf")) return;
    const game = $("#mf-game");
    const card = $("#mf-card");
    const statement = $("#mf-statement");
    const answerBox = $("#mf-answer");
    const verdict = $("#mf-verdict");
    const explain = $("#mf-explain");
    const source = $("#mf-source");
    const actions = $("#mf-actions");
    const next = $("#mf-next");
    const bar = $("#mf-bar");
    const count = $("#mf-count");
    const scoreEl = $("#mf-score");
    const streakEl = $("#mf-streak");
    const live = $("#mf-live");
    const end = $("#mf-end");
    const endScore = $("#mf-end-score");
    const endText = $("#mf-end-text");
    const restart = $("#mf-restart");
    const answerButtons = $$("[data-answer]", actions);

    let deck = [];
    let idx = 0;
    let score = 0;
    let streak = 0;
    let best = 0;
    let answered = false;

    function render(focus) {
      const q = deck[idx];
      answered = false;
      card.classList.remove("is-correct", "is-wrong");
      statement.textContent = q.s;
      answerBox.hidden = true;
      actions.hidden = false;
      next.hidden = true;
      count.textContent = `${idx + 1} / ${deck.length}`;
      bar.style.width = `${(idx / deck.length) * 100}%`;
      pop(card);
      if (focus) answerButtons[0].focus({ preventScroll: true });
    }

    function answer(choice) {
      if (answered) return;
      answered = true;
      const q = deck[idx];
      const ok = choice === q.a;
      if (ok) {
        score++;
        streak++;
        best = Math.max(best, streak);
      } else {
        streak = 0;
      }

      card.classList.add(ok ? "is-correct" : "is-wrong");
      verdict.textContent = ok
        ? `Correct — it’s a ${q.a}! ${streak >= 3 ? "🔥" : "🎉"}`
        : `Not quite — it’s actually a ${q.a}.`;
      explain.textContent = q.e;
      source.textContent = q.src;
      answerBox.hidden = false;
      actions.hidden = true;
      next.hidden = false;
      next.textContent = idx === deck.length - 1 ? "See my score →" : "Next →";
      next.focus({ preventScroll: true });

      scoreEl.textContent = String(score);
      streakEl.textContent = `🔥 ${streak}`;
      bar.style.width = `${((idx + 1) / deck.length) * 100}%`;
      live.textContent = `${ok ? "Correct" : "Not quite"}. It’s a ${q.a}. ${q.e}`;
      if (ok && streak > 0 && streak % 3 === 0) confetti(40);
    }

    function finish() {
      game.hidden = true;
      end.hidden = false;
      endScore.textContent = `${score} / ${deck.length}`;
      const cheer = score >= 9 ? "Learning legend!" : score >= 7 ? "Brilliant!" : score >= 5 ? "Nice work!" : "Great start!";
      endText.innerHTML = `${cheer} Best streak: ${best}.<br>Here’s the twist: by guessing and getting instant feedback, you just used <strong>retrieval practice</strong> — one of the strongest memory boosters known. Check tomorrow how much you still remember.`;
      if (score >= 6) confetti();
      restart.focus({ preventScroll: true });
    }

    function startGame(focus) {
      deck = shuffle(MYTHS);
      idx = 0;
      score = 0;
      streak = 0;
      best = 0;
      scoreEl.textContent = "0";
      streakEl.textContent = "🔥 0";
      game.hidden = false;
      end.hidden = true;
      render(focus);
    }

    answerButtons.forEach((btn) => btn.addEventListener("click", () => answer(btn.dataset.answer)));
    next.addEventListener("click", () => {
      if (idx < deck.length - 1) {
        idx++;
        render(true);
      } else {
        finish();
      }
    });
    restart.addEventListener("click", () => startGame(true));
    startGame(false);
  }

  /* ---------- The Number Race ---------- */
  function initRace() {
    if (!$("#race")) return;
    const spinBtn = $("#race-spin");
    const resetBtn = $("#race-reset");
    const status = $("#race-status");
    const needle = $("#spinner-needle");
    const bubble = $("#race-bubble");
    const counter = $("#race-count");
    const voice = $("#race-voice");
    const cells = $$(".race__cell");
    const players = [
      { name: "You", el: $("#token-you"), pos: 0 },
      { name: "Buddy", el: $("#token-buddy"), pos: 0 },
    ];

    let turn = 0;
    let angle = 0;
    let said = 0;
    let over = false;
    let busy = false;
    let gen = 0;

    const place = (p) => p.el.style.setProperty("--i", String(p.pos));

    function hop(el) {
      el.classList.remove("is-hop");
      void el.offsetWidth;
      el.classList.add("is-hop");
    }

    function light(i) {
      cells.forEach((c, k) => c.classList.toggle("is-lit", k === i));
    }

    function speak(text) {
      if (!voice.checked || !("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.05;
      u.pitch = 1.2;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }

    async function spin() {
      const result = Math.random() < 0.5 ? 1 : 2;
      const landing = result === 1 ? 25 + Math.random() * 130 : 205 + Math.random() * 130;
      const current = ((angle % 360) + 360) % 360;
      let delta = landing - current;
      if (delta < 0) delta += 360;
      angle += 720 + delta;
      needle.style.setProperty("--a", `${angle}deg`);
      await wait(reducedMotion() ? 80 : 1250);
      return result;
    }

    async function move(p, steps, g) {
      const spoken = [];
      for (let s = 0; s < steps && p.pos < 10; s++) {
        if (g !== gen) return spoken;
        p.pos++;
        spoken.push(p.pos);
        place(p);
        hop(p.el);
        light(p.pos);
        bubble.style.setProperty("--i", String(p.pos));
        bubble.textContent = `${p.pos}!`;
        bubble.classList.add("is-on");
        speak(String(p.pos));
        said++;
        counter.textContent = String(said);
        await wait(reducedMotion() ? 200 : 560);
      }
      bubble.classList.remove("is-on");
      return spoken;
    }

    async function takeTurn() {
      if (busy || over) return;
      const g = gen;
      busy = true;
      spinBtn.disabled = true;
      const p = players[turn];
      const who = p.name === "You" ? "You" : "Buddy";

      status.textContent = `${who === "You" ? "You spin" : "Buddy spins"}…`;
      const n = await spin();
      if (g !== gen) return;
      status.textContent = `${who} spun a ${n}! Count out loud…`;
      const nums = await move(p, n, g);
      if (g !== gen) return;

      if (p.pos >= 10) {
        over = true;
        busy = false;
        light(-1);
        status.textContent = who === "You" ? "You reached 10 first — you win! 🎉" : "Buddy reached 10 first! Rematch?";
        if (who === "You") confetti();
        return;
      }

      turn = 1 - turn;
      if (turn === 1) {
        status.textContent = `You said “${nums.join(", ")}”. Buddy’s turn…`;
        await wait(reducedMotion() ? 300 : 900);
        if (g !== gen) return;
        busy = false;
        takeTurn();
        return;
      }

      status.textContent = `Buddy said “${nums.join(", ")}”. Your turn — spin!`;
      busy = false;
      spinBtn.disabled = false;
    }

    function reset() {
      gen++;
      busy = false;
      over = false;
      turn = 0;
      said = 0;
      players.forEach((p) => { p.pos = 0; place(p); });
      counter.textContent = "0";
      light(-1);
      bubble.classList.remove("is-on");
      status.textContent = "Your turn — spin the spinner!";
      spinBtn.disabled = false;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    }

    spinBtn.addEventListener("click", takeTurn);
    resetBtn.addEventListener("click", reset);
    if (!("speechSynthesis" in window)) voice.closest(".switch").hidden = true;
  }

  /* ---------- Playful-o-meter ---------- */
  const INGREDIENTS = [
    { key: "joyful", name: "Joyful", icon: "😄", color: "var(--sun)" },
    { key: "active", name: "Actively engaging", icon: "🧠", color: "var(--coral)" },
    { key: "meaningful", name: "Meaningful", icon: "🔗", color: "var(--mint)" },
    { key: "iterative", name: "Iterative", icon: "🔁", color: "var(--sky)" },
    { key: "social", name: "Socially interactive", icon: "🤝", color: "var(--grape)" },
  ];

  const ACTIVITIES = [
    {
      name: "Copying 50 sums from the board",
      r: {
        joyful: [0, "Repetitive, no surprises"],
        active: [0, "Hands busy, mind on autopilot"],
        meaningful: [0, "Disconnected from real life"],
        iterative: [0, "No room to test ideas"],
        social: [0, "Done alone, in silence"],
      },
      tip: "Quick fix: roll two dice and race a friend to add them. Same sums, three more ingredients.",
    },
    {
      name: "Watching a video lesson alone",
      r: {
        joyful: [1, "Can be entertaining"],
        active: [0, "Mostly sitting and watching"],
        meaningful: [0, "Often abstract"],
        iterative: [0, "No trying, no feedback"],
        social: [0, "Solo screen time"],
      },
      tip: "Quick fix: pause and predict what happens next, then talk it over together.",
    },
    {
      name: "Flashcard drills",
      r: {
        joyful: [0, "Can feel like a chore"],
        active: [1, "Recalling answers is real mental work"],
        meaningful: [0, "Facts without context"],
        iterative: [1, "Practice until it sticks"],
        social: [0, "Usually done solo"],
      },
      tip: "Quick fix: turn the cards into a quiz show with a friend and watch the score jump.",
    },
    {
      name: "Spelling treasure hunt in teams",
      r: {
        joyful: [1, "A race is exciting"],
        active: [1, "Hunting, building, spelling"],
        meaningful: [0, "Words still come from a list"],
        iterative: [1, "Wrong word? Rebuild it"],
        social: [1, "Teammates help and argue"],
      },
      tip: "Quick fix: let kids pick words from their favourite topic to make it meaningful.",
    },
    {
      name: "Running a pretend shop with real coins",
      r: {
        joyful: [1, "Role-play is fun"],
        active: [1, "Every sale is a calculation"],
        meaningful: [1, "Money is real life"],
        iterative: [1, "Wrong change? Count again"],
        social: [1, "Shoppers and shopkeepers negotiate"],
      },
      tip: "",
    },
    {
      name: "Building a marble run with friends",
      r: {
        joyful: [1, "Clattering marbles = delight"],
        active: [1, "Design, build, test"],
        meaningful: [1, "Physics you can see"],
        iterative: [1, "Tweak the ramps, try again"],
        social: [1, "Engineers share ideas"],
      },
      tip: "",
    },
  ];

  const LABELS = ["Snooze-fest 😴", "Barely playful", "Getting there", "Pretty playful", "Super playful", "Pure playful learning! 🎉"];

  function initMeter() {
    const chips = $("#meter-chips");
    if (!chips) return;
    const list = $("#meter-list");
    const needle = $("#gauge-needle");
    const scoreEl = $("#meter-score");
    const labelEl = $("#meter-label");
    const tipEl = $("#meter-tip");

    const items = INGREDIENTS.map((ing) => {
      const li = document.createElement("li");
      li.className = "meter__item";
      li.style.setProperty("--c", ing.color);
      li.innerHTML = `<span class="meter__dot" aria-hidden="true">${ing.icon}</span><span><strong>${ing.name}</strong><small></small></span><span class="meter__check" aria-hidden="true"></span>`;
      list.appendChild(li);
      return { ing, li, why: $("small", li), check: $(".meter__check", li) };
    });

    const buttons = ACTIVITIES.map((act, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = act.name;
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", () => select(i));
      chips.appendChild(btn);
      return btn;
    });

    function select(i) {
      const act = ACTIVITIES[i];
      let score = 0;
      buttons.forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
      items.forEach(({ ing, li, why, check }) => {
        const [on, reason] = act.r[ing.key];
        score += on;
        li.classList.toggle("is-on", Boolean(on));
        why.textContent = reason;
        check.textContent = on ? "✓" : "✕";
      });
      needle.style.setProperty("--a", `${-90 + score * 36}deg`);
      scoreEl.textContent = String(score);
      labelEl.textContent = LABELS[score];
      tipEl.textContent = act.tip;
      if (score === 5) confetti(36);
    }

    select(0);
  }

  /* ---------- Play spectrum ---------- */
  const SPECTRUM = [
    {
      name: "Free play",
      badge: "Best for creativity & social skills",
      color: "var(--mint)",
      starts: "The child",
      leads: "The child",
      goal: "No — just for fun",
      example: "Building whatever they imagine with blocks, or inventing a brand-new game in the garden.",
      best: "Creativity, social and emotional skills, self-regulation — and pure joy. It matters, even when no lesson is planned.",
    },
    {
      name: "Guided play",
      badge: "Learning sweet spot",
      color: "var(--sky)",
      starts: "An adult",
      leads: "The child",
      goal: "Yes",
      example: "An adult sets out a pile of shapes and asks: “What makes a triangle a triangle?” Children explore and discover the rules themselves.",
      best: "School skills like maths, shapes and language. Research finds it can match or beat direct instruction — while keeping the fun.",
    },
    {
      name: "Games",
      badge: "Learning sweet spot",
      color: "var(--grape)",
      starts: "An adult or a game designer",
      leads: "The child, within the rules",
      goal: "Yes",
      example: "A numbered board game where children count every hop out loud.",
      best: "Practice with instant feedback. The rules give structure; the game keeps everyone coming back.",
    },
    {
      name: "Playful instruction",
      badge: "Better than a plain lecture",
      color: "var(--orange)",
      starts: "An adult",
      leads: "Mostly the adult",
      goal: "Yes",
      example: "A teacher-led lesson sprinkled with a song, a story and a quick quiz game.",
      best: "Keeping attention during teacher-led moments — a spoonful of play helps the lesson go down.",
    },
    {
      name: "Direct instruction",
      badge: "Use in small doses",
      color: "var(--coral)",
      starts: "An adult",
      leads: "The adult",
      goal: "Yes",
      example: "The teacher explains, children listen, then practise on a worksheet.",
      best: "Passing on specific facts quickly. But it can narrow children’s exploration, so balance it with active, playful learning.",
    },
  ];

  function initSpectrum() {
    const range = $("#spectrum-range");
    if (!range) return;
    const card = $("#spectrum-card");
    const stops = $$(".spectrum__stop");
    const field = (id) => $(`#spectrum-${id}`);

    function update(i) {
      const d = SPECTRUM[i];
      range.value = String(i);
      range.setAttribute("aria-valuetext", d.name);
      field("name").textContent = d.name;
      field("badge").textContent = d.badge;
      field("starts").textContent = d.starts;
      field("leads").textContent = d.leads;
      field("goal").textContent = d.goal;
      field("example").textContent = d.example;
      field("best").textContent = d.best;
      card.style.setProperty("--c", d.color);
      stops.forEach((s, k) => s.classList.toggle("is-active", k === i));
    }

    range.addEventListener("input", () => update(Number(range.value)));
    stops.forEach((stop) => stop.addEventListener("click", () => update(Number(stop.dataset.stop))));
    update(Number(range.value));
  }

  /* ---------- Share & footer ---------- */
  const shareBtn = $("#share-btn");
  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      const data = {
        title: document.title,
        text: "Kids learn best through play — here’s the science (and some games).",
        url: window.location.href,
      };
      try {
        if (navigator.share) {
          await navigator.share(data);
          return;
        }
        await navigator.clipboard.writeText(window.location.href);
        toast("Link copied — go spread some play! 🔗");
      } catch (err) {
        if (!err || err.name !== "AbortError") toast("Couldn’t share automatically — copy the link from the address bar.");
      }
    });
  }

  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  initPlayground();
  initMythFact();
  initRace();
  initMeter();
  initSpectrum();
})();
