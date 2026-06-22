(function () {
  const giftBox = document.getElementById('gift-box');
  const note = document.getElementById('gift-note');
  let opened = false;

  function burst() {
    const rect = giftBox.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colors = ['#e8516a', '#f9a8b8', '#f0c060', '#fdeea0', '#fff3f5'];
    for (let i = 0; i < 44; i++) {
      const spark = document.createElement('span');
      spark.className = 'spark';
      spark.textContent = ['♥', '✦', '♡', '★'][Math.floor(Math.random() * 4)];
      spark.style.setProperty('--x', `${cx}px`);
      spark.style.setProperty('--y', `${cy}px`);
      spark.style.setProperty('--c', colors[Math.floor(Math.random() * colors.length)]);
      spark.style.setProperty('--s', `${Math.random() * 16 + 12}px`);
      spark.style.setProperty('--dx', `${(Math.random() - .5) * 420}px`);
      spark.style.setProperty('--dy', `${(Math.random() - .65) * 320}px`);
      document.body.appendChild(spark);
      setTimeout(() => spark.remove(), 1200);
    }
  }

  giftBox.addEventListener('click', () => {
    if (opened) return;
    opened = true;
    document.body.classList.add('gift-open');
    note.textContent = 'Lời chúc này là dành riêng cho em.';
    burst();
  });
})();
