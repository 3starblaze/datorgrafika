import { ReactNode, useEffect, useRef } from "react";

type Vector2 = [number, number];
type Polygon = [Vector2, Vector2, Vector2, ...Vector2[]];

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

const intersectionByY = function(
  [x0, y0]: Vector2,
  [x1, y1]: Vector2,
  y: number,
): number | null {
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);

  if (!(minY <= y && y <= maxY)) return null;

  const scale = (y - y0) / (y1 - y0);

  return (x1 - x0) * scale + x0;
};

const polygonToLines = function(polygon: Polygon): [Vector2, Vector2][] {
  if (polygon.length < 3) throw new Error("polygon length < 3!");

  return [
    ...range(polygon.length - 1).map((i) => [polygon[i], polygon[i+1]] as [Vector2, Vector2]),
    [polygon[polygon.length - 1], polygon[0]],
  ];
};

const partition = function<T>(arr: T[], n: number): T[][] {
  let res: T[][] = [];

  for (let i = 0; i < arr.length; i+=n) {
    res.push(arr.slice(i, Math.min(arr.length, i + n)));
  }

  return res;
};

// FIXME: This algorithm is broken
const algorithm = function(
  imageData: ImageData,
  polygon: Polygon,
) {
  const POLYGON_VALUE = 0;

  range(imageData.height).forEach((row) => {
    const intersections = polygonToLines(polygon)
      .map(([point0, point1]) => intersectionByY(point0, point1, row))
      .filter((item) => item !== null)
      .sort();

    console.assert(intersections.length % 2 === 0, "assertions.length % 2 === 0");

    partition(intersections, 2).forEach(([x0, x1]) => {
      for (let x = x0; x < x1; x++) {
        const i = Math.floor(row * imageData.width + x);
        setGrayValue(imageData, i, POLYGON_VALUE);
      }
    });
  });
};

const MyPolygonCanvas = function({
  size,
  polygon,
}: {
  size: Vector2,
  polygon: Polygon,
}) {
    const canvasEl = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasEl.current) return;
        const ctx = canvasEl.current.getContext("2d");
        if (!ctx) return;
        const imageData = ctx.createImageData(size[0], size[1]);

        algorithm(imageData, polygon);

        ctx.putImageData(imageData, 0, 0);
    }, [size, polygon]);

    return (
        <canvas
            width={size[0]}
            height={size[1]}
            ref={canvasEl}
        />
    );
};

const Card = function({
  title,
  children,
}: {
  title: string,
  children: ReactNode,
}) {
    return (
        <div className="bg-yellow-100 flex flex-col gap-2">
            <h3 className="bg-yellow-200 p-2">{title}</h3>
            {children}
        </div>
    );
};

type Example = {
  title: string,
  canvasSize: Vector2,
  polygon: Polygon,
};

const exampleRegistry: Example[] = [
  {
    title: "Axis-aligned Square",
    canvasSize: [400, 400],
    polygon: [
      [10, 10],
      [390, 10],
      [390, 390],
      [10, 390],
    ]
  },
  {
    title: "rot45 Square",
    canvasSize: [400, 400],
    polygon: [
      [200, 10],
      [390, 200],
      [200, 390],
      [10, 200],
    ]
  },
  {
    title: "Random 0",
    canvasSize: [400, 400],
    polygon: [
        [10, 0],
        [1, 200],
        [320, 200],
        [400, 80],
    ]
  },
];

export default function () {
    return (
        <div>
            <h2 className="text-4xl mb-4">Uzdevums (3d)</h2>

            <div className="flex flex-col gap-4">
                {exampleRegistry.map(({ title, canvasSize, polygon }) => (
                    <div className="flex gap-4">
                        <Card title="My implementation">
                            <MyPolygonCanvas size={canvasSize} polygon={polygon} />
                        </Card>
                        <Card title="SVG reference">
                            <svg
                                className="fill-black"
                                width={canvasSize[0]}
                                height={canvasSize[1]}
                            >
                                <polygon points={polygon.map(([x, y]) => `${x},${y}`).join(", ")} />
                            </svg>
                        </Card>
                        <Card title="Polygon info">
                            <div className="px-4 flex flex-col gap-4">
                                <div className="text-xl font-bold">{title}</div>
                                <div>
                                  <div className="text-lg font-bold">Points:</div>
                                  {polygon.map(([x, y]) => <div>{`[${x}, ${y}]`}</div>)}
                                </div>
                            </div>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
};
