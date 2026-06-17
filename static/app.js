/* ==========================================================================
   APPLICATION LOGIC & ANIMATIONS — TDS DATA ANALYST AGENT
   ========================================================================== */

class DataAnalystAgent {
  constructor() {
    // DOM Elements
    this.qFile = document.getElementById('qFile');
    this.dFile = document.getElementById('dFile');
    this.qZone = document.getElementById('qZone');
    this.dZone = document.getElementById('dZone');
    this.qPill = document.getElementById('qPill');
    this.dPill = document.getElementById('dPill');
    this.qPillName = document.getElementById('qPillName');
    this.dPillName = document.getElementById('dPillName');
    this.qPillSize = document.getElementById('qPillSize');
    this.dPillSize = document.getElementById('dPillSize');
    this.qRemove = document.getElementById('qRemove');
    this.dRemove = document.getElementById('dRemove');
    
    this.runBtn = document.getElementById('runBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.stepperProgress = document.getElementById('stepperProgress');
    this.stepperBarFill = document.getElementById('stepperBarFill');
    this.stepperStatusMsg = document.getElementById('stepperStatusMsg');
    
    this.resultsSection = document.getElementById('results-section');
    this.resultsContainer = document.getElementById('resultsContainer');
    this.resultsTitle = document.getElementById('resultsTitle');
    this.resultsCount = document.getElementById('resultsCount');
    
    this.lightbox = document.getElementById('resultLightbox');
    this.lbImg = document.getElementById('lightboxImg');
    this.lbClose = document.getElementById('lightboxClose');

    // Architecture nodes for animation
    this.nodes = {
      n1: document.getElementById('node-files'),
      n2: document.getElementById('node-parser'),
      n3: document.getElementById('node-llm'),
      n4: document.getElementById('node-python'),
      n5: document.getElementById('node-viz'),
      n6: document.getElementById('node-answers')
    };

    this.arrows = {
      a1: document.getElementById('arrow-1'),
      a2: document.getElementById('arrow-2'),
      a3: document.getElementById('arrow-3'),
      a4: document.getElementById('arrow-4'),
      a5: document.getElementById('arrow-5')
    };

    // States & Progress info
    this.progressMessages = [
      'Reading query directives…',
      'Scanning dataset schemas…',
      'Orchestrating Gemini LLM reasoning…',
      'Synthesizing Python execution environment…',
      'Running secure python calculations…',
      'Visualizing data properties…',
      'Finalizing analytical answers…'
    ];
    this.currentMsgIndex = 0;
    this.progressTimer = null;
    this.barTimer = null;
    this.barPercent = 0;

    this._init();
  }

  _init() {
    // Bind Event Listeners
    this._bindEvents();
    // Initialize Scroll and GSAP effects
    this._initAnimations();
  }

  _bindEvents() {
    // File upload triggers
    this.qFile.addEventListener('change', () => this._handleQuestionFile());
    this.dFile.addEventListener('change', () => this._handleDatasetFile());
    
    this.qRemove.addEventListener('click', e => { e.stopPropagation(); this._clearQuestion(); });
    this.dRemove.addEventListener('click', e => { e.stopPropagation(); this._clearDataset(); });
    
    this._setupDragAndDrop(this.qZone, files => { this.qFile.files = files; this._handleQuestionFile(); });
    this._setupDragAndDrop(this.dZone, files => { this.dFile.files = files; this._handleDatasetFile(); });

    // Action buttons
    this.runBtn.addEventListener('click', () => this._executeAnalysis());
    this.clearBtn.addEventListener('click', () => this._resetUI());

    // Lightbox triggers
    this.lbClose.addEventListener('click', () => this._closeLightbox());
    this.lightbox.addEventListener('click', e => { if (e.target === this.lightbox) this._closeLightbox(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this._closeLightbox(); });

    // Smooth navigation links
    document.querySelectorAll('.scroll-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
          window.scrollTo({
            top: targetSection.offsetTop - 70, // subtract nav height
            behavior: 'smooth'
          });
        }
      });
    });
  }

  _setupDragAndDrop(zone, callback) {
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      if (e.dataTransfer.files.length) {
        callback(e.dataTransfer.files);
      }
    });
  }

  /* --- File Event Handlers --- */
  _handleQuestionFile() {
    const file = this.qFile.files[0];
    if (!file) return;
    this.qZone.classList.add('has-file');
    this.qPillName.textContent = file.name;
    this.qPillSize.textContent = this._formatSize(file.size);
    this.qPill.classList.add('visible');
    
    this._updateRunButtonState();
    
    // Highlight first node in engine visualizer
    this._updateNodeState('n1', 'done');
    this._updateArrowState('a1', 'active');
    this._updateNodeState('n2', 'active');
  }

  _handleDatasetFile() {
    const file = this.dFile.files[0];
    if (!file) return;
    this.dZone.classList.add('has-file');
    this.dPillName.textContent = file.name;
    this.dPillSize.textContent = this._formatSize(file.size);
    this.dPill.classList.add('visible');
  }

  _clearQuestion() {
    this.qFile.value = '';
    this.qZone.classList.remove('has-file');
    this.qPill.classList.remove('visible');
    this._updateRunButtonState();
    
    this._updateNodeState('n1', '');
    this._updateArrowState('a1', '');
    this._updateNodeState('n2', '');
  }

  _clearDataset() {
    this.dFile.value = '';
    this.dZone.classList.remove('has-file');
    this.dPill.classList.remove('visible');
  }

  _updateRunButtonState() {
    this.runBtn.disabled = !this.qFile.files[0];
  }

  _formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  /* --- Pipeline Node Control --- */
  _updateNodeState(nodeKey, state) {
    const node = this.nodes[nodeKey];
    if (!node) return;
    node.classList.remove('active', 'done');
    if (state === 'active') node.classList.add('active');
    if (state === 'done') node.classList.add('done');
  }

  _updateArrowState(arrowKey, state) {
    const arrow = this.arrows[arrowKey];
    if (!arrow) return;
    arrow.classList.remove('active', 'done');
    if (state === 'active') arrow.classList.add('active');
    if (state === 'done') arrow.classList.add('done');
  }

  /* --- Progress Mechanics --- */
  _startProcessIndicators() {
    this.stepperProgress.classList.add('visible');
    this.stepperBarFill.style.width = '0%';
    this.barPercent = 0;
    this.currentMsgIndex = 0;
    this.stepperStatusMsg.textContent = this.progressMessages[0];

    // Show loading skeleton and hide charts section
    const chartsSkeleton = document.getElementById('chartsSkeleton');
    if (chartsSkeleton) {
      chartsSkeleton.style.display = 'block';
    }
    const chartsSection = document.getElementById('chartsSection');
    if (chartsSection) {
      chartsSection.style.display = 'none';
    }

    // Gradually fill bar up to 90%
    this.barTimer = setInterval(() => {
      if (this.barPercent < 90) {
        this.barPercent += Math.random() * 4 + 1.5;
        this.stepperBarFill.style.width = Math.min(this.barPercent, 90) + '%';
      }
    }, 450);

    // Rotate status messages and highlight nodes in cycle
    this.progressTimer = setInterval(() => {
      this.currentMsgIndex = (this.currentMsgIndex + 1) % this.progressMessages.length;
      this.stepperStatusMsg.textContent = this.progressMessages[this.currentMsgIndex];
      
      // Update nodes dynamically based on step messages
      if (this.currentMsgIndex === 1) {
        this._updateNodeState('n2', 'done');
        this._updateArrowState('a2', 'active');
        this._updateNodeState('n3', 'active');
      } else if (this.currentMsgIndex === 2) {
        this._updateNodeState('n3', 'done');
        this._updateArrowState('a3', 'active');
        this._updateNodeState('n4', 'active');
      } else if (this.currentMsgIndex === 4) {
        this._updateNodeState('n4', 'done');
        this._updateArrowState('a4', 'active');
        this._updateNodeState('n5', 'active');
      } else if (this.currentMsgIndex === 5) {
        this._updateNodeState('n5', 'done');
        this._updateArrowState('a5', 'active');
        this._updateNodeState('n6', 'active');
      }
    }, 2800);
  }

  _stopProcessIndicators(isSuccessful) {
    clearInterval(this.barTimer);
    clearInterval(this.progressTimer);
    
    this.stepperBarFill.style.width = '100%';
    this.stepperStatusMsg.textContent = isSuccessful ? 'Analysis Completed.' : 'Process Terminated.';

    // Hide loading skeleton
    const chartsSkeleton = document.getElementById('chartsSkeleton');
    if (chartsSkeleton) {
      chartsSkeleton.style.display = 'none';
    }
    
    setTimeout(() => {
      this.stepperProgress.classList.remove('visible');
      this.stepperBarFill.style.width = '0%';
    }, 1200);

    if (isSuccessful) {
      // Complete all nodes
      Object.keys(this.nodes).forEach(k => this._updateNodeState(k, 'done'));
      Object.keys(this.arrows).forEach(k => this._updateArrowState(k, 'done'));
    } else {
      // Revert states
      Object.keys(this.nodes).forEach(k => this._updateNodeState(k, ''));
      Object.keys(this.arrows).forEach(k => this._updateArrowState(k, ''));
    }
  }

  /* --- API Execution Call --- */
  async _executeAnalysis() {
    if (!this.qFile.files[0]) return;
    
    this.runBtn.disabled = true;
    this.runBtn.innerHTML = '<span class="stepper-spinner"></span>PROCESSING';
    
    this._clearResults();
    this._startProcessIndicators();

    // Scroll down to the AI Engine visualizer to watch flow in action
    const engineSection = document.getElementById('engine-visualizer');
    if (engineSection) {
      window.scrollTo({ top: engineSection.offsetTop - 70, behavior: 'smooth' });
    }

    try {
      const formData = new FormData();
      formData.append('questions_file', this.qFile.files[0]);
      if (this.dFile.files[0]) {
        formData.append('data_file', this.dFile.files[0]);
      }

      const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? ''
        : 'https://ai-agent-duvu.onrender.com';

      const response = await fetch(`${backendUrl}/api`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errMsg = `HTTP Error ${response.status}`;
        try {
          const detail = await response.json();
          if (detail.detail) errMsg = detail.detail;
        } catch {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      this._stopProcessIndicators(true);
      this._renderResults(data);

    } catch (error) {
      this._stopProcessIndicators(false);
      this._renderError(error.message || 'Unknown server error');
    } finally {
      this.runBtn.disabled = false;
    this.runBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px;display:block;">
          <polygon points="6 3 20 12 6 21 6 3"/>
        </svg>
        START ANALYSIS
      `;
    }
  }

  _clearResults() {
    this.resultsContainer.innerHTML = '';
    const chartsContainer = document.getElementById('chartsContainer');
    if (chartsContainer) chartsContainer.innerHTML = '';
    const chartsSection = document.getElementById('chartsSection');
    if (chartsSection) chartsSection.style.display = 'none';
    const chartsSkeleton = document.getElementById('chartsSkeleton');
    if (chartsSkeleton) chartsSkeleton.style.display = 'none';
    this.resultsSection.classList.remove('visible');
  }

  _renderResults(data) {
    if (data.error) {
      this._renderError(data.error);
      return;
    }

    // Extract charts if present
    const charts = data.charts || {};
    const dataCopy = { ...data };
    delete dataCopy.charts;

    const entries = Object.entries(dataCopy);
    if (!entries.length) {
      this._renderError('Analysis returned no output entries.');
      return;
    }

    // Prepare Results Section UI
    this.resultsCount.textContent = `${entries.length} ANSWER${entries.length !== 1 ? 'S' : ''}`;
    this.resultsSection.classList.add('visible');

    // Create cards for each answer
    entries.forEach(([question, answer], index) => {
      const card = document.createElement('div');
      card.className = 'res-card';
      
      const header = document.createElement('div');
      header.className = 'res-q-header';
      header.innerHTML = `
        <div class="res-q-badge">${index + 1}</div>
        <div class="res-q-text">${this._escapeHTML(question)}</div>
      `;

      const body = document.createElement('div');
      body.className = 'res-ans-body';
      this._renderAnswerContent(answer, body);

      card.appendChild(header);
      card.appendChild(body);
      this.resultsContainer.appendChild(card);
    });

    // Render charts in dedicated section
    this._renderChartsSection(charts);

    // Smooth scroll down to Results
    setTimeout(() => {
      window.scrollTo({
        top: this.resultsSection.offsetTop - 70,
        behavior: 'smooth'
      });
      // Trigger a subtle GSAP slide in for each card
      gsap.from('.res-card, .chart-card', {
        y: 30,
        opacity: 0,
        stagger: 0.15,
        duration: 0.6,
        ease: 'power3.out'
      });
    }, 200);
  }

  _renderChartsSection(charts) {
    const chartsSection = document.getElementById('chartsSection');
    const chartsContainer = document.getElementById('chartsContainer');
    
    if (!chartsSection || !chartsContainer) return;
    
    chartsContainer.innerHTML = '';
    
    const entries = Object.entries(charts);
    if (!entries.length) {
      chartsSection.style.display = 'none';
      return;
    }
    
    chartsSection.style.display = 'block';
    
    entries.forEach(([key, value]) => {
      const imgSrc = this._checkImageURI(value);
      if (!imgSrc) return;
      
      const chartCard = document.createElement('div');
      chartCard.className = 'chart-card';
      chartCard.style.background = 'var(--card-bg, #1e293b)';
      chartCard.style.border = '1px solid var(--border, #334155)';
      chartCard.style.borderRadius = '8px';
      chartCard.style.padding = '24px';
      chartCard.style.marginBottom = '20px';
      chartCard.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
      
      const title = document.createElement('h3');
      title.textContent = key.replace(/_/g, ' ').toUpperCase();
      title.style.color = 'var(--text-secondary, #94a3b8)';
      title.style.fontSize = '0.9rem';
      title.style.fontFamily = 'var(--font-mono, monospace)';
      title.style.letterSpacing = '0.05em';
      title.style.marginBottom = '12px';
      title.style.fontWeight = 'bold';
      
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'res-image-wrapper';
      imgWrapper.style.width = '100%';
      imgWrapper.style.textAlign = 'center';
      imgWrapper.style.display = 'block';
      
      const img = document.createElement('img');
      img.src = imgSrc;
      img.alt = key;
      img.style.width = '100%';
      img.style.maxWidth = '900px';
      img.style.borderRadius = '8px';
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => this._openLightbox(imgSrc));
      
      const hint = document.createElement('div');
      hint.className = 'res-image-hint';
      hint.textContent = '🔍 CLICK CHART TO EXPAND';
      hint.style.marginTop = '8px';
      
      imgWrapper.appendChild(img);
      imgWrapper.appendChild(hint);
      chartCard.appendChild(title);
      chartCard.appendChild(imgWrapper);
      chartsContainer.appendChild(chartCard);
    });
  }

  _cleanBase64FromObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const clean = Array.isArray(obj) ? [] : {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string') {
        const trimmed = v.trim();
        if (/^data:image\//i.test(trimmed) || (/^[A-Za-z0-9+/=\r\n]+$/.test(trimmed) && trimmed.length > 200)) {
          clean[k] = "[Generated Chart Image]";
        } else {
          clean[k] = v;
        }
      } else if (typeof v === 'object' && v !== null) {
        clean[k] = this._cleanBase64FromObject(v);
      } else {
        clean[k] = v;
      }
    }
    return clean;
  }

  _renderAnswerContent(value, container) {
    const imgSrc = this._checkImageURI(value);
    
    if (imgSrc) {
      const wrap = document.createElement('div');
      wrap.className = 'res-image-wrapper';
      
      const img = document.createElement('img');
      img.src = imgSrc;
      img.alt = 'Analysis Chart';
      img.addEventListener('click', () => this._openLightbox(imgSrc));
      
      const hint = document.createElement('div');
      hint.className = 'res-image-hint';
      hint.textContent = '🔍 CLICK CHART TO EXPAND';
      
      wrap.appendChild(img);
      wrap.appendChild(hint);
      container.appendChild(wrap);
      return;
    }

    const cleanValue = this._cleanBase64FromObject(value);
    const rawText = (cleanValue && typeof cleanValue === 'object') ? JSON.stringify(cleanValue, null, 2) : String(cleanValue ?? '');
    
    if (rawText.length > 120 || rawText.includes('\n')) {
      const pre = document.createElement('pre');
      pre.className = 'res-code-block';
      pre.textContent = rawText;
      container.appendChild(pre);
    } else {
      const p = document.createElement('p');
      p.className = 'res-text-block';
      p.textContent = rawText;
      container.appendChild(p);
    }
  }

  _renderError(message) {
    this.resultsSection.classList.add('visible');
    this.resultsCount.textContent = 'ERROR';
    
    const errPanel = document.createElement('div');
    errPanel.className = 'error-terminal';
    errPanel.innerHTML = `
      <div class="error-term-header">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h4>Analysis Pipeline Failed</h4>
      </div>
      <div class="error-term-msg">${this._escapeHTML(message)}</div>
    `;
    this.resultsContainer.appendChild(errPanel);

    // Scroll to results
    setTimeout(() => {
      window.scrollTo({
        top: this.resultsSection.offsetTop - 70,
        behavior: 'smooth'
      });
    }, 200);
  }

  _checkImageURI(value) {
    if (!value) return null;
    
    if (typeof value === 'string') {
      const rawStr = value.trim();
      if (/^data:image\//i.test(rawStr)) return rawStr;
      if (/^[A-Za-z0-9+/=\r\n]+$/.test(rawStr) && rawStr.length > 200) {
        return 'data:image/png;base64,' + rawStr;
      }
      return null;
    }
    
    if (typeof value === 'object') {
      for (const key of ['image', 'base64', 'plot', 'data', 'chart', 'value', 'answer']) {
        if (value[key] && typeof value[key] === 'string') {
          const detected = this._checkImageURI(value[key]);
          if (detected) return detected;
        }
      }
      for (const key in value) {
        if (value[key] && typeof value[key] === 'string') {
          const detected = this._checkImageURI(value[key]);
          if (detected) return detected;
        }
      }
    }
    return null;
  }

  _escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* --- Lightbox Action Methods --- */
  _openLightbox(src) {
    this.lbImg.src = src;
    this.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  _closeLightbox() {
    this.lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  _resetUI() {
    this._clearQuestion();
    this._clearDataset();
    this._clearResults();
    this._stopProcessIndicators(false);
  }

  /* ==========================================================================
     GSAP PREMIUM LAYOUT ANIMATIONS
     ========================================================================== */
  _initAnimations() {
    // Check if GSAP is available in scope
    if (typeof gsap === 'undefined') {
      console.warn('GSAP is not loaded. Skipping premium animations.');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // 1. Hero Floating Visual panels
    gsap.to('.panel-chart', {
      y: -15,
      x: 5,
      rotation: 1,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    gsap.to('.panel-table', {
      y: 15,
      x: -5,
      rotation: -1,
      duration: 5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 0.5
    });

    gsap.to('.panel-nodes', {
      y: -10,
      x: -10,
      duration: 4.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 0.2
    });

    // 2. Hero Text Reveal Animation
    gsap.from('.hero-left h1 span', {
      y: 80,
      opacity: 0,
      stagger: 0.15,
      duration: 1.2,
      ease: 'power4.out'
    });

    gsap.from('.hero-left .subheading, .hero-left .eyebrow-tag, .hero-left .hero-actions', {
      y: 30,
      opacity: 0,
      stagger: 0.1,
      duration: 1,
      ease: 'power3.out',
      delay: 0.4
    });

    // 3. Scroll Reveal for How It Works
    gsap.from('#how-it-works .how-it-works-intro h2, #how-it-works .how-it-works-intro p', {
      scrollTrigger: {
        trigger: '#how-it-works',
        start: 'top 80%',
      },
      y: 30,
      opacity: 0,
      stagger: 0.15,
      duration: 0.8,
      ease: 'power3.out'
    });

    gsap.from('.scroll-step-card', {
      scrollTrigger: {
        trigger: '.horizontal-scroll-container',
        start: 'top 85%'
      },
      y: 40,
      opacity: 0,
      stagger: 0.2,
      duration: 0.8,
      ease: 'power3.out'
    });

    // 4. Scroll Reveal for Upload zone
    gsap.from('.premium-upload-container', {
      scrollTrigger: {
        trigger: '#upload-zone-section',
        start: 'top 75%'
      },
      y: 40,
      opacity: 0,
      stagger: 0.2,
      duration: 0.8,
      ease: 'power3.out'
    });

    // 5. Scroll triggers for full screen Feature panels
    document.querySelectorAll('.feature-bleed-section').forEach((section, index) => {
      gsap.from(section.querySelector('.feature-info'), {
        scrollTrigger: {
          trigger: section,
          start: 'top 70%'
        },
        x: index % 2 === 0 ? -50 : 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
      });

      gsap.from(section.querySelector('.feature-canvas'), {
        scrollTrigger: {
          trigger: section,
          start: 'top 70%'
        },
        scale: 0.9,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
      });
    });

    // 6. Monitor Screen Typist Simulator in Section 6 (Live Preview)
    this._initTypistEffect();

  }

  _initTypistEffect() {
    const termCodeLines = [
      'df = pd.read_csv("dataset.csv")',
      'revenue_by_product = df.groupby("Product")["Revenue"].sum()',
      'highest_revenue_prod = revenue_by_product.idxmax()',
      'print(f"Product: {highest_revenue_prod}, Rev: {revenue_by_product.max()}")'
    ];

    const targetEl = document.getElementById('typing-code-block');
    if (!targetEl) return;

    let lineIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const type = () => {
      const currentLine = termCodeLines[lineIndex];
      
      if (!isDeleting) {
        targetEl.textContent = currentLine.substring(0, charIndex + 1) + '█';
        charIndex++;

        if (charIndex === currentLine.length) {
          // Pause at end of line
          setTimeout(() => {
            isDeleting = true;
            type();
          }, 2500);
          return;
        }
      } else {
        targetEl.textContent = currentLine.substring(0, charIndex - 1) + '█';
        charIndex--;

        if (charIndex === 0) {
          isDeleting = false;
          lineIndex = (lineIndex + 1) % termCodeLines.length;
          // Short pause before starting next line
          setTimeout(type, 500);
          return;
        }
      }

      const delay = isDeleting ? 25 : 60 + Math.random() * 50;
      setTimeout(type, delay);
    };

    // Trigger typing effect slightly delayed when scrolled into view
    ScrollTrigger.create({
      trigger: '#live-preview',
      start: 'top 65%',
      onEnter: () => setTimeout(type, 500),
      once: true
    });
  }
}

// Instantiate App
document.addEventListener('DOMContentLoaded', () => {
  window.appInstance = new DataAnalystAgent();
});
