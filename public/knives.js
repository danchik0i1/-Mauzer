(() => {
  const knives = document.querySelectorAll('.knife');
  knives.forEach((knife, index) => {
    let rotX = index ? 7 : -7;
    let rotY = index ? 18 : -18;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let drift = 0;

    const render = () => {
      const idleTilt = dragging ? 0 : Math.sin(drift) * 5;
      knife.style.setProperty('--rot-x', `${rotX + idleTilt}deg`);
      knife.style.setProperty('--rot-y', `${rotY + (dragging ? 0 : Math.sin(drift * .72) * 8)}deg`);
    };
    const frame = () => {
      if (!dragging) drift += .018;
      render();
      requestAnimationFrame(frame);
    };
    knife.addEventListener('pointerdown', (event) => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      knife.setPointerCapture?.(event.pointerId);
    });
    knife.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      rotY += (event.clientX - lastX) * .55;
      rotX -= (event.clientY - lastY) * .35;
      rotX = Math.max(-60, Math.min(60, rotX));
      lastX = event.clientX;
      lastY = event.clientY;
      render();
    });
    const release = (event) => {
      dragging = false;
      knife.releasePointerCapture?.(event.pointerId);
    };
    knife.addEventListener('pointerup', release);
    knife.addEventListener('pointercancel', release);
    knife.addEventListener('keydown', (event) => {
      const step = event.shiftKey ? 12 : 5;
      if (event.key === 'ArrowLeft') rotY -= step;
      else if (event.key === 'ArrowRight') rotY += step;
      else if (event.key === 'ArrowUp') rotX -= step;
      else if (event.key === 'ArrowDown') rotX += step;
      else return;
      event.preventDefault();
      render();
    });
    render();
    requestAnimationFrame(frame);
  });
})();
