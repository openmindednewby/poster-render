export interface DataUrlCanvas {
  toDataURL(type: string): string;
}

const PREFIX = 'data:image/png;base64,';

/** Encodes the canvas as a PNG Blob of the canvas's exact pixel size. */
export function exportPng(canvas: DataUrlCanvas): Blob {
  const url = canvas.toDataURL('image/png');
  if (!url.startsWith(PREFIX)) {
    throw new Error('poster-render: the canvas did not return a PNG data URL');
  }
  const binary = atob(url.slice(PREFIX.length));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: 'image/png' });
}
