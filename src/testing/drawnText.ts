import type { Canvas } from '@napi-rs/canvas';

export interface DrawnText {
  text: string;
  size: number;
  x: number;
  y: number;
  bottom: number;
}

const LINE_HEIGHT = 1.2;
const PX = /(\d+(?:\.\d+)?)px/;

type FillText = (text: string, x: number, y: number) => void;

/** Runs draw and returns every fillText call on the canvas with its pixel font size. */
export function recordText(canvas: Canvas, draw: () => void): DrawnText[] {
  const proto = Object.getPrototypeOf(canvas.getContext('2d')) as { fillText: FillText };
  const original = proto.fillText;
  const drawn: DrawnText[] = [];
  const spy = jest.spyOn(proto, 'fillText').mockImplementation(function (this: { font: string }, text: string, x: number, y: number) {
    const size = Number(PX.exec(this.font)?.[1] ?? 0);
    drawn.push({ text, size, x, y, bottom: y + size * LINE_HEIGHT });
    original.call(this, text, x, y);
  });
  try {
    draw();
  } finally {
    spy.mockRestore();
  }
  return drawn;
}
