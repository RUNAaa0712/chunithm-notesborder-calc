/**
 * CHUNITHM Score Border Calculator
 * Refactored Version
 */

// --- Configuration & Constants ---
const CONFIG = {
  API_URL:
    "https://runaaa0712.weblike.jp/api/v1/chunithm/music/get_const_data.php",
  SCORE_GOALS: [
    { score: 1009990, type: "redJ" }, // SSS+
    { score: 1009950, type: "redJ" },
    { score: 1009900, type: "redJ" }, // SSS
    { score: 1009000, type: "atk" }, // SS+
    { score: 1007500, type: "atk" }, // SS
    { score: 1000000, type: "atk" }, // S
  ],
  COEFF: {
    JC: 1.01,
    RED_J: 1.0,
    ATK: 0.5,
    MISS: 0.0,
  },
};

// --- State Management ---
const state = {
  songs: [], // Fetched song list
  sortAsc: true, // Sort order
  searchTerm: "", // Current search keyword
  totalNotes: 2000, // Current total notes
};

// --- DOM Elements Cache ---
const DOM = {
  inputs: {
    notes: document.getElementById("notes"),
    redJ: document.getElementById("redJ"),
    atk: document.getElementById("atk"),
    miss: document.getElementById("miss"),
    search: document.getElementById("songSearch"),
  },
  display: {
    borders: document.getElementById("borders"),
    loss: {
      redJ: document.getElementById("redJusticeLoss"),
      atk: document.getElementById("attackLoss"),
      miss: document.getElementById("missLoss"),
    },
    count: {
      redJ: document.getElementById("redJusticeCount"),
      atk: document.getElementById("attackCount"),
      miss: document.getElementById("missCount"),
    },
    total: {
      redJ: document.getElementById("redJusticeTotal"),
      atk: document.getElementById("attackTotal"),
      miss: document.getElementById("missTotal"),
    },
    result: {
      jc: document.getElementById("jcCountSpan"),
      redJ: document.getElementById("redJSpan"),
      atk: document.getElementById("atkSpan"),
      miss: document.getElementById("missSpan"),
      score: document.getElementById("scoreSpan"),
    },
  },
  modal: {
    self: document.getElementById("songModal"),
    openBtn: document.getElementById("openModal"),
    closeBtn: document.getElementById("closeModal"),
    overlay: document.getElementById("modalOverlay"),
    list: document.getElementById("songList"),
    sortBtn: document.getElementById("sortBtn"),
  },
};

// --- Core Logic: Score Calculation ---

/**
 * Calculate current score based on note counts
 */
function calculateScore(base, redJ, atk, miss, totalNotes) {
  const jc = totalNotes - redJ - atk - miss;
  if (jc < 0) return 0;
  return Math.floor(
    base * CONFIG.COEFF.JC * jc +
      base * CONFIG.COEFF.RED_J * redJ +
      base * CONFIG.COEFF.ATK * atk
  );
}

/**
 * Find max allowed errors for a specific goal score
 */
function findMaxAllowed(goal, base, type, totalNotes) {
  // Binary search or linear scan. Given small ranges, linear scan is fast enough.
  // We assume other errors are 0.
  for (let i = 0; i <= totalNotes; i++) {
    let redJ = 0,
      atk = 0,
      miss = 0;
    if (type === "redJ") redJ = i;
    else if (type === "atk") atk = i;
    else if (type === "miss") miss = i;

    const score = calculateScore(base, redJ, atk, miss, totalNotes);
    if (score < goal) return i - 1;
  }
  return totalNotes;
}

// --- UI Logic: Updates & Animations ---

function animateText(el, newText) {
  if (el.textContent === String(newText)) return; // Avoid unnecessary redraw
  el.classList.add("fade-hidden");
  setTimeout(() => {
    el.textContent = newText;
    el.classList.remove("fade-hidden");
    el.classList.add("highlight");
    setTimeout(() => el.classList.remove("highlight"), 500);
  }, 50);
}

function animateScoreNumber(el, from, to) {
  if (from === to) return;
  const duration = 400;
  const startTime = performance.now();
  function update(time) {
    const progress = Math.min((time - startTime) / duration, 1);
    const current = Math.floor(from + (to - from) * progress);
    el.textContent = current;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function updateSimulation() {
  const notesVal = DOM.inputs.notes.value.trim();
  if (!notesVal || Number(notesVal) < 1) return;

  state.totalNotes = Number(notesVal);
  const redJ = Number(DOM.inputs.redJ.value) || 0;
  const atk = Number(DOM.inputs.atk.value) || 0;
  const miss = Number(DOM.inputs.miss.value) || 0;

  // Calculate Base Score (Theoretical max is 1,010,000)
  const base = 1000000 / state.totalNotes;

  // Calculate Loss per item
  const lossRedJ = base * (CONFIG.COEFF.JC - CONFIG.COEFF.RED_J); // 1.01 - 1.0 = 0.01
  const lossAtk = base * (CONFIG.COEFF.JC - CONFIG.COEFF.ATK); // 1.01 - 0.5 = 0.51
  const lossMiss = base * (CONFIG.COEFF.JC - CONFIG.COEFF.MISS); // 1.01 - 0.0 = 1.01

  // Update Loss Info
  animateText(DOM.display.loss.redJ, lossRedJ.toFixed(2));
  animateText(DOM.display.loss.atk, lossAtk.toFixed(2));
  animateText(DOM.display.loss.miss, lossMiss.toFixed(2));

  animateText(DOM.display.count.redJ, redJ);
  animateText(DOM.display.count.atk, atk);
  animateText(DOM.display.count.miss, miss);

  animateText(DOM.display.total.redJ, Math.floor(lossRedJ * redJ));
  animateText(DOM.display.total.atk, Math.floor(lossAtk * atk));
  animateText(DOM.display.total.miss, Math.floor(lossMiss * miss));

  // Update Result
  const jcCount = state.totalNotes - redJ - atk - miss;
  const score = calculateScore(base, redJ, atk, miss, state.totalNotes);

  animateText(DOM.display.result.jc, jcCount >= 0 ? jcCount : 0);
  animateText(DOM.display.result.redJ, redJ);
  animateText(DOM.display.result.atk, atk);
  animateText(DOM.display.result.miss, miss);

  const currentScoreDisplay = Number(DOM.display.result.score.textContent) || 0;
  animateScoreNumber(DOM.display.result.score, currentScoreDisplay, score);

  // Update Borders List
  DOM.display.borders.innerHTML = "";
  const frag = document.createDocumentFragment();

  CONFIG.SCORE_GOALS.forEach((goal) => {
    const maxAllowed = findMaxAllowed(
      goal.score,
      base,
      goal.type,
      state.totalNotes
    );
    const p = document.createElement("p");
    const label = goal.type === "redJ" ? "赤J" : "ATK";
    const cssClass = goal.type === "redJ" ? "red" : "green";

    p.innerHTML = `<strong>${goal.score}</strong> : <span class="${cssClass}">${label} ${maxAllowed}個以内</span>`;
    frag.appendChild(p);
  });
  DOM.display.borders.appendChild(frag);
}

// --- Data Fetching & Modal Logic ---

async function fetchSongData() {
  try {
    DOM.modal.list.innerHTML =
      '<li class="loading-text">データを取得中...</li>';

    const response = await fetch(CONFIG.API_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();

    // Process and flatten the data
    // API structure: [ { title: "Name", difficulties: [ { level: "MASTER", notes: 1000, const: 14.0 }, ... ] }, ... ]
    state.songs = data.flatMap((song) => {
      // Filter out difficulties with 0 notes if any
      return song.difficulties
        .filter((d) => d.notes > 0)
        .map((diff) => ({
          title: String(song.title), // Ensure title is string
          difficulty: diff.level, // e.g. "MASTER"
          levelConst: diff.const, // e.g. 14.0
          notes: diff.notes, // e.g. 2000
        }));
    });

    renderSongList();
  } catch (error) {
    console.error("Fetch error:", error);
    DOM.modal.list.innerHTML =
      '<li style="color:red;">データの取得に失敗しました。<br>再読み込みしてください。</li>';
  }
}

function renderSongList() {
  const keyword = state.searchTerm.toLowerCase();

  // Filter and Sort
  const filtered = state.songs.filter((item) =>
    item.title.toLowerCase().includes(keyword)
  );

  filtered.sort((a, b) => {
    const res = a.title.localeCompare(b.title, "ja");
    return state.sortAsc ? res : -res;
  });

  // Render
  DOM.modal.list.innerHTML = "";
  const frag = document.createDocumentFragment();

  // Limit rendering for performance if list is huge (optional optimization)
  const displayList = filtered.slice(0, 200);

  displayList.forEach((song) => {
    const li = document.createElement("li");

    const diffClass = `diff-${song.difficulty}`;

    li.innerHTML = `
      <div class="song-info">
        <span class="song-title">${song.title}</span>
        <span class="song-meta">
           Lv.${song.levelConst.toFixed(1)} / Note: ${song.notes}
        </span>
      </div>
      <span class="diff-tag ${diffClass}">${song.difficulty}</span>
    `;

    li.addEventListener("click", () => {
      DOM.inputs.notes.value = song.notes;
      DOM.modal.self.style.display = "none";
      updateSimulation();
    });

    frag.appendChild(li);
  });

  if (filtered.length === 0) {
    const li = document.createElement("li");
    li.textContent = "該当する楽曲が見つかりません";
    frag.appendChild(li);
  }

  DOM.modal.list.appendChild(frag);
}

// --- Event Listeners ---

function setupEventListeners() {
  // Inputs
  Object.values(DOM.inputs).forEach((input) => {
    if (input !== DOM.inputs.search) {
      input.addEventListener("input", updateSimulation);
    }
  });

  // Modal Controls
  DOM.modal.openBtn.addEventListener("click", () => {
    DOM.modal.self.style.display = "flex";
    DOM.inputs.search.value = "";
    state.searchTerm = "";

    // Fetch data only if not already fetched
    if (state.songs.length === 0) {
      fetchSongData();
    } else {
      renderSongList();
    }
  });

  const closeModal = () => (DOM.modal.self.style.display = "none");
  DOM.modal.closeBtn.addEventListener("click", closeModal);
  DOM.modal.overlay.addEventListener("click", closeModal);

  DOM.inputs.search.addEventListener("input", (e) => {
    state.searchTerm = e.target.value.trim();
    renderSongList();
  });

  DOM.modal.sortBtn.addEventListener("click", () => {
    state.sortAsc = !state.sortAsc;
    DOM.modal.sortBtn.textContent = state.sortAsc
      ? "曲名で昇順ソート"
      : "曲名で降順ソート";
    renderSongList();
  });
}

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  updateSimulation();
});
