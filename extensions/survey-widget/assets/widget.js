(function() {
  // Debug logging
  console.log('🎯 SheetPulse: Starting widget initialization');
  console.log('📋 SheetPulse config:', window.SheetPulse);

  // Check if window.SheetPulse is defined
  if (!window.SheetPulse) {
    console.error('❌ SheetPulse: window.SheetPulse is not defined!');
    console.error('❌ SheetPulse: Check if Liquid template is loading the config correctly');
    return;
  }

  const { questions, googleUrl, triggerType, tVal, targetDevice, accentColor, lang, status, surveyVersion, widgetPosition } = window.SheetPulse;

  // Early exit conditions with detailed logging
  if (status !== 'active') {
    console.log('❌ SheetPulse: Status is not active:', status);
    return;
  }
  console.log('✅ SheetPulse: Status is active');

  if (!questions?.length) {
    console.log('❌ SheetPulse: No questions found:', questions);
    return;
  }
  console.log('✅ SheetPulse: Questions found:', questions.length);

  if (!googleUrl) {
    console.log('❌ SheetPulse: No Google URL configured');
    return;
  }
  console.log('✅ SheetPulse: Google URL configured');

  const isPreview = window.location.search.includes('preview=1');
  const surveyId = questions[0]?.id || 'default';
  const doneKey = `sp_done_${surveyId}`;
  const closedKey = `sp_closed_${surveyId}`;
  const versionKey = `sp_version_${surveyId}`;
  const currentVersion = surveyVersion || questions[0]?.id;

  console.log('SheetPulse: Survey config', {
    surveyId,
    currentVersion,
    isPreview,
    doneKey,
    closedKey,
    versionKey
  });

  const storedVersion = localStorage.getItem(versionKey);
  if (!isPreview && storedVersion !== currentVersion) {
    console.log('SheetPulse: Version changed, resetting survey state');
    localStorage.removeItem(doneKey);
    localStorage.removeItem(closedKey);
    localStorage.setItem(versionKey, currentVersion);
  }

  if (!isPreview && (localStorage.getItem(doneKey) || localStorage.getItem(closedKey))) {
    console.log('SheetPulse: Survey already completed or closed, exiting');
    return;
  }

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const currentDevice = isMobile ? 'mobile' : 'desktop';
  if (targetDevice !== 'all' && targetDevice !== currentDevice) {
    console.log('SheetPulse: Device filter active, current device:', currentDevice, 'target:', targetDevice);
    return;
  }

  console.log('SheetPulse: All checks passed, initializing survey');

  let respondentId = sessionStorage.getItem('sp_uid') || 'SP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  sessionStorage.setItem('sp_uid', respondentId);

  const i18n = {
    en: { next: "Next", finish: "Finish", skip: "Not sure", thanks: "You're awesome! Thanks for helping us grow. 🚀", other: "Other..." },
    es: { next: "Siguiente", finish: "Finalizar", skip: "No lo sé", thanks: "¡Eres genial! Gracias por给我们. 🚀", other: "Otro..." },
    de: { next: "Weiter", finish: "Beenden", skip: "Nicht sicher", thanks: "Danke für deine Hilfe! 🚀", other: "Anderes..." },
    fr: { next: "Suivant", finish: "Terminer", skip: "Pas sûr", thanks: "Merci de nous aider! 🚀", other: "Autre..." },
    pt: { next: "Próximo", finish: "Finalizar", skip: "Não sei", thanks: "Obrigado por nos ajudar! 🚀", other: "Outro..." }
  }[lang || 'en'];

  let currentStep = 0;
  let answers = {};
  let selected = []; 
  
  let cleanColor = accentColor && accentColor.trim() ? accentColor.replace(/^#/, '') : '000000';
  let theme = '#' + cleanColor;
  const isWhite = theme.toLowerCase() === '#ffffff' || theme.toLowerCase() === '#fff';
  const isBlack = theme.toLowerCase() === '#000000' || theme.toLowerCase() === '#000' || cleanColor === '111';
  const btnTxt = '#ffffff';
  const btnBorder = isWhite ? '1px solid #ccc' : 'none';
  const selectedBg = isBlack ? '#333333' : theme;

  // Widget position: left or right (default right)
  const widgetPos = widgetPosition || 'right';
  
  // Debug: log widget position
  console.log('SheetPulse: Widget position =', widgetPos, 'widgetPosition =', widgetPosition);

  const show = () => {
    const widget = document.getElementById('sp-widget');
    if (widget) {
      widget.classList.remove('sp-hidden');
    }
  };

  // Add function to reset survey from admin panel
  if (window.location.hash === '#reset') {
    localStorage.removeItem(doneKey);
    localStorage.removeItem(closedKey);
    localStorage.removeItem(versionKey);
    window.location.hash = '';
    alert('Survey has been reset! All visitors can now take it again.');
  }

  const updateNextButton = () => {
    const btn = document.getElementById('sp-next');
    if(!btn) return;
    
    let hasAnswer = selected.length > 0;
    
    const textInput = document.getElementById('sp-i');
    if (textInput && textInput.value.trim().length > 0) hasAnswer = true;
    
    const otherInput = document.getElementById('sp-ot-i');
    if (otherInput && otherInput.value.trim().length > 0) hasAnswer = true;

    if (hasAnswer) {
      btn.style.display = 'block';
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
    } else {
      btn.style.display = 'none';
    }
  };

  const render = () => {
    const q = questions[currentStep];
    const container = document.getElementById('sp-card');
    if (!container) return;
    const isLast = currentStep === questions.length - 1;
    
    let html = `<button id="sp-close">×</button>
                <div class="sp-prog" style="color:${theme}">STEP ${currentStep+1}/${questions.length}</div>
                <p class="sp-q">${q.label}</p>
                <div class="sp-body">`;

    if (q.type.includes('emoji')) {
      const ems = q.type === 'emoji' ? ['😞','😐','🤩'] : ['😡','😟','😐','🙂','😍'];
      html += `<div class="sp-ems ${ems.length > 3 ? 'sp-ems-5' : ''}">${ems.map(e => `<button class="sp-e-btn" data-val="${e}">${e}</button>`).join('')}</div>`;
    } else if (q.type === 'radio' || q.type === 'checkbox') {
      const opts = q.options ? q.options.split(',').map(o => o.trim()) : [];
      html += `<div class="sp-list">${opts.map(o => `
        <button class="sp-o" data-val="${o}">
          ${q.type === 'checkbox' ? `<span class="sp-c"><span class="sp-check">✓</span></span>` : ''}${o}
        </button>`).join('')}</div>`;
      if (q.hasOther || q.notSure) {
        html += `<div class="sp-extras">`;
        if (q.hasOther) html += `<input type="text" id="sp-ot-i" placeholder="${i18n.other}" class="sp-input">`;
        if (q.notSure) html += `<button class="sp-o sp-skip" data-val="Skip">${i18n.skip}</button>`;
        html += `</div>`;
      }
    } else if (q.type === 'scale') {
      const max = parseInt(q.scaleMax || 5);
      html += `<div class="sp-sc-row" style="grid-template-columns: repeat(${max}, 1fr)">
        ${Array.from({length: max}, (_, i) => `<button class="sp-sc-b" data-val="${i+1}">${i+1}</button>`).join('')}
      </div>
      <div class="sp-sc-labs"><span>${q.labelL || ''}</span><span>${q.labelR || ''}</span></div>`;
    } else if (q.type === 'text') {
      html += `<textarea id="sp-i" class="sp-input" placeholder="${q.placeholder || '...'}"></textarea>`;
      if (q.notSure) {
        html += `<button class="sp-o sp-skip sp-skip-text" data-val="Skip">${i18n.skip}</button>`;
      }
    }

    html += `</div><div class="sp-nav">`;
    html += `<button id="sp-next" class="sp-next-btn" style="display:none; background:${theme}; color:${btnTxt}; border:${btnBorder}; width:100%;">${isLast ? i18n.finish : i18n.next}</button></div>`;
    
    container.innerHTML = html;

    container.querySelectorAll('.sp-e-btn, .sp-sc-b, .sp-o, .sp-skip-text').forEach(b => {
      b.onclick = (e) => {
        if(b.classList.contains('sp-skip') || b.classList.contains('sp-skip-text')) {
           processNext(q.label, "Skip");
           return;
        }

        e.preventDefault();
        const v = b.getAttribute('data-val');

        if (q.type === 'checkbox') {
           b.classList.toggle('is-s'); 
           if (b.classList.contains('is-s')) {
             if (!selected.includes(v)) selected.push(v);
           } else {
             selected = selected.filter(i => i !== v);
           }
           
           b.style.backgroundColor = b.classList.contains('is-s') ? selectedBg : '#fff';
           b.style.color = b.classList.contains('is-s') ? btnTxt : '#333';
           
           const check = b.querySelector('.sp-check');
           if(check) {
             check.style.opacity = b.classList.contains('is-s') ? '1' : '0';
           }
        } else if (q.type === 'emoji') {
           selected = [v];
           container.querySelectorAll('.sp-e-btn').forEach(el => {
             el.classList.remove('is-s');
             el.style.transform = 'scale(1)';
           });
           b.classList.add('is-s');
           b.style.transform = 'scale(1.3)';
        } else if (q.type === 'scale') {
           selected = [v];
           container.querySelectorAll('.sp-sc-b').forEach(el => {
             el.classList.remove('is-s');
             el.style.backgroundColor = '#fff';
             el.style.color = '#333';
           });
           b.classList.add('is-s');
           b.style.backgroundColor = selectedBg;
           b.style.color = btnTxt;
        } else {
           selected = [v];
           container.querySelectorAll('.sp-o').forEach(el => {
             el.classList.remove('is-s');
             el.style.backgroundColor = '#fff';
             el.style.color = '#333';
           });
           const otherInput = document.getElementById('sp-ot-i');
           if (otherInput) otherInput.value = '';
           b.classList.add('is-s');
           b.style.backgroundColor = selectedBg;
           b.style.color = btnTxt;
        }
        updateNextButton();
      };
    });

    const otherInput = document.getElementById('sp-ot-i');
    if (otherInput) {
      otherInput.oninput = () => {
        if (otherInput.value.trim().length > 0) {
          selected = [];
          container.querySelectorAll('.sp-o').forEach(el => {
            el.classList.remove('is-s');
            el.style.backgroundColor = '#fff';
            el.style.color = '#333';
          });
        }
        updateNextButton();
      };
    }
    
    const txt = document.getElementById('sp-i');
    if(txt) txt.oninput = updateNextButton;

    container.querySelector('#sp-next').onclick = () => {
      const btn = document.getElementById('sp-next');
      if (btn && btn.style.display === 'none') return;
      
      let val = selected.length > 0 ? selected.join(', ') : '';
      
      if (q.type === 'text') {
        const textInput = document.getElementById('sp-i');
        if (textInput) val = textInput.value;
      }
      
      const otherInput = document.getElementById('sp-ot-i');
      const otherVal = otherInput ? otherInput.value : '';
      if (otherVal && q.type === 'radio') {
        val = otherVal;
      } else if (otherVal) {
        val = val ? (val + ", " + otherVal) : otherVal;
      }
      
      if (val && val.trim()) {
        processNext(q.label, val);
      }
    };
    
    document.getElementById('sp-close').onclick = () => {
      localStorage.setItem(closedKey, 'true');
      document.getElementById('sp-widget').remove();
    };
    
    updateNextButton();
  };

  const processNext = (key, val) => {
    answers[key] = val || "-";
    selected = [];
    if (currentStep < questions.length - 1) { currentStep++; render(); } 
    else { finish(); }
  };

  const finish = async () => {
    document.getElementById('sp-card').innerHTML = `<p class="sp-thanks">${i18n.thanks}</p>`;
    if (!isPreview) {
      try {
        await fetch(googleUrl, { method: 'POST', mode: 'no-cors',
          body: JSON.stringify({ respondentId, device: currentDevice, lang: lang, answer: JSON.stringify(answers), pageUrl: window.location.href })
        });
      } catch (e) {}
    }
    localStorage.setItem(doneKey, 'true');
    localStorage.setItem(versionKey, currentVersion);
    setTimeout(() => document.getElementById('sp-widget').remove(), 3500);
  };

  // Create container with inline styles for position
  const container = document.createElement('div');
  container.id = 'sp-widget';
  container.className = 'sp-hidden';

  // Apply position directly via inline styles
  if (widgetPos === 'left') {
    container.style.left = '20px';
    container.style.right = 'auto';
  } else {
    container.style.right = '20px';
    container.style.left = 'auto';
  }

  container.innerHTML = '<div id="sp-card" class="sp-card"></div>';
  document.body.appendChild(container);

  render();

  console.log('SheetPulse: Setting up trigger -', triggerType);

  if (triggerType === 'purchase' && window.location.pathname.includes('/thank_you')) {
    console.log('SheetPulse: Purchase trigger - showing survey');
    show();
  }
  else if (triggerType === 'exit') {
    console.log('SheetPulse: Exit trigger - setting up event listeners');
    document.addEventListener('mouseleave', (e) => {
      if (e.clientY <= 0) {
        console.log('SheetPulse: Exit detected, showing survey');
        show();
      }
    });
    let lastS = 0;
    window.addEventListener('scroll', () => {
      let st = window.pageYOffset;
      if (st < lastS && lastS - st > 40 && st > 100) {
        console.log('SheetPulse: Fast scroll up detected, showing survey');
        show();
      }
      lastS = st;
    });
  } else if (triggerType === 'cart') {
    console.log('SheetPulse: Cart trigger - checking cart every 3 seconds');
    setInterval(async () => {
      try {
        const r = await fetch('/cart.js');
        const cart = await r.json();
        console.log('SheetPulse: Cart check - items:', cart.item_count, 'threshold:', parseInt(tVal));
        if (cart.item_count >= parseInt(tVal)) {
          console.log('SheetPulse: Cart threshold reached, showing survey');
          show();
        }
      } catch(e) {
        console.error('SheetPulse: Cart check error:', e);
      }
    }, 3000);
  } else {
    console.log('SheetPulse: Timer trigger - showing after', tVal, 'seconds');
    setTimeout(() => {
      console.log('SheetPulse: Timer expired, showing survey');
      show();
    }, parseInt(tVal)*1000);
  }
})();
