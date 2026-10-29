import type { Canvas } from '@napi-rs/canvas';

export interface DrawnText {
  text: string;
  size: number;
  x: number;
  y: number;
  bottom: number;
  font: string;
  color: string;
  width: number;
  spacing: string;
}

const LINE_HEIGHT = 1.2;
const PX = /(\d+(?:\.\d+)?)px/;

type FillText = (text: string, x: number, y: number) => void;

interface DrawState {
  font: string;
  fillStyle: unknown;
  letterSpacing?: string;
  measureText(text: string): { width: number };
}

/** Runs draw and returns every fillText call on the canvas with its pixel font size, font, colour, width and spacing. */
export function recordText(canvas: Canvas, draw: () => void): DrawnText[] {
  const proto = Object.getPrototypeOf(canvas.getContext('2d')) as { fillText: FillText };
  const original = proto.fillText;
  const drawn: DrawnText[] = [];
  const spy = jest.spyOn(proto, 'fillText').mockImplementation(function (this: DrawState, text: string, x: number, y: number) {
    const size = Number(PX.exec(this.font)?.[1] ?? 0);
    const width = this.measureText(text).width;
    drawn.push({ text, size, x, y, bottom: y + size * LINE_HEIGHT, font: this.font, color: String(this.fillStyle), width, spacing: this.letterSpacing ?? '' });
    original.call(this, text, x, y);
  });
  try {
    draw();
  } finally {
    spy.mockRestore();
  }
  return drawn;
}
