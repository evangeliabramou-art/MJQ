// Monkey Movement Drop-in (no framework).
// Usage:
// 1) Include monkey_movement.css and monkey_movement.js in your HTML (before </body>)
// 2) Make sure your images are at assets/images/monkey_standing.png (and sitting if you use it)
// 3) Option A: Add data-monkey-stage to your game container: <div id="maze" data-monkey-stage></div>
//    Option B: It will fall back to a full-screen overlay.
// 4) Optional: call Monkey.init('#maze') or Monkey.init() to auto-attach.
//
// It will automatically move the monkey toward any element with class ".banana"
// and follow clicks on ".cell" (maze tiles). You can also use Monkey.toElement(el, 'climb').

(function(){
  const Monkey = {
    layer: null,
    img: null,
    stage: null,   // element that bounds positioning; if null uses overlay
    facing: 1,
    walking: false,
    ready: false,
    size: 140,

    init(stageSelector){
      // Create overlay layer once
      if(!document.getElementById('monkeyLayer')){
        const layer = document.createElement('div');
        layer.id = 'monkeyLayer';
        layer.setAttribute('aria-hidden','true');
        document.body.appendChild(layer);
      }
      this.layer = document.getElementById('monkeyLayer');

      // Decide stage: explicit selector, or first [data-monkey-stage], or overlay itself
      this.stage = stageSelector ? document.querySelector(stageSelector)
                  : document.querySelector('[data-monkey-stage]') || this.layer;

      // Ensure stage is position relative if it's not the overlay
      if(this.stage !== this.layer){
        const cs = getComputedStyle(this.stage);
        if(cs.position === 'static'){ this.stage.style.position = 'relative'; }
      }

      // Create monkey image if missing
      if(!document.getElementById('monkey')){
        const img = document.createElement('img');
        img.id = 'monkey';
        img.alt = 'Monkey';
        img.src = 'assets/images/monkey_standing.png';
        img.className = 'idle';
        img.style.width = this.size + 'px';
        this.layer.appendChild(img);
      }
      this.img = document.getElementById('monkey');

      // Start position near bottom-left of stage/viewport
      this.startAt(16, (this._hostH() - this.img.height) - 18);

      // Event delegation for bananas and maze cells
      document.addEventListener('click', (e)=>{
        const b = e.target.closest('.banana');
        if(b){ this.toElement(b, 'climb'); return; }
        const c = e.target.closest('.cell');
        if(c){ this.toElement(c, 'walk'); return; }
      }, true);

      this.ready = true;
      return this;
    },

    setSize(px){
      this.size = px;
      if(this.img) this.img.style.width = px + 'px';
    },

    startAt(x, y){ // top-left coords in stage space
      const pos = this._toStagePos(x, y);
      this.img.style.left = pos.x + 'px';
      this.img.style.top  = pos.y + 'px';
    },

    to(x, y, ms = 900, mode = 'walk'){
      const pos = this._toStagePos(x, y);
      this._glide(pos.x, pos.y, ms, mode);
    },

    toElement(el, mode = 'walk'){
      if(!el) return;
      const ref = (this.stage === this.layer) ? this.layer : this.stage;
      const sr = ref.getBoundingClientRect();
      const br = el.getBoundingClientRect();
      const x = (br.left - sr.left) + br.width/2 - this.img.width/2;
      const y = (br.top  - sr.top)  + br.height/2 - this.img.height/2 - (mode==='climb'?12:0);
      this._glide(x, y, 900, mode);
    },

    face(dir){
      this.facing = dir;
      this.img.style.transform = `scaleX(${dir})`;
    },

    // Internal helpers
    _hostW(){ return (this.stage===this.layer? window.innerWidth : this.stage.clientWidth); },
    _hostH(){ return (this.stage===this.layer? window.innerHeight: this.stage.clientHeight); },
    _toStagePos(x, y){
      // If overlay stage, position is viewport; if custom stage, offset relative to it
      return { x: Math.max(0, Math.min(this._hostW()-this.img.width, x)),
               y: Math.max(0, Math.min(this._hostH()-this.img.height, y)) };
    },

    _stopAnims(){
      this.img.classList.remove('walk','climb');
      if(!this.img.classList.contains('idle')) this.img.classList.add('idle');
    },

    _glide(x, y, ms, mode){
      const sx = parseFloat(this.img.style.left || 0);
      const sy = parseFloat(this.img.style.top  || 0);
      const dir = (x >= sx) ? 1 : -1;
      this.face(dir);
      this.img.classList.remove('idle');
      this.img.classList.add(mode==='climb' ? 'climb' : 'walk');
      const start = performance.now();
      const ease = t => 1 - Math.pow(1-t, 3);
      const step = (t)=>{
        const p = Math.min((t-start)/ms, 1);
        const v = ease(p);
        this.img.style.left = (sx + (x - sx)*v) + 'px';
        this.img.style.top  = (sy + (y - sy)*v) + 'px';
        if(p<1){ requestAnimationFrame(step); }
        else { this._stopAnims(); }
      };
      requestAnimationFrame(step);
    }
  };

  // expose
  window.Monkey = Monkey;

  // Auto-init after DOM ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ()=>Monkey.init());
  } else {
    Monkey.init();
  }
})(); 
