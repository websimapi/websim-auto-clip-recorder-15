import { OUTRO_CLIPS, DEFAULT_OUTRO_REGIONS, createAudioPlayer, drawWaveform } from './audioLibrary.js';

let selectedOutro = { id: "hype_radio_2", file: "/hey_hype_radio (2).mp3", region: null };
const outroSelections = new Map();
const player = createAudioPlayer();

export function getSelectedOutro(){ return selectedOutro; }

export function initOutroSelector(container){
  container.innerHTML=''; 
  OUTRO_CLIPS.forEach(clip=>{
    const card=document.createElement('div'); card.className='clip audio-clip'; if(clip.id===selectedOutro.id) card.classList.add('selected');
    card.innerHTML=`<div class="clip-info"><span class="audio-label">${clip.label}</span><button class="play-btn">▶︎</button></div><div class="audio-waveform"><canvas></canvas></div><div class="audio-times">--:--</div>`;
    const playBtn=card.querySelector('.play-btn'); const waveDiv=card.querySelector('.audio-waveform'); const canvas=card.querySelector('canvas'); const times=card.querySelector('.audio-times');
    card.addEventListener('click',(e)=>{ if(e.target===playBtn) return; selectedOutro.id=clip.id; selectedOutro.file=clip.file; selectedOutro.region=outroSelections.get(clip.id)||null; initOutroSelector(container); });
    playBtn.addEventListener('click',(e)=>{ e.stopPropagation(); player.play(clip.id, clip.file, { regionSec: outroSelections.get(clip.id) }); });

    let sel=null, dragging=false, dur=0, bufRef=null;
    const toTime=x=>Math.max(0,Math.min(1,x/waveDiv.clientWidth));
    const tick=()=>{ const p=player.getProgressX(clip.id); if(bufRef) drawWaveform(canvas,bufRef,sel,p); requestAnimationFrame(tick); };
    player.ensureBuffer(clip.id, clip.file).then(buf=>{ bufRef=buf; dur=buf.duration;
      const def=DEFAULT_OUTRO_REGIONS.get(clip.id); if(def){ sel={start:def[0]/dur,end:def[1]/dur}; outroSelections.set(clip.id,{start:def[0],end:def[1]}); times.textContent=`${def[0].toFixed(2)}s – ${def[1].toFixed(2)}s`; if(clip.id===selectedOutro.id && !selectedOutro.region) selectedOutro.region={start:def[0],end:def[1]}; } else { times.textContent=`Full clip: ${dur.toFixed(2)}s`; }
      drawWaveform(canvas,bufRef,sel,null); tick();
    });
    waveDiv.addEventListener('pointerdown',e=>{ e.preventDefault(); dragging=true; sel={start:toTime(e.offsetX),end:toTime(e.offsetX)}; });
    waveDiv.addEventListener('pointermove',e=>{ if(!dragging) return; sel.end=toTime(e.offsetX); if(bufRef){ const a=Math.min(sel.start,sel.end)*dur,b=Math.max(sel.start,sel.end)*dur; times.textContent=`${a.toFixed(2)}s – ${b.toFixed(2)}s`; }});
    window.addEventListener('pointerup',()=>{ 
      if(!dragging) return; 
      dragging=false; 
      if(Math.abs(sel.end-sel.start)<0.005){ 
        sel=null; 
        outroSelections.delete(clip.id); 
        times.textContent=`Full clip: ${dur.toFixed(2)}s`; 
      } else { 
        const a=Math.min(sel.start,sel.end)*dur, b=Math.max(sel.start,sel.end)*dur; 
        outroSelections.set(clip.id,{start:a,end:b}); 
      }
      if(clip.id===selectedOutro.id) selectedOutro.region=outroSelections.get(clip.id)||null;
    });

    container.appendChild(card);
  });
}