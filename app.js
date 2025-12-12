// === CONFIG: change these to permanent image paths or data URLs ===
// You can use relative filenames (e.g. 'x.png', 'o.png'), absolute URLs, or data URLs.
const IMG_X = 'images/x.png'; // replace with your X image path
const IMG_O = 'images/o.png'; // replace with your O image path
// ===================================================================

const tokenImgs = { X: IMG_X, O: IMG_O };

const boardEl = document.getElementById('board');
const currentEl = document.getElementById('current');
const overlay = document.getElementById('overlay');
const resultTitle = document.getElementById('resultTitle');
const resultText = document.getElementById('resultText');
const nextBtn = document.getElementById('nextBtn');
const closeBtn = document.getElementById('closeBtn');

const scoreXEl = document.getElementById('scoreX');
const scoreOEl = document.getElementById('scoreO');
const scoreDEl = document.getElementById('scoreD');

const resetBtn = document.getElementById('resetBtn');
const resetAllBtn = document.getElementById('resetAllBtn');

const WIN_COMBOS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

let board = Array(9).fill(null);
let current = 'X';
let scores = {X:0,O:0,D:0};
let gameOver = false; // prevents double-scoring when round ends
let roundOver = false; // prevents double-counting if endRound is triggered multiple times

function updateScoreboard(){
  // defensive: ensure elements exist
  if(scoreXEl) scoreXEl.textContent = scores.X;
  if(scoreOEl) scoreOEl.textContent = scores.O;
  if(scoreDEl) scoreDEl.textContent = scores.D;
}

function renderBoard(){
  boardEl.innerHTML = '';
  board.forEach((cell, idx) => {
    const cellEl = document.createElement('button');
    cellEl.className = 'cell';
    cellEl.setAttribute('data-i', idx);
    cellEl.setAttribute('aria-label', 'cell '+(idx+1));
    if(cell){
      cellEl.classList.add('disabled');
      const img = document.createElement('img');
      img.src = tokenImgs[cell];
      img.alt = cell;
      cellEl.appendChild(img);
    }
    cellEl.addEventListener('click', onCellClick);
    boardEl.appendChild(cellEl);
  });
  currentEl.textContent = current;
}

function onCellClick(e){
  if(roundOver) return; // ignore clicks after round end until reset
  const i = Number(e.currentTarget.dataset.i);
  if(board[i] || checkWinner()) return;
  board[i] = current;
  renderBoard();
  const winner = checkWinner();
  // Debug: log board and winner
  console.log('Move:', i, 'Player:', current, 'Board:', board, 'Winner:', winner);
  if(winner){
    endRound(winner);
    return;
  }
  if(board.every(Boolean)){
    endRound('D');
    return;
  }
  current = current === 'X' ? 'O' : 'X';
  currentEl.textContent = current;
}

function checkWinner(){
  for(const combo of WIN_COMBOS){
    const [a,b,c] = combo;
    if(board[a] && board[a] === board[b] && board[a] === board[c]){
      return {player: board[a], combo};
    }
  }
  return null;
}

/*
  Robust endRound handling:
  - Accepts either the string 'D' for draw, or an object {player, combo}.
  - Guards against malformed inputs.
  - Uses roundOver flag to avoid double increments.
*/
function endRound(result){
  if(roundOver){
    console.warn('endRound called but round is already over. Ignoring duplicate call.');
    return;
  }
  roundOver = true;

  // Defensive: if result is falsy treat as draw
  if(!result){
    result = 'D';
  }

  if(typeof result === 'string'){
    if(result === 'D'){
      scores.D += 1;
      updateScoreboard();
      resultTitle.textContent = 'Draw';
      resultText.textContent = 'No one wins this round.';
      overlay.classList.add('show');
      return;
    } else {
      // Unexpected string — ignore and treat as draw
      console.warn('endRound received unexpected string:', result);
      scores.D += 1;
      updateScoreboard();
      resultTitle.textContent = 'Draw';
      resultText.textContent = 'No one wins this round.';
      overlay.classList.add('show');
      return;
    }
  }

  // If result is an object, validate structure
  if(typeof result === 'object' && result.player){
    const player = result.player;
    if(!['X','O'].includes(player)){
      // malformed player, treat as draw
      console.warn('endRound received malformed player:', player);
      scores.D += 1;
      updateScoreboard();
      resultTitle.textContent = 'Draw';
      resultText.textContent = 'No one wins this round.';
      overlay.classList.add('show');
      return;
    }

    // Normal win handling
    scores[player] += 1;
    updateScoreboard();
    resultTitle.textContent = player + ' wins!';
    resultText.textContent = 'Congratulations — ' + player + ' completed a line.';
    highlightCells(result.combo || []);
    overlay.classList.add('show');
    return;
  }

  // Fallback: treat as draw
  console.warn('endRound received unknown result type:', result);
  scores.D += 1;
  updateScoreboard();
  resultTitle.textContent = 'Draw';
  resultText.textContent = 'No one wins this round.';
  overlay.classList.add('show');
}

function highlightCells(combo){
  combo.forEach(i => {
    const cell = boardEl.querySelector('[data-i="'+i+'"]');
    if(cell) cell.classList.add('highlight');
  });
}

function clearHighlights(){
  document.querySelectorAll('.highlight').forEach(h => h.classList.remove('highlight'));
}

function resetBoard(keepScores=true){
  board = Array(9).fill(null);
  current = 'X';
  roundOver = false;
  clearHighlights();
  if(!keepScores){
    scores = {X:0,O:0,D:0};
    updateScoreboard();
  }
  renderBoard();
}

// Attach UI handlers
resetBtn.addEventListener('click', ()=>resetBoard(true));
resetAllBtn.addEventListener('click', ()=>resetBoard(false));
nextBtn.addEventListener('click', ()=>{ overlay.classList.remove('show'); resetBoard(true); });
closeBtn.addEventListener('click', ()=>{ overlay.classList.remove('show'); });

document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape') overlay.classList.remove('show');
});

// initialize
updateScoreboard();
resetBoard(true);
