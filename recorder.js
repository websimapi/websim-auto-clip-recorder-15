export function createRecorder({ onNewRawClip, autoSplitOnCaptured, onIframeNavSplit }){
  let captureStream=null, recorder=null, chunks=[], state='idle'; // idle, recording, stopping
  let continuousChunks=[], continuousStartTime=0, clipMarkers=[];
  let heur={ interval:null, videoEl:null, canvas:null, ctx:null };

  async function pickTab(){
    try{
      captureStream = await navigator.mediaDevices.getDisplayMedia({ video:{ displaySurface:"browser", frameRate:30, cursor:"motion" }, audio:true });
      document.getElementById("btn-start").disabled=false;
      document.getElementById("btn-split").disabled=true;
      document.getElementById("btn-stop").disabled=true;
      captureStream.getVideoTracks()[0].addEventListener("ended", ()=>stop());
    }catch(e){ console.error(e); alert("Tab picking was canceled or not permitted."); }
  }

  function setupRecorder(){
    if (!captureStream) return;
    recorder = new MediaRecorder(captureStream, { mimeType:"video/webm;codecs=vp9,opus" });
    chunks = [];
    recorder.ondataavailable = e=>{ 
      if(e.data && e.data.size>0) {
        chunks.push(e.data);
        continuousChunks.push({data: e.data, timestamp: Date.now()});
      }
    };
    recorder.onstop = async ()=>{
      const rawBlob=new Blob(chunks,{type:"video/webm"}); 
      chunks=[];
      
      await onNewRawClip(rawBlob, getLastClipMarker());
      
      if(state === 'stopping'){
        recorder = null;
        if(captureStream){ captureStream.getTracks().forEach(t=>t.stop()); captureStream=null; }
        document.getElementById("btn-start").disabled = true;
        document.getElementById("btn-stop").disabled = true;
        document.getElementById("btn-split").disabled = true;
        stopHeuristics();
        state = 'idle';
      } else if (state === 'recording') {
        setupRecorder();
        recorder.start(1000);
      }
    };
  }

  function getLastClipMarker(){
    return clipMarkers[clipMarkers.length - 1] || null;
  }

  function start(){
    if(!captureStream){ alert("Pick a tab first."); return; }
    if(state !== 'idle') return;
    
    state='recording'; 
    continuousStartTime = Date.now();
    continuousChunks = [];
    clipMarkers = [];
    setupRecorder(); 
    recorder.start(1000);

    document.getElementById("btn-start").disabled=true;
    document.getElementById("btn-stop").disabled=false;
    document.getElementById("btn-split").disabled=false;
    if(autoSplitOnCaptured()) startHeuristics();
  }

  function split(){ 
    if(recorder && state === 'recording'){ 
      const now = Date.now();
      clipMarkers.push({
        startTime: clipMarkers.length > 0 ? clipMarkers[clipMarkers.length - 1].endTime : continuousStartTime,
        endTime: now
      });
      recorder.stop(); 
    } 
  }

  function stop(){
    if(state === 'recording'){ 
      state='stopping';
      split();
    }
  }

  function getContinuousBlob(startTime, endTime){
    const relevantChunks = continuousChunks.filter(chunk => 
      chunk.timestamp >= startTime && chunk.timestamp <= endTime
    );
    return new Blob(relevantChunks.map(c => c.data), {type: "video/webm"});
  }

  function getRecordingBounds(){
    if (state === 'idle') return { startTime: 0, endTime: 0, totalDuration: 0 };
    return {
      startTime: continuousStartTime,
      endTime: Date.now(),
      totalDuration: Date.now() - continuousStartTime
    };
  }

  function startHeuristics(){
    if(!captureStream) return;
    const v=document.createElement("video"); v.srcObject=captureStream; v.muted=true; v.play().catch(()=>{});
    const c=document.createElement("canvas"); c.width=64; c.height=36; const x=c.getContext("2d"); let lastSig=null,lastMute=0;
    const vt=captureStream.getVideoTracks()[0]; vt.onmute=()=>{ lastMute=Date.now(); }; vt.onunmute=()=>{ if(state === 'recording' && Date.now()-lastMute<2000) split(); };
    heur.interval=setInterval(()=>{ if(state !== 'recording') return; try{ x.drawImage(v,0,0,c.width,c.height); const d=x.getImageData(0,0,c.width,c.height).data;
      let sum=0,varsum=0; for(let i=0;i<d.length;i+=4){ const g=(d[i]*0.2126+d[i+1]*0.7152+d[i+2]*0.0722); sum+=g; varsum+=g*g; }
      const n=d.length/4, mean=sum/n, std=Math.sqrt(Math.max(0,varsum/n-mean*mean)); const sig=mean+std*2; if(lastSig!==null && Math.abs(sig-lastSig)>40) split(); lastSig=sig;
    }catch{} },800);
    heur.videoEl=v; heur.canvas=c; heur.ctx=x;
  }
  function stopHeuristics(){ if(heur.interval) clearInterval(heur.interval); heur={ interval:null, videoEl:null, canvas:null, ctx:null }; }

  // hook iframe navigation auto-split
  const iframe=document.getElementById("navigator");
  if(iframe){ iframe.addEventListener("load", ()=>{ if(state === 'recording' && onIframeNavSplit()) split(); }); }

  return { pickTab, start, split, stop, isRecording:()=>state==='recording', getContinuousBlob, getRecordingBounds };
}