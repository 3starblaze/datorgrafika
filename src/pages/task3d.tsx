import { useEffect, useRef } from "react";

type Vector2 = [number, number];

const PIXEL_SIZE = 4;
const MAX_BYTE = 255;

const range = function(n: number) {
  return [...Array(n).keys()];
};

const setGrayValue = function(
  imageData: ImageData,
  pos: number,
  value: number,
) {
  const i = pos * PIXEL_SIZE;
  imageData.data[i + 0] = value;
  imageData.data[i + 1] = value;
  imageData.data[i + 2] = value;
  imageData.data[i + 3] = MAX_BYTE;
};

export default function () {
    const canvasEl = useRef<HTMLCanvasElement>(null);

    const size: Vector2 = [400, 400];

    useEffect(() => {
        if (!canvasEl.current) return;
        const ctx = canvasEl.current.getContext("2d");
        if (!ctx) return;
        const imageData = ctx.createImageData(size[0], size[1]);

        const strength = 0;

        range(100).forEach((i) => setGrayValue(imageData, i, strength));

        ctx.putImageData(imageData, 0, 0);
    }, []);

    return (
        <div>
            <h2>Uzdevums (3d)</h2>
            <canvas
                width={size[0]}
                height={size[1]}
                ref={canvasEl}
            />
        </div>
    );
};
