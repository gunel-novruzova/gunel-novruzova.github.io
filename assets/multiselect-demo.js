(function(){
  var MAX_TOKENS = 3;

  var CONFIGS = [
    {
      key:'contract', label:'External contract', placeholder:'Search contracts',
      help:'Link every contract this plan refers to.',
      error:'Select at least one external contract.',
      options:[
        {id:'EC-1042', desc:'Steel supply, Q1 framework'},
        {id:'EC-1058', desc:'Site logistics'},
        {id:'EC-1063', desc:'Electrical subcontract'},
        {id:'EC-1071', desc:'Formwork rental'},
        {id:'EC-1089', desc:'Safety equipment'},
        {id:'EC-1094', desc:'Concrete supply'}
      ],
      preset:['EC-1042','EC-1058','EC-1063','EC-1071']
    },
    {
      key:'ncr', label:'Related NCRs', placeholder:'Search NCRs',
      help:'Link the non-conformance records behind this plan.',
      error:'Select at least one NCR.',
      options:[
        {id:'NCR-0211', desc:'Late delivery'},
        {id:'NCR-0216', desc:'Material spec mismatch'},
        {id:'NCR-0224', desc:'Documentation gap'},
        {id:'NCR-0230', desc:'Rework required'},
        {id:'NCR-0237', desc:'Inspection overdue'}
      ],
      preset:['NCR-0216']
    }
  ];

  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  function MultiSelect(cfg, onUserChange){
    var self = this;
    var selected = cfg.preset.slice();
    var open = false, active = -1, touched = false, query = '';
    var disabled = false, forcedError = false;

    var el = document.createElement('div');
    el.className = 'ms';
    el.innerHTML =
      '<label class="ms-label" for="'+cfg.key+'-input"><span>'+esc(cfg.label)+'</span><span class="ms-req">Required</span></label>'+
      '<div class="ms-field">'+
        '<div class="ms-control">'+
          '<div class="ms-tokens"></div>'+
          '<input class="ms-input" id="'+cfg.key+'-input" type="text" role="combobox" autocomplete="off" '+
            'aria-autocomplete="list" aria-expanded="false" aria-controls="'+cfg.key+'-list" '+
            'aria-describedby="'+cfg.key+'-help" placeholder="'+esc(cfg.placeholder)+'">'+
        '</div>'+
        '<ul class="ms-list" id="'+cfg.key+'-list" role="listbox" aria-multiselectable="true" aria-label="'+esc(cfg.label)+'" hidden></ul>'+
      '</div>'+
      '<p class="ms-help" id="'+cfg.key+'-help"></p>';

    var control = el.querySelector('.ms-control');
    var tokensEl = el.querySelector('.ms-tokens');
    var input = el.querySelector('.ms-input');
    var list = el.querySelector('.ms-list');
    var help = el.querySelector('.ms-help');

    function byId(id){ return cfg.options.filter(function(o){return o.id===id;})[0]; }
    function filtered(){
      var q = query.trim().toLowerCase();
      return cfg.options.filter(function(o){
        return !q || (o.id+' '+o.desc).toLowerCase().indexOf(q) !== -1;
      });
    }
    function currentState(){
      if (disabled) return 'disabled';
      if (forcedError || (touched && !selected.length && !open)) return 'error';
      return 'default';
    }

    function render(){
      var state = currentState();
      el.dataset.state = state;
      input.disabled = disabled;
      input.setAttribute('aria-invalid', state === 'error' ? 'true' : 'false');

      // tokens, with overflow collapsing when the list is closed
      var visible = open ? selected : selected.slice(0, MAX_TOKENS);
      var extra = selected.length - visible.length;
      var html = visible.map(function(id){
        var rm = disabled ? '' : '<button type="button" data-remove="'+id+'" aria-label="Remove '+id+'">&times;</button>';
        return '<span class="ms-token">'+id+rm+'</span>';
      }).join('');
      if (extra > 0) html += '<span class="ms-more" aria-label="'+extra+' more selected">+'+extra+'</span>';
      tokensEl.innerHTML = html;

      // list
      var items = filtered();
      if (active >= items.length) active = items.length - 1;
      list.hidden = !(open && !disabled);
      input.setAttribute('aria-expanded', String(!list.hidden));
      if (items.length){
        list.innerHTML = items.map(function(o, i){
          var sel = selected.indexOf(o.id) !== -1;
          return '<li class="ms-option'+(i===active?' active':'')+'" role="option" id="'+cfg.key+'-opt-'+o.id+'" data-id="'+o.id+'" aria-selected="'+sel+'">'+
                 '<span class="check" aria-hidden="true">'+(sel?'&#10003;':'')+'</span>'+
                 '<span><span class="code">'+o.id+'</span> <span class="desc">'+esc(o.desc)+'</span></span></li>';
        }).join('');
      } else {
        list.innerHTML = '<li class="ms-empty" role="presentation">No match for &ldquo;'+esc(query)+'&rdquo;</li>';
      }
      if (!list.hidden && active >= 0 && items[active]){
        input.setAttribute('aria-activedescendant', cfg.key+'-opt-'+items[active].id);
        var node = list.querySelector('.active');
        if (node && node.scrollIntoView) node.scrollIntoView({block:'nearest'});
      } else {
        input.removeAttribute('aria-activedescendant');
      }

      // helper / error text
      if (state === 'error') help.textContent = cfg.error;
      else if (state === 'disabled') help.textContent = 'Locked. Plans can’t be edited after approval.';
      else help.textContent = selected.length ? selected.length + ' linked. ' + cfg.help : cfg.help;
    }

    function toggle(id){
      var i = selected.indexOf(id);
      if (i === -1) selected.push(id); else selected.splice(i, 1);
      touched = true;
      query = ''; input.value = '';
      var wasForced = forcedError;
      forcedError = false;
      render();
      if (wasForced && onUserChange) onUserChange();
    }
    function remove(id){
      var i = selected.indexOf(id);
      if (i !== -1){ selected.splice(i, 1); touched = true; render(); }
    }
    function close(){ open = false; active = -1; query = ''; input.value = ''; }

    control.addEventListener('mousedown', function(e){
      if (disabled) return;
      if (e.target.closest('button')) return;
      if (e.target !== input){ e.preventDefault(); input.focus(); }
      open = true; if (active < 0) active = 0; render();
    });
    tokensEl.addEventListener('click', function(e){
      var b = e.target.closest('[data-remove]');
      if (b && !disabled){ remove(b.getAttribute('data-remove')); input.focus(); }
    });
    list.addEventListener('mousedown', function(e){ e.preventDefault(); });
    list.addEventListener('click', function(e){
      var li = e.target.closest('.ms-option');
      if (li) toggle(li.getAttribute('data-id'));
    });
    list.addEventListener('mousemove', function(e){
      var li = e.target.closest('.ms-option');
      if (!li) return;
      var items = filtered();
      var idx = items.map(function(o){return o.id;}).indexOf(li.getAttribute('data-id'));
      if (idx !== active){ active = idx; var all = list.querySelectorAll('.ms-option'); for (var k=0;k<all.length;k++) all[k].classList.toggle('active', k===idx); }
    });
    input.addEventListener('input', function(){
      query = input.value; open = true; active = 0; render();
    });
    input.addEventListener('keydown', function(e){
      var items = filtered();
      if (e.key === 'ArrowDown'){
        e.preventDefault();
        if (!open){ open = true; active = 0; } else active = Math.min(items.length - 1, active + 1);
        render();
      } else if (e.key === 'ArrowUp'){
        e.preventDefault();
        if (!open){ open = true; active = items.length - 1; } else active = Math.max(0, active - 1);
        render();
      } else if (e.key === 'Enter'){
        if (open && active >= 0 && items[active]){ e.preventDefault(); toggle(items[active].id); }
      } else if (e.key === 'Escape'){
        if (open){ e.preventDefault(); close(); render(); }
      } else if (e.key === 'Backspace'){
        if (!input.value && selected.length && !disabled){ remove(selected[selected.length - 1]); }
      } else if (e.key === 'Tab'){
        close(); touched = true; render();
      }
    });
    el.addEventListener('focusout', function(e){
      if (e.relatedTarget && el.contains(e.relatedTarget)) return;
      if (!open && !touched) return;
      close(); touched = true; render();
    });

    // API used by the state switcher and the save button
    self.el = el;
    self.count = function(){ return selected.length; };
    self.touch = function(){ touched = true; render(); };
    self.setMode = function(mode, fromUser){
      if (mode === 'default'){
        disabled = false; forcedError = false;
        if (fromUser){ selected = cfg.preset.slice(); touched = false; }
      } else if (mode === 'error'){
        disabled = false; forcedError = true; selected = []; close();
      } else if (mode === 'disabled'){
        disabled = true; forcedError = false; close();
        if (!selected.length) selected = cfg.preset.slice();
      }
      render();
    };
    render();
  }

  var fieldsRoot = document.getElementById('demo-fields');
  var buttons = document.querySelectorAll('.seg button');
  var statusEl = document.getElementById('demo-status');
  var instances = [];

  function showMode(mode){
    for (var i = 0; i < buttons.length; i++){
      buttons[i].setAttribute('aria-pressed', String(buttons[i].getAttribute('data-mode') === mode));
    }
  }
  function onUserChange(){ showMode('default'); statusEl.textContent = ''; }

  CONFIGS.forEach(function(cfg){
    var ms = new MultiSelect(cfg, onUserChange);
    instances.push(ms);
    fieldsRoot.appendChild(ms.el);
  });

  for (var b = 0; b < buttons.length; b++){
    buttons[b].addEventListener('click', function(){
      var mode = this.getAttribute('data-mode');
      showMode(mode);
      statusEl.textContent = '';
      instances.forEach(function(i){ i.setMode(mode, true); });
    });
  }

  document.getElementById('demo-save').addEventListener('click', function(){
    var missing = instances.some(function(i){ return i.count() === 0; });
    instances.forEach(function(i){ i.touch(); });
    if (missing){
      statusEl.textContent = 'Plan not saved. Fix the highlighted fields.';
    } else {
      var c = instances[0].count(), n = instances[1].count();
      statusEl.textContent = 'Saved. ' + c + (c === 1 ? ' contract' : ' contracts') + ' and ' + n + (n === 1 ? ' NCR' : ' NCRs') + ' linked (demo, nothing is stored).';
    }
  });
})();
