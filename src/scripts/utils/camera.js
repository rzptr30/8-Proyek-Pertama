export async function startCameraStream(videoEl, { facingMode = 'environment' } = {}) {
  if (!videoEl) throw new Error('Elemen video tidak ditemukan');
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode },
    audio: false,
  });
  videoEl.srcObject = stream;
  await videoEl.play();
  return stream;
}

export function stopCameraStream(stream) {
  if (!stream) return;
  try {
    stream.getTracks().forEach((t) => t.stop());
  } catch {}
}

export async function captureToBlob(videoEl, { type = 'image/jpeg', quality = 0.92 } = {}) {
  const canvas = document.createElement('canvas');
  const w = videoEl.videoWidth || 640;
  const h = videoEl.videoHeight || 480;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoEl, 0, 0, w, h);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  return blob;
}