(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var marquees = Array.prototype.slice.call(document.querySelectorAll('.marquee'));
  if (reduce || !marquees.length) return;

  function build(el){
    var track = el.querySelector('.marquee-track');
    if (!track.getAttribute('data-src')) track.setAttribute('data-src', track.querySelector('.marquee-group').innerHTML);
    var src = track.getAttribute('data-src');
    track.innerHTML = '<div class="marquee-group">' + src + '</div>';
    var group = track.firstElementChild, guard = 0;
    // repeat the set until one group is at least as wide as the viewport, so there is never a gap
    while (group.offsetWidth < el.clientWidth && guard++ < 12) group.insertAdjacentHTML('beforeend', src);
    track.appendChild(group.cloneNode(true));
    var speed = parseFloat(el.getAttribute('data-speed')) || 40;
    el.style.setProperty('--dur', Math.max(8, group.offsetWidth / speed) + 's');
    el.classList.add('is-ready');
  }

  var lastW = 0, t;
  function buildAll(){ marquees.forEach(build); lastW = window.innerWidth; }
  buildAll();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildAll);
  window.addEventListener('resize', function(){
    clearTimeout(t);
    t = setTimeout(function(){ if (window.innerWidth !== lastW) buildAll(); }, 160);
  });
})();
