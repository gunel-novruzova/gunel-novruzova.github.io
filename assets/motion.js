(function(){
  var root=document.documentElement;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce||!('IntersectionObserver' in window)){root.classList.remove('js-motion');return;}
  root.classList.add('js-reveal','js-motion');

  /* 1. Headings: split into words that rise out of a mask */
  var SPLIT='main h1:not(.hero-h1), .contact h2, .core-left h2, .section-head h2';
  function word(content,i){
    var w=document.createElement('span');w.className='w';
    var s=document.createElement('span');s.className='wi';
    s.style.setProperty('--i',Math.min(i,24));
    if(typeof content==='string')s.textContent=content;else s.appendChild(content);
    w.appendChild(s);return w;
  }
  function split(h){
    var kids=Array.prototype.slice.call(h.childNodes),n=0,frag=document.createDocumentFragment();
    kids.forEach(function(k){
      if(k.nodeType===3){
        k.textContent.split(/(\s+)/).forEach(function(part){
          if(!part)return;
          if(/^\s+$/.test(part))frag.appendChild(document.createTextNode(' '));
          else frag.appendChild(word(part,n++));
        });
      }else if(k.nodeName==='BR'){frag.appendChild(k);}
      else frag.appendChild(word(k,n++));
    });
    h.textContent='';h.appendChild(frag);h.classList.add('is-split');
  }
  var heads=[].slice.call(document.querySelectorAll(SPLIT)).filter(function(h){return !h.closest('.story-label');});
  heads.forEach(function(h){h.classList.add('h-up');});

  /* 2. Mark blocks that should fade up (staggered inside lists) */
  var MARK=[
    ['.core-left > *:not(h2)',0],['.section-head > *:not(h2)',0],['.page-head p',0],
    ['.ledger .row',1],['.features > li',0],['.cards > li',3],
    ['.contact-cta > *:not(h2)',0],['.contact-links li',1],['.band-words',0],['.contact-grid > *',0]
  ];
  MARK.forEach(function(m){
    [].slice.call(document.querySelectorAll(m[0])).forEach(function(el,i){
      if(el.closest('.hero')||el.classList.contains('reveal'))return;
      el.classList.add('reveal');
      if(m[1]===1)el.style.setProperty('--i',Math.min(i,8));
      else if(m[1]>1)el.style.setProperty('--i',i%m[1]);
    });
  });
  [].slice.call(document.querySelectorAll('.features .feature-img')).forEach(function(el){el.classList.add('img-wipe');});

  /* 3. One observer for everything */
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting)return;
      var t=e.target;t.classList.add('in');io.unobserve(t);
      var wp=t.querySelector&&t.querySelector('.img-wipe');if(wp)wp.classList.add('in');
      if(t.classList.contains('reveal')){
        t.addEventListener('transitionend',function f(ev){
          if(ev.target!==t)return;t.classList.add('done');t.removeEventListener('transitionend',f);
        });
      }
    });
  },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  [].slice.call(document.querySelectorAll('.reveal,.h-up')).forEach(function(el){io.observe(el);});
})();
