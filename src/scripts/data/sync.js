import apiClient from './api-client';
import { getOutboxStories, updateOutboxStatus, deleteOutboxStory } from './saved-store';

async function base64ToBlob(dataUrl) {
  if (!dataUrl) return null;
  const [meta, b64] = dataUrl.split(',');
  const mime = meta.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function syncOutbox({ onItemStart, onItemSuccess, onItemError } = {}) {
  const items = await getOutboxStories();
  for (const item of items) {
    if (item.status !== 'pending' && item.status !== 'error') continue;
    try {
      onItemStart?.(item);
      await updateOutboxStatus(item.localId, 'sending');
      const photoBlob = await base64ToBlob(item.photoBase64);
      await apiClient.addStory({
        description: item.description,
        photoFile: photoBlob,
        lat: item.lat,
        lon: item.lon,
      });
      await updateOutboxStatus(item.localId, 'synced');
      onItemSuccess?.(item);
      // Hapus dari outbox setelah sukses (atau biarkan untuk riwayat)
      await deleteOutboxStory(item.localId);
    } catch (e) {
      const msg = e?.message || 'Gagal kirim, akan dicoba lagi.';
      await updateOutboxStatus(item.localId, 'error', msg);
      onItemError?.(item, msg);
    }
  }
}