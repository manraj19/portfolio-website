document.documentElement.classList.replace("no-js", "js");

const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/* Hamburger */
function toggleMenu() {
  document.querySelector(".menu-links").classList.toggle("open");
  document.querySelector(".hamburger-icon").classList.toggle("open");
}

/* Scroll progress + sticky header */
const progressBar = document.querySelector(".progress");
const header = document.querySelector("header");
window.addEventListener(
  "scroll",
  () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    header.classList.toggle("scrolled", window.scrollY > 10);
  },
  { passive: true }
);

/* Scrollspy */
const navLinks = [...document.querySelectorAll("#desktop-nav .nav-links a")];
const spy = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) =>
        a.classList.toggle(
          "active",
          a.getAttribute("href") === `#${entry.target.id}`
        )
      );
    });
  },
  { rootMargin: "-40% 0px -55% 0px" }
);
document.querySelectorAll("main section[id]").forEach((s) => spy.observe(s));

/* Reveal on scroll, staggered per container */
const groups = new Map();
document.querySelectorAll(".reveal").forEach((el) => {
  const i = groups.get(el.parentElement) || 0;
  groups.set(el.parentElement, i + 1);
  el.style.transitionDelay = `${Math.min(i * 70, 350)}ms`;
});
const revealer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        revealer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => revealer.observe(el));

/* Typewriter */
const typed = document.getElementById("typed");
const phrases = [
  "I build full-stack apps.",
  "I train neural networks.",
  "I run a Discord bot in 900 servers.",
];
if (!reducedMotion && typed) {
  let phrase = 0;
  let pos = phrases[0].length;
  let deleting = true;
  const tick = () => {
    typed.textContent = phrases[phrase].slice(0, pos);
    let delay;
    if (deleting) {
      pos--;
      delay = 28;
      if (pos === 0) {
        deleting = false;
        phrase = (phrase + 1) % phrases.length;
      }
    } else {
      pos++;
      delay = 48;
      if (pos === phrases[phrase].length) {
        deleting = true;
        delay = 2200;
      }
    }
    setTimeout(tick, delay);
  };
  setTimeout(tick, 2200);
}

/* Count-up stats */
const facts = document.querySelector(".hero__facts");
function animateCount(el) {
  const target = parseFloat(el.dataset.count);
  const decimals = +(el.dataset.decimals || 0);
  const suffix = el.dataset.suffix || "";
  const start = performance.now();
  const dur = 900;
  const frame = (now) => {
    const t = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const val = target * eased;
    el.textContent =
      (decimals
        ? val.toFixed(decimals)
        : "plain" in el.dataset
          ? String(Math.round(val))
          : Math.round(val).toLocaleString("en-US")) + suffix;
    if (t < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
if (facts) {
  const counters = facts.querySelectorAll("[data-count]");
  if (reducedMotion) {
    counters.forEach((el) => {
      const v = parseFloat(el.dataset.count);
      el.textContent =
        (el.dataset.decimals
          ? v.toFixed(+el.dataset.decimals)
          : "plain" in el.dataset
            ? String(v)
            : v.toLocaleString("en-US")) + (el.dataset.suffix || "");
    });
  } else {
    const once = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        counters.forEach(animateCount);
        once.disconnect();
      }
    });
    once.observe(facts);
  }
}

/* Magnetic buttons */
if (!reducedMotion && window.matchMedia("(hover: hover)").matches) {
  document.querySelectorAll(".magnet").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 8;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 6;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });
}

/* Skill filter */
const chips = [...document.querySelectorAll("button.chip[data-skill]")];
const taggables = [...document.querySelectorAll("[data-tags]")];
let activeSkill = null;
chips.forEach((chip) => {
  const skill = chip.dataset.skill;
  const hasMatch = taggables.some((t) =>
    t.dataset.tags.split(" ").includes(skill)
  );
  if (!hasMatch) return;
  chip.classList.add("linked");
  chip.setAttribute("aria-pressed", "false");
  chip.addEventListener("click", () => {
    activeSkill = activeSkill === skill ? null : skill;
    chips.forEach((c) => {
      const on = c.dataset.skill === activeSkill;
      c.toggleAttribute("data-active", on);
      if (c.classList.contains("linked"))
        c.setAttribute("aria-pressed", String(on));
    });
    taggables.forEach((t) => {
      const match =
        activeSkill && t.dataset.tags.split(" ").includes(activeSkill);
      t.classList.toggle("dimmed", !!activeSkill && !match);
      t.classList.toggle("matched", !!match);
      if (match && t.tagName === "DETAILS") t.open = true;
    });
  });
});

/* Tic-tac-toe vs minimax bot */
const WINS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];
const cells = [...document.querySelectorAll(".ttt__cell")];
const tttStatus = document.querySelector(".ttt__status");
let board = Array(9).fill(null);
let gameOver = false;
let botThinking = false;

function winnerOf(b) {
  for (const line of WINS)
    if (b[line[0]] && b[line[0]] === b[line[1]] && b[line[0]] === b[line[2]])
      return { mark: b[line[0]], line };
  return b.every(Boolean) ? { mark: "draw", line: null } : null;
}

function minimax(b, player) {
  const w = winnerOf(b);
  if (w) return { score: w.mark === "O" ? 1 : w.mark === "X" ? -1 : 0 };
  let best = null;
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = player;
    const { score } = minimax(b, player === "O" ? "X" : "O");
    b[i] = null;
    if (
      !best ||
      (player === "O" ? score > best.score : score < best.score)
    )
      best = { score, move: i };
  }
  return best;
}

function renderCell(i) {
  const cell = cells[i];
  cell.textContent = board[i] || "";
  cell.classList.toggle("o", board[i] === "O");
  cell.disabled = !!board[i] || gameOver;
  const row = Math.floor(i / 3) + 1;
  const col = (i % 3) + 1;
  cell.setAttribute(
    "aria-label",
    `Row ${row}, column ${col}, ${board[i] || "empty"}`
  );
}

function endGame(result) {
  gameOver = true;
  cells.forEach((c) => (c.disabled = true));
  if (result.mark === "draw") {
    tttStatus.textContent = "Draw. That is the best anyone gets.";
  } else if (result.mark === "O") {
    tttStatus.textContent = "The bot wins. Told you.";
    result.line.forEach((i) => cells[i].classList.add("win"));
  } else {
    tttStatus.textContent = "You win?! Please email me your moves.";
    result.line.forEach((i) => cells[i].classList.add("win"));
  }
}

cells.forEach((cell, i) => {
  cell.addEventListener("click", () => {
    if (board[i] || gameOver || botThinking) return;
    board[i] = "X";
    renderCell(i);
    let result = winnerOf(board);
    if (result) return endGame(result);
    botThinking = true;
    tttStatus.textContent = "Bot is thinking…";
    setTimeout(() => {
      const { move } = minimax(board, "O");
      board[move] = "O";
      renderCell(move);
      botThinking = false;
      result = winnerOf(board);
      if (result) return endGame(result);
      tttStatus.textContent = "Your move. You are X.";
    }, reducedMotion ? 0 : 350);
  });
});

const resetBtn = document.querySelector(".ttt__reset");
if (resetBtn)
  resetBtn.addEventListener("click", () => {
    board = Array(9).fill(null);
    gameOver = false;
    botThinking = false;
    cells.forEach((c, i) => {
      c.classList.remove("win", "o");
      renderCell(i);
    });
    tttStatus.textContent = "Your move. You are X.";
  });

/* Copy email */
const copyBtn = document.querySelector(".copy-email");
const copyStatus = document.querySelector(".copy-email__status");
if (copyBtn)
  copyBtn.addEventListener("click", async () => {
    const email = copyBtn.querySelector(".copy-email__text").textContent;
    try {
      await navigator.clipboard.writeText(email);
      copyStatus.textContent = "copied ✓";
    } catch {
      // ponytail: clipboard API is blocked in some embeds, fall back to execCommand
      const ta = document.createElement("textarea");
      ta.value = email;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      copyStatus.textContent = ok
        ? "copied ✓"
        : "copy failed, it is written right there";
    }
    setTimeout(() => (copyStatus.textContent = ""), 2200);
  });

/* Gesture demo */
const gestureDemo = document.querySelector(".gesture-demo");
if (gestureDemo) {
  const emoji = gestureDemo.querySelector(".gesture-emoji");
  const label = gestureDemo.querySelector(".gesture-label");
  const gestures = [
    ["✋", "detected: open_palm"],
    ["✌️", "detected: peace"],
    ["👍", "detected: thumbs_up"],
    ["👊", "detected: fist"],
    ["🤙", "detected: call_me"],
  ];
  let gi = 0;
  let timer = null;
  const step = () => {
    gi = (gi + 1) % gestures.length;
    emoji.textContent = gestures[gi][0];
    label.textContent = gestures[gi][1];
  };
  const tile = gestureDemo.closest(".tile");
  tile.addEventListener("mouseenter", () => {
    step();
    if (!reducedMotion) timer = setInterval(step, 650);
  });
  tile.addEventListener("mouseleave", () => {
    clearInterval(timer);
    label.textContent = "hover to detect";
  });
}

/* Console banner */
console.log(
  "%cMS",
  "font-family:sans-serif;font-size:42px;font-weight:800;color:#234c63;background:#f6f2ea;padding:6px 14px;border-radius:10px"
);
console.log(
  "Hi, fellow dev. The whole site is vanilla HTML/CSS/JS, view-source friendly.\nHiring? manraj.singh1907@gmail.com"
);

/* Konami confetti */
const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a",
];
let keyBuffer = [];
window.addEventListener("keydown", (e) => {
  keyBuffer.push(e.key);
  keyBuffer = keyBuffer.slice(-KONAMI.length);
  if (keyBuffer.join(",") === KONAMI.join(",")) confetti();
});

function confetti() {
  if (reducedMotion) return;
  const canvas = document.createElement("canvas");
  canvas.className = "confetti";
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const colors = ["#234c63", "#dce7ee", "#182233", "#d8d0c2"];
  const bits = Array.from({ length: 140 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.5,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 8,
    vy: 2.5 + Math.random() * 3.5,
    vx: -1.5 + Math.random() * 3,
    rot: Math.random() * Math.PI,
    vr: -0.1 + Math.random() * 0.2,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
  const start = performance.now();
  const frame = (now) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bits.forEach((b) => {
      b.x += b.vx;
      b.y += b.vy;
      b.rot += b.vr;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.fillStyle = b.color;
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      ctx.restore();
    });
    if (now - start < 3200) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
