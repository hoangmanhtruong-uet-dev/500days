(function () {
  const button = document.getElementById('blow-candles');
  const note = document.getElementById('birthday-note');
  let done = false;

  function makeConfetti() {
    const colors = ['#e8516a', '#f9a8b8', '#f0c060', '#fdeea0', '#fff3f5'];
    for (let i = 0; i < 70; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti';
      piece.style.setProperty('--x', `${Math.random() * 100}vw`);
      piece.style.setProperty('--c', colors[Math.floor(Math.random() * colors.length)]);
      piece.style.setProperty('--d', `${Math.random() * 1.6 + 2.4}s`);
      piece.style.setProperty('--drift', `${(Math.random() - .5) * 180}px`);
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 4400);
    }
  }

  button.addEventListener('click', () => {
    if (done) return;
    done = true;
    document.body.classList.add('candles-out');
    note.textContent = 'Điều ước đã được gửi đi.';
    makeConfetti();
    setTimeout(() => {
      window.location.href = 'gift.html';
    }, 2300);
  });
})();
