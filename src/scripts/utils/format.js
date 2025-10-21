export function formatDateID(input) {
  try {
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}