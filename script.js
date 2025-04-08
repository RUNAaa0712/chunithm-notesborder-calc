// JavaScript全体
const notesInput = document.getElementById('notes');
const redJInput = document.getElementById('redJ');
const atkInput = document.getElementById('atk');
const missInput = document.getElementById('miss');

const redJusticeLossEl = document.getElementById('redJusticeLoss');
const attackLossEl = document.getElementById('attackLoss');
const missLossEl = document.getElementById('missLoss');

const redJusticeCountEl = document.getElementById('redJusticeCount');
const attackCountEl = document.getElementById('attackCount');
const missCountEl = document.getElementById('missCount');

const redJusticeTotalEl = document.getElementById('redJusticeTotal');
const attackTotalEl = document.getElementById('attackTotal');
const missTotalEl = document.getElementById('missTotal');

const bordersEl = document.getElementById('borders');

const jcCountSpan = document.getElementById('jcCountSpan');
const redJSpan = document.getElementById('redJSpan');
const atkSpan = document.getElementById('atkSpan');
const missSpan = document.getElementById('missSpan');
const scoreSpan = document.getElementById('scoreSpan');

const scoreGoals = [
  { score: 1009990, type: 'redJ' },
  { score: 1009950, type: 'redJ' },
  { score: 1009900, type: 'redJ' },
  { score: 1009000, type: 'atk' },
  { score: 1007500, type: 'atk' },
  { score: 1000000, type: 'atk' }
];

function animateChange(el, newText) {
  el.classList.add('fade-hidden');
  setTimeout(() => {
    el.textContent = newText;
    el.classList.remove('fade-hidden');
    el.classList.add('highlight');
    setTimeout(() => el.classList.remove('highlight'), 500);
  }, 100);
}

function animateScore(el, from, to) {
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

function calculateScore(base, redJ, atk, miss, totalNotes) {
  const jc = totalNotes - redJ - atk - miss;
  return Math.floor(base * 1.01 * jc + base * redJ + base * 0.5 * atk);
}

function findMaxAllowed(goal, base, type, totalNotes) {
  for (let i = 0; i <= totalNotes; i++) {
    let redJ = 0, atk = 0, miss = 0;
    if (type === 'redJ') redJ = i;
    else if (type === 'atk') atk = i;
    const score = calculateScore(base, redJ, atk, miss, totalNotes);
    if (score < goal) return i - 1;
  }
  return totalNotes;
}

function updateScore() {
  const totalNotesRaw = notesInput.value.trim();
  if (totalNotesRaw === '' || isNaN(totalNotesRaw) || Number(totalNotesRaw) < 1) return;

  const totalNotes = Number(totalNotesRaw);
  const redJ = Number(redJInput.value);
  const atk = Number(atkInput.value);
  const miss = Number(missInput.value);

  const base = 1000000 / totalNotes;

  const redTotal = Math.floor(base * 1.01 * redJ - base * redJ);
  const atkTotal = Math.floor(base * 1.01 * atk - base * 0.5 * atk);
  const missTotal = Math.floor(base * 1.01 * miss);

  animateChange(redJusticeLossEl, (base * 0.01).toFixed(1));
  animateChange(attackLossEl, (base * 0.51).toFixed(1));
  animateChange(missLossEl, (base * 1.01).toFixed(1));

  animateChange(redJusticeCountEl, redJ);
  animateChange(attackCountEl, atk);
  animateChange(missCountEl, miss);

  animateChange(redJusticeTotalEl, redTotal);
  animateChange(attackTotalEl, atkTotal);
  animateChange(missTotalEl, missTotal);

  const jcCount = totalNotes - redJ - atk - miss;
  const score = calculateScore(base, redJ, atk, miss, totalNotes);

  animateChange(jcCountSpan, jcCount);
  animateChange(redJSpan, redJ);
  animateChange(atkSpan, atk);
  animateChange(missSpan, miss);
  animateScore(scoreSpan, Number(scoreSpan.textContent || 0), score);

  bordersEl.innerHTML = "";
  scoreGoals.forEach(goal => {
    const maxAllowed = findMaxAllowed(goal.score, base, goal.type, totalNotes);
    const colorClass = goal.type === 'redJ' ? 'red' : 'green';
    const label = goal.type === 'redJ' ? '赤J' : 'ATK';
    const text = `${goal.score} <span class="${colorClass}">${label} ${maxAllowed}個以内</span>`;
    const p = document.createElement('p');
    p.innerHTML = text;
    p.classList.add('fade');
    bordersEl.appendChild(p);
  });
}

notesInput.addEventListener('input', updateScore);
redJInput.addEventListener('input', updateScore);
atkInput.addEventListener('input', updateScore);
missInput.addEventListener('input', updateScore);

updateScore();

// モーダル処理
const modal = document.getElementById('songModal');
const openModalBtn = document.getElementById('openModal');
const closeModalBtn = document.getElementById('closeModal');
const searchInput = document.getElementById('songSearch');
const songList = document.getElementById('songList');
const modalContent = document.getElementById('modalContent');

let allSongs = [];
let sortAsc = true;

const sortButton = document.createElement('button');
sortButton.textContent = '曲名で昇順ソート';
sortButton.style.marginBottom = '10px';
sortButton.style.width = '100%';
sortButton.style.padding = '8px';
sortButton.style.fontWeight = 'bold';
sortButton.style.border = 'none';
sortButton.style.borderRadius = '4px';
sortButton.style.background = '#222';
sortButton.style.color = '#0ff';
sortButton.style.cursor = 'pointer';

modalContent.insertBefore(sortButton, songList);

fetch('notelists.json')
  .then(res => res.json())
  .then(data => {
    allSongs = data;
    renderSongList(data);
  });

function renderSongList(songs) {
  songList.innerHTML = '';
  songs.forEach(song => {
    const li = document.createElement('li');
    li.textContent = `${song.title}（Lv${song.level}）`;
    li.addEventListener('click', () => {
      notesInput.value = song.count;
      modal.style.display = 'none';
      updateScore();
    });
    songList.appendChild(li);
  });
}

function applyFilterAndSort() {
  const keyword = searchInput.value.trim();
  const filtered = allSongs
    .filter(song => song.title.includes(keyword))
    .sort((a, b) => sortAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));
  renderSongList(filtered);
}

searchInput.addEventListener('input', applyFilterAndSort);
sortButton.addEventListener('click', () => {
  sortAsc = !sortAsc;
  sortButton.textContent = sortAsc ? '曲名で昇順ソート' : '曲名で降順ソート';
  applyFilterAndSort();
});

openModalBtn.addEventListener('click', () => {
  modal.style.display = 'flex';
  searchInput.value = '';
  applyFilterAndSort();
});

closeModalBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});
