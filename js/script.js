/* ============================================================
   Avyagraha Research and Analytics LLP - site behaviour
   Tech logos live in js/logos.js (loaded before this file).
   ============================================================ */

/* ============================================================
   ENQUIRY FORM BACKEND
   Create a free form at https://formspree.io (or web3forms.com),
   then paste your endpoint URL below. Until then the form falls
   back to opening the visitor's email client.
   ============================================================ */
const FORM_ENDPOINT="https://formsubmit.co/ajax/avinashstat@aviqlabs.com"; // emails submissions to avinashstat@aviqlabs.com (one-time activation required)
function submitEnquiry(e){
  e.preventDefault();
  const f=document.getElementById('enquiryForm'),btn=document.getElementById('enquiryBtn'),st=document.getElementById('formStatus');
  const data={
    name:f.name.value.trim(), phone:f.phone.value.trim(), email:f.email.value.trim(),
    requirement:f.requirement.value, message:f.message.value.trim()
  };
  /* honeypot: bots fill hidden fields, people never see them */
  if(f._honey && f._honey.value){st.className='form-status ok';st.textContent='Thank you. Your enquiry has been received.';f.reset();return;}
  if(!data.name||!data.email||!data.phone){
    st.className='form-status err';st.textContent='Please fill in your name, phone and email.';
    /* send focus to the first empty field so keyboard and screen-reader users land on the problem */
    (!data.name?f.name:!data.phone?f.phone:f.email).focus();
    return;
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)){
    st.className='form-status err';st.textContent='Please enter a valid email address.';f.email.focus();return;
  }
  data._subject='New website enquiry from '+data.name;
  delete data._honey;
  data._template='table';
  data._captcha='false';
  if(!FORM_ENDPOINT){
    const body=encodeURIComponent(`Name: ${data.name}\nPhone: ${data.phone}\nEmail: ${data.email}\nRequirement: ${data.requirement}\n\n${data.message}`);
    window.location.href=`mailto:avinashstat@aviqlabs.com?subject=${encodeURIComponent('Website enquiry from '+data.name)}&body=${body}`;
    st.className='form-status info';st.textContent='Opening your email app. Add the Formspree endpoint in the code to receive submissions directly.';
    return;
  }
  btn.disabled=true;const label=btn.textContent;btn.textContent='Sending...';st.className='form-status info';st.textContent='';
  fetch(FORM_ENDPOINT,{method:'POST',headers:{'Accept':'application/json','Content-Type':'application/json'},body:JSON.stringify(data)})
    .then(r=>{if(r.ok){f.reset();st.className='form-status ok';st.textContent='Thank you. Your enquiry has been received, we will call you back within one working day.';}
      else{st.className='form-status err';st.textContent='Something went wrong. Please email avinashstat@aviqlabs.com directly.';}})
    .catch(()=>{st.className='form-status err';st.textContent='Network error. Please email avinashstat@aviqlabs.com directly.';})
    .finally(()=>{btn.disabled=false;btn.textContent=label;});
}

/* ===== mobile menu ===== */
const burger=document.getElementById('burger'),menu=document.getElementById('menu');
function setMenu(open){
  menu.classList.toggle('open',open);
  burger.classList.toggle('is-open',open);
  burger.setAttribute('aria-expanded',open?'true':'false');
  document.body.classList.toggle('menu-lock',open);
}
burger.addEventListener('click',()=>setMenu(!menu.classList.contains('open')));
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
document.addEventListener('keydown',e=>{
  if(!menu.classList.contains('open'))return;
  if(e.key==='Escape'){setMenu(false);burger.focus();return;}
  if(e.key==='Tab'&&typeof trapFocus==='function')trapFocus(menu,e);
});
/* the drawer is only a modal at drawer widths; keep the panel out of the
   tab order entirely when it is off-screen */
(function(){
  var mq=window.matchMedia('(max-width:1040px)');
  function sync(){
    /* off-screen drawer: take it out of the tab order so focus cannot
       land on links the user cannot see. `inert` also hides it from
       assistive tech, so no separate aria-hidden is needed. */
    var closedDrawer=mq.matches&&!menu.classList.contains('open');
    if('inert' in HTMLElement.prototype){menu.inert=closedDrawer;}
    else{menu.querySelectorAll('a').forEach(function(a){
      if(closedDrawer)a.setAttribute('tabindex','-1');else a.removeAttribute('tabindex');
    });}
    burger.setAttribute('aria-expanded',menu.classList.contains('open')?'true':'false');
  }
  mq.addEventListener?mq.addEventListener('change',sync):mq.addListener(sync);
  menu.addEventListener('transitionend',sync);
  burger.addEventListener('click',function(){setTimeout(sync,0);});
  sync();
})();

/* ===== header rule once the page is scrolled ===== */
(function(){
  var header=document.querySelector('header.site');
  if(!header)return;
  function onScroll(){header.classList.toggle('scrolled',window.scrollY>8);}
  window.addEventListener('scroll',onScroll,{passive:true});
  onScroll();
})();

/* ===== scroll reveal =====================================================
   One observer, one motion language. Elements reveal once and are then
   unobserved. Groups marked [data-stagger] hand their children an
   increasing transition-delay so lines arrive in sequence rather than
   all at once. Everything is opacity + transform only.
   ======================================================================= */
var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var STAGGER = 70;    /* ms between siblings */
var STAGGER_MAX = 6; /* stop compounding so long lists never feel slow */

if(!REDUCED){
  document.querySelectorAll('[data-stagger]').forEach(function(group){
    var kids=[].slice.call(group.children).filter(function(k){return k.classList.contains('reveal');});
    kids.forEach(function(k,i){
      k.style.transitionDelay=(Math.min(i,STAGGER_MAX)*STAGGER)+'ms';
    });
  });
  /* the vision chart draws its segments in wheel order */
  document.querySelectorAll('.av-wheel').forEach(function(w){
    var parts=w.querySelectorAll('.wseg, .wheel>g');
    for(var i=0;i<parts.length;i++){
      parts[i].style.transitionDelay=(Math.min(Math.floor(i/2),8)*60)+'ms';
    }
  });
}

const io=new IntersectionObserver(function(es){
  es.forEach(function(e){
    if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
  });
},{threshold:0.12,rootMargin:'0px 0px -60px 0px'});
document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});

/* ===== count-up (once, on visibility) ===== */
function count(el){
  const t=+el.dataset.target,suf=el.dataset.suffix||'',pad=+el.dataset.pad||0,dur=1500,s=performance.now();
  if(REDUCED){el.textContent=(pad?String(t).padStart(pad,'0'):t)+suf;return;}
  function step(n){
    const p=Math.min((n-s)/dur,1),v=Math.round(t*(1-Math.pow(1-p,3)));
    el.textContent=(pad?String(v).padStart(pad,'0'):v)+suf;
    if(p<1)requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
if(REDUCED){
  /* no animation to wait for - show the real figures straight away */
  document.querySelectorAll('[data-target]').forEach(function(el){count(el);});
}else{
  const cio=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting){count(e.target);cio.unobserve(e.target);}});},{threshold:0.5});
  document.querySelectorAll('[data-target]').forEach(function(el){cio.observe(el);});
}

/* ===== lightbox ===== */
var lbOpener=null;
function openLightbox(el){
  var img=el.querySelector('img');
  var cap=el.querySelector('.ev-cap b');
  lbOpener=el;
  document.getElementById('lbImg').src=img.getAttribute('src');
  document.getElementById('lbImg').alt=img.getAttribute('alt')||'';
  document.getElementById('lbCap').textContent=cap?cap.textContent:'';
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow='hidden';
  document.querySelector('.lb-x').focus();
}
function closeLightbox(){
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow='';
  if(lbOpener){lbOpener.focus();lbOpener=null;}
}
/* ===== focus trap =========================================================
   Keeps Tab inside whichever surface is acting as a modal (the photo
   viewer, the mobile drawer) so keyboard users cannot tab out into the
   page behind it.
   ======================================================================= */
var FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function trapFocus(container,e){
  if(e.key!=='Tab')return;
  var items=[].slice.call(container.querySelectorAll(FOCUSABLE))
              .filter(function(el){return el.offsetParent!==null||el===document.activeElement;});
  if(!items.length)return;
  var first=items[0],last=items[items.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
}

(function(){
  var lb=document.getElementById('lightbox');
  if(lb)lb.addEventListener('click',function(e){if(e.target===lb)closeLightbox();});
  document.addEventListener('keydown',function(e){
    if(!lb||!lb.classList.contains('open'))return;
    if(e.key==='Escape'){closeLightbox();return;}
    trapFocus(lb,e);
  });
  /* make the keyboard behave like the mouse on gallery tiles */
  document.querySelectorAll('[role="button"][tabindex="0"]').forEach(function(el){
    el.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}
    });
  });
})();

/* ===== swap in the technology logos ===== */
(function(){
  if(typeof LOGOS==='undefined')return;
  document.querySelectorAll('img[data-logo]').forEach(function(i){
    var u=LOGOS[i.getAttribute('data-logo')];
    if(u)i.src=u;
  });
})();

/* ===== invited-talk carousels ===== */
function itShow(frame,idx){
  var slides=frame.querySelectorAll('.it-slide');
  var dots=frame.querySelectorAll('.it-dot');
  var count=frame.querySelector('.it-count');
  for(var i=0;i<slides.length;i++){
    slides[i].classList.toggle('active',i===idx);
    slides[i].setAttribute('aria-hidden',i===idx?'false':'true');
  }
  for(var j=0;j<dots.length;j++){
    dots[j].classList.toggle('active',j===idx);
    if(j===idx)dots[j].setAttribute('aria-current','true'); else dots[j].removeAttribute('aria-current');
  }
  if(count)count.textContent=(idx+1)+' / '+slides.length;
}
function itMove(btn,dir){
  var frame=btn.closest('.it-frame');
  var slides=frame.querySelectorAll('.it-slide');
  if(slides.length<2)return;
  var cur=0;for(var i=0;i<slides.length;i++){if(slides[i].classList.contains('active'))cur=i;}
  itShow(frame,(cur+dir+slides.length)%slides.length);
}
/* arrow keys move the carousel the pointer or focus is inside */
document.querySelectorAll('.it-frame').forEach(function(frame){
  frame.addEventListener('keydown',function(e){
    if(e.key==='ArrowLeft')itMove(frame.querySelector('.it-prev'),-1);
    if(e.key==='ArrowRight')itMove(frame.querySelector('.it-next'),1);
  });
});

/* ===== invited talks: show the latest six, reveal the rest on demand ===== */
(function(){
  var btn=document.getElementById('talksToggle');
  var grid=document.getElementById('talksGrid');
  if(!btn||!grid)return;
  var hidden=[].slice.call(grid.querySelectorAll('.it-card[hidden]'));
  var total=grid.querySelectorAll('.it-card').length;
  var shown=total-hidden.length;
  var label=btn.querySelector('.tt-label');
  var countEl=document.getElementById('talksCount');
  /* derive the counter from the DOM so adding a talk never leaves it stale */
  if(countEl)countEl.textContent='Showing '+shown+' of '+total+' talks';
  btn.addEventListener('click',function(){
    var open=btn.getAttribute('aria-expanded')==='true';
    hidden.forEach(function(c){
      c.hidden=open;
      if(!open)c.classList.add('in');       /* already past the reveal observer */
    });
    btn.setAttribute('aria-expanded',open?'false':'true');
    label.textContent=open?'View all invited talks':'Show fewer talks';
    if(countEl)countEl.textContent=open?('Showing '+shown+' of '+total+' talks')
                                      :('Showing all '+total+' talks');
    if(open){
      /* collapsing can leave the viewport below the section - bring it back */
      var top=grid.getBoundingClientRect().top+window.scrollY-120;
      if(window.scrollY>top)window.scrollTo({top:top,behavior:REDUCED?'auto':'smooth'});
      btn.focus();
    }else{
      hidden[0].querySelector('h3').setAttribute('tabindex','-1');
      hidden[0].querySelector('h3').focus();   /* move focus to the newly revealed content */
    }
  });
})();

/* ===== sample-output gallery (Aerial Intelligence section) ===== */
function geoShow(i){
  var ov=document.getElementById('geoGal'); if(!ov)return;
  var sl=ov.querySelectorAll('.geo-slide'), dt=ov.querySelectorAll('.geo-dot');
  if(!sl.length)return;
  i=(i+sl.length)%sl.length;
  for(var k=0;k<sl.length;k++){
    sl[k].classList.toggle('active',k===i);
    sl[k].setAttribute('aria-hidden',k===i?'false':'true');
  }
  for(var j=0;j<dt.length;j++){
    dt[j].classList.toggle('active',j===i);
    if(j===i)dt[j].setAttribute('aria-current','true'); else dt[j].removeAttribute('aria-current');
  }
  var cap=document.getElementById('geoCap'), cnt=document.getElementById('geoCount');
  if(cap)cap.textContent=sl[i].getAttribute('data-cap')||'';
  if(cnt)cnt.textContent=(i+1)+' / '+sl.length;
}
function geoMove(dir){
  var ov=document.getElementById('geoGal'); if(!ov)return;
  var sl=ov.querySelectorAll('.geo-slide'); var cur=0;
  for(var i=0;i<sl.length;i++){if(sl[i].classList.contains('active'))cur=i;}
  geoShow(cur+dir);
}
document.querySelectorAll('.geo-stage').forEach(function(stage){
  stage.addEventListener('keydown',function(e){
    if(e.key==='ArrowLeft'){e.preventDefault();geoMove(-1);}
    if(e.key==='ArrowRight'){e.preventDefault();geoMove(1);}
  });
});

/* ===== scrollspy: highlight the current section in the menu bar ===== */
(function(){
  var menu=document.getElementById('menu');
  if(!menu)return;
  var links=[].slice.call(menu.querySelectorAll('a[href^="#"]')).filter(function(a){return !a.classList.contains('enq');});
  var items=links.map(function(a){
    var el=document.getElementById(a.getAttribute('href').slice(1));
    return el?{a:a,el:el}:null;
  }).filter(Boolean);
  if(!items.length)return;
  var header=document.querySelector('header.site');
  function spy(){
    var offset=(header?header.offsetHeight:0)+24;
    var y=window.scrollY+offset;
    var cur=items[0];
    for(var i=0;i<items.length;i++){
      var top=items[i].el.getBoundingClientRect().top+window.scrollY;
      if(top<=y)cur=items[i];
    }
    if(window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-2)cur=items[items.length-1];
    links.forEach(function(a){
      var on=a===cur.a;
      a.classList.toggle('active',on);
      if(on)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll',spy,{passive:true});
  window.addEventListener('resize',spy);
  spy();
})();
