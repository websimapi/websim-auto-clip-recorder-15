export function createClipEditor(container) {
  let currentClip = null;
  let recorder = null;
  let onSave = null;

  const modal = document.createElement('div');
  modal.className = 'clip-editor-backdrop';
  modal.style.display = 'none';
  modal.innerHTML = `
    <div class="clip-editor-modal">
      <h3>Edit Clip</h3>
      <div class="timeline-container">
        <div class="timeline">
          <div class="timeline-track"></div>
          <div class="clip-region"></div>
          <div class="start-handle"></div>
          <div class="end-handle"></div>
        </div>
        <div class="timeline-labels">
          <span class="start-time">0:00</span>
          <span class="duration">Duration: 0:00</span>
          <span class="end-time">0:00</span>
        </div>
      </div>
      <div class="preview-container">
        <video class="clip-preview" controls playsinline></video>
      </div>
      <div class="editor-actions">
        <button class="btn-preview">Preview Changes</button>
        <button class="btn-save">Save Changes</button>
        <button class="btn-cancel">Cancel</button>
      </div>
    </div>
  `;
  container.appendChild(modal);

  const elements = {
    modal,
    timeline: modal.querySelector('.timeline'),
    clipRegion: modal.querySelector('.clip-region'),
    startHandle: modal.querySelector('.start-handle'),
    endHandle: modal.querySelector('.end-handle'),
    startTime: modal.querySelector('.start-time'),
    endTime: modal.querySelector('.end-time'),
    duration: modal.querySelector('.duration'),
    preview: modal.querySelector('.clip-preview'),
    btnPreview: modal.querySelector('.btn-preview'),
    btnSave: modal.querySelector('.btn-save'),
    btnCancel: modal.querySelector('.btn-cancel')
  };

  let isDragging = false;
  let dragTarget = null;
  let recordingBounds = null;

  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  function updateLabels() {
    if (!currentClip || !recordingBounds) return;

    const startMs = currentClip.editStartTime - recordingBounds.startTime;
    const endMs = currentClip.editEndTime - recordingBounds.startTime;
    const durationMs = currentClip.editEndTime - currentClip.editStartTime;

    elements.startTime.textContent = formatTime(startMs);
    elements.endTime.textContent = formatTime(endMs);
    elements.duration.textContent = `Duration: ${formatTime(durationMs)}`;
  }

  function updateTimeline() {
    if (!currentClip || !recordingBounds) return;

    const totalDuration = recordingBounds.totalDuration;
    const startPercent = ((currentClip.editStartTime - recordingBounds.startTime) / totalDuration) * 100;
    const endPercent = ((currentClip.editEndTime - recordingBounds.startTime) / totalDuration) * 100;

    elements.clipRegion.style.left = `${startPercent}%`;
    elements.clipRegion.style.width = `${endPercent - startPercent}%`;
    elements.startHandle.style.left = `${startPercent}%`;
    elements.endHandle.style.left = `${endPercent}%`;

    updateLabels();
  }

  function setupDragHandlers() {
    function startDrag(e, target) {
      isDragging = true;
      dragTarget = target;
      e.preventDefault();
    }

    function onMouseMove(e) {
      if (!isDragging || !dragTarget || !currentClip || !recordingBounds) return;

      const rect = elements.timeline.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const timestamp = recordingBounds.startTime + (percent * recordingBounds.totalDuration);

      if (dragTarget === 'start') {
        currentClip.editStartTime = Math.max(recordingBounds.startTime, Math.min(timestamp, currentClip.editEndTime - 1000));
      } else if (dragTarget === 'end') {
        currentClip.editEndTime = Math.min(recordingBounds.startTime + recordingBounds.totalDuration, Math.max(timestamp, currentClip.editStartTime + 1000));
      }

      updateTimeline();
    }

    function stopDrag() {
      isDragging = false;
      dragTarget = null;
    }

    elements.startHandle.addEventListener('mousedown', (e) => startDrag(e, 'start'));
    elements.endHandle.addEventListener('mousedown', (e) => startDrag(e, 'end'));
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', stopDrag);
  }

  function setupEventListeners() {
    elements.btnPreview.addEventListener('click', async () => {
      if (!recorder || !currentClip) return;

      const blob = recorder.getContinuousBlob(currentClip.editStartTime, currentClip.editEndTime);
      elements.preview.src = URL.createObjectURL(blob);
      elements.preview.play().catch(() => {});
    });

    elements.btnSave.addEventListener('click', () => {
      if (onSave && currentClip) {
        onSave(currentClip);
      }
      close();
    });

    elements.btnCancel.addEventListener('click', close);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });
  }

  function open(clip, recorderInstance, saveCallback) {
    currentClip = {
      ...clip,
      editStartTime: clip.startTime || clip.createdAt,
      editEndTime: clip.endTime || (clip.createdAt + (clip.duration || 10000))
    };
    recorder = recorderInstance;
    onSave = saveCallback;
    recordingBounds = recorder.getRecordingBounds() || { startTime: currentClip.editStartTime, totalDuration: (currentClip.editEndTime - currentClip.editStartTime) };

    modal.style.display = 'flex';
    updateTimeline();
  }

  function close() {
    modal.style.display = 'none';
    if (elements.preview.src) {
      URL.revokeObjectURL(elements.preview.src);
      elements.preview.src = '';
    }
    currentClip = null;
    recorder = null;
    onSave = null;
  }

  setupDragHandlers();
  setupEventListeners();

  return { open, close };
}