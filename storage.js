import { set as idbSet, get as idbGet, del as idbDel } from "idb-keyval";

const CLIP_KEY = "auto-clip-clips";

// We can't store Blobs directly in IndexedDB reliably across all browsers.
// A common strategy is to store them as ArrayBuffers or, for simplicity here,
// just store metadata and reconstruct what we can on load.
// For this app, we'll store metadata and if we have a blob URL, we can refetch.
export async function saveClips(clips) {
  try {
    const storableClips = clips.map(c => {
      const storable = {
        id: c.id,
        createdAt: c.createdAt,
        startTime: c.startTime,
        endTime: c.endTime,
        duration: c.duration,
        selected: c.selected,
        hasBlob: !!c.blob,
        remoteUrl: c.remoteUrl || null,
        thumbUrl: c.thumbUrl || null,
      };
      return storable;
    });
    await idbSet(CLIP_KEY, storableClips);
  } catch (e) {
    console.error("Failed to save clips to IndexedDB", e);
  }
}

export async function loadClips() {
  try {
    const saved = await idbGet(CLIP_KEY);
    if (Array.isArray(saved)) {
      return saved.map(s => ({
        ...s,
        blob: null,
        rawBlob: null,
        thumb: s.thumbUrl || null,
        composing: false,
      }));
    }
  } catch (e) {
    console.error("Failed to load clips from IndexedDB", e);
  }
  return [];
}