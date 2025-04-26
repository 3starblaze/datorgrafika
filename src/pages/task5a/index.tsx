import { Transformer } from "./transformer_spec";
import implementedTransformer from "./implemented_transformer";
import referenceTransformer from "./implemented_transformer";
import { ReactNode, useEffect, useState } from "react";
import { points as importedPoints } from "./points";
import { cn } from "@/lib/utils";
import {
    SourceCodeSection,
} from "@/components/source-code";
import thisString from ".?raw";
import implementedTransformerString from "./implemented_transformer?raw";
import pointsString from "./points?raw";
import referenceTransformerString from "./reference_transformer?raw";
import transformerSpecString from "./transformer_spec?raw";

import Model from "./monkey.glb?url";

import {
    GLTFLoader,
} from "three/addons";
import {
    BufferGeometry,
    TypedArray,
} from "three";

const loader = new GLTFLoader();

const formatNumber = (x: number) => x.toFixed(4);

const points = importedPoints.slice(0, 5);

interface TestCase {
    title: string,
    matrixProducer: (transformer: Transformer) => DOMMatrix,
};

const projectionMatrix = function(
    depth: number,
): DOMMatrix {
    return new DOMMatrix([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 1 / depth, 0,
    ]);
};

const parallelProjectionMatrix = function(
    projectionDirection: DOMPoint
): DOMMatrix {
    const { x, y, z } = projectionDirection;
    return new DOMMatrix([
        1, 0, - x/z, 0,
        0, 1, - y/z, 0,
        0, 0, 0, 0,
        0, 0, 0, 1,
    ]);
};

const testCases: TestCase[] = [
    {
        title: "Translācija ar (1; 2; 3)",
        matrixProducer(transformer) {
            return transformer.translateToMatrix(new DOMPoint(1, 2, 3));
        },
    },
    {
        title: "Mērogošana ar (1; 2; 3)",
        matrixProducer(transformer) {
            return transformer.scaleToMatrix(new DOMPoint(1, 2, 3));
        },
    },
    {
        title: "Slīpā nobīde paralēli xy-plaknei (a = 3.4, b = 2.7)",
        matrixProducer(transformer) {
            return transformer.skewXY(3.4, 2.7);
        },
    },
    {
        title: "Slīpā nobīde paralēli yz-plaknei (a = 14.2, b = 11.0)",
        matrixProducer(transformer) {
            return transformer.skewYZ(14.2, 11.0);
        },
    },
    {
        title: "Slīpā nobīde paralēli xz-plaknei (a = 39.7, b = 94.1)",
        matrixProducer(transformer) {
            return transformer.skewYZ(39.7, 94.1);
        },
    },
    {
        title: "2D slīpā nobīde X-ass virzienā (a = 2.5)",
        matrixProducer(transformer) {
            return transformer.skew2DX(2.5);
        },
    },
    {
        title: "2D slīpā nobīde Y-ass virzienā (a = 5.0)",
        matrixProducer(transformer) {
            return transformer.skew2DY(5.0);
        },
    },
    {
        title: "X ass rotācija par 30 grādiem",
        matrixProducer(transformer) {
            return transformer.rotateX(Math.PI / 6);
        }
    },
    {
        title: "Y ass rotācija par 30 grādiem",
        matrixProducer(transformer) {
            return transformer.rotateY(Math.PI / 6);
        }
    },
    {
        title: "Z ass rotācija par 30 grādiem",
        matrixProducer(transformer) {
            return transformer.rotateZ(Math.PI / 6);
        }
    },
];

// NOTE: Algorithm performance can be improved by comparing all 16 numbers, this will suffice for
// now
const matrixEq = function (a: DOMMatrix, b: DOMMatrix): boolean {
    return JSON.stringify(a.toJSON()) === JSON.stringify(b.toJSON());
};

const MatrixCell = function ({
    value
}: {
    value: number,
}) {
    return (
        <div className="flex">
            <div className="">{formatNumber(value)}</div>
        </div>
    );
};

const MatrixDisplay = function({
    matrix: m,
}: {
    matrix: DOMMatrix,
}): ReactNode {
    return (
        <div className="flex items-start">
            <div className="grid grid-cols-4 gap-2">
                <MatrixCell value={m.m11} />
                <MatrixCell value={m.m12} />
                <MatrixCell value={m.m13} />
                <MatrixCell value={m.m14} />
                <MatrixCell value={m.m21} />
                <MatrixCell value={m.m22} />
                <MatrixCell value={m.m23} />
                <MatrixCell value={m.m24} />
                <MatrixCell value={m.m31} />
                <MatrixCell value={m.m32} />
                <MatrixCell value={m.m33} />
                <MatrixCell value={m.m34} />
                <MatrixCell value={m.m41} />
                <MatrixCell value={m.m42} />
                <MatrixCell value={m.m43} />
                <MatrixCell value={m.m44} />
            </div>
        </div>
    );
};

const PointDisplay = function({
    point: { x, y, z },
}: {
    point: DOMPoint,
}): ReactNode {
    return <div>{[x, y, z].map(formatNumber).join(", ")}</div>;
};

const reportTestCase = function(testCase: TestCase) {
    const referenceMatrix = testCase.matrixProducer(referenceTransformer);
    const implementedMatrix = testCase.matrixProducer(implementedTransformer);
    const domPoints = points.map(([x, y, z]) => new DOMPoint(x, y, z));
    const referencePoints = domPoints.map(
        (p) => referenceTransformer.transformPoint(p, referenceMatrix)
    );
    const implementedPoints = domPoints.map(
        (p) => implementedTransformer.transformPoint(p, implementedMatrix)
    );

    const matricesMatch = matrixEq(referenceMatrix, implementedMatrix);

    return (
        <>
            <div className="font-bold">{testCase.title}</div>
            <div className={cn(matricesMatch ? "bg-green-100" : "bg-red-100")}>
                <MatrixDisplay matrix={referenceMatrix} />
            </div>
            <div className={cn(matricesMatch ? "bg-green-100" : "bg-red-100")}>
                <MatrixDisplay matrix={implementedMatrix} />
            </div>
            <div>{referencePoints.map((p) => <PointDisplay point={p} />)}</div>
            <div>{implementedPoints.map((p) => <PointDisplay point={p} />)}</div>
        </>
    );
};

type TriangleWithOrder = {
    el: ReactNode,
    // NOTE: Order number, the bigger the number, the later it appears in tree, akin
    // to CSS z-index.
    zIndex: number,
};

type Face = {
    x0: number,
    y0: number,
    z0: number,
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
};

const mapFaces = function (
    geometry: BufferGeometry,
    f: (face: Face) => TriangleWithOrder,
): ReactNode[] {
    const positionArr = geometry.attributes.position.array;
    const indexArr = geometry.index!.array;

    const unsortedTriangles: TriangleWithOrder[] = [];

    for (let i = 0; i + 3 <= indexArr.length; i += 3) {
        const x0 = positionArr[3 * indexArr[i + 0] + 0];
        const y0 = positionArr[3 * indexArr[i + 0] + 1];
        const z0 = positionArr[3 * indexArr[i + 0] + 2];

        const x1 = positionArr[3 * indexArr[i + 1] + 0];
        const y1 = positionArr[3 * indexArr[i + 1] + 1];
        const z1 = positionArr[3 * indexArr[i + 1] + 2];

        const x2 = positionArr[3 * indexArr[i + 2] + 0];
        const y2 = positionArr[3 * indexArr[i + 2] + 1];
        const z2 = positionArr[3 * indexArr[i + 2] + 2];

        unsortedTriangles.push(f({ x0, y0, z0, x1, y1, z1, x2, y2, z2 }));
    }

    unsortedTriangles.sort((a, b) => a.zIndex - b.zIndex);

    return unsortedTriangles.map(({el}) => el);
};

export default function () {
    const [geometry, setGeometry] = useState<BufferGeometry | null>(null);

    const zTriangles: ReactNode[] | null = geometry && mapFaces(
        geometry,
        ({ x0, y0, z0, x1, y1, z1, x2, y2, z2 }) => ({
            el: (
                <polygon
                    points={`${x0},${y0} ${x1},${y1}, ${x2},${y2}`}
                    strokeWidth={"0.001"}
                />
            ),
            zIndex: z0 + z1 + z2,
        }),
    );

    const yTriangles: ReactNode[] | null = geometry && mapFaces(
        geometry,
        ({ x0, y0, z0, x1, y1, z1, x2, y2, z2 }) => ({
            el: (
                <polygon
                    points={`${x0},${z0} ${x1},${z1}, ${x2},${z2}`}
                    strokeWidth={"0.001"}
                />
            ),
            zIndex: y0 + y1 + y2,
        }),
    );

    const xTriangles: ReactNode[] | null = geometry && mapFaces(
        geometry,
        ({ x0, y0, z0, x1, y1, z1, x2, y2, z2 }) => ({
            el: (
                <polygon
                    points={`${y0},${z0} ${y1},${z1}, ${y2},${z2}`}
                    strokeWidth={"0.001"}
                />
            ),
            zIndex: x0 + x1 + x2,
        }),
    );

    useEffect(() => {
        loader.load(Model, function (gltf) {
            const loadedModel = gltf.scenes[0].children[0];
            // NOTE: Geometry exists, I don't know what types you have to use to prove it
            const geometry: BufferGeometry = (loadedModel as any).geometry;
            setGeometry(geometry);
        });
    }, []);

    return (
        <div>
            <h2 className="text-4xl mb-4">Uzdevums (5a)</h2>

            <SourceCodeSection
                sources={[
                    { title: "./index", contentString: thisString },
                    { title: "./implemented_transformer", contentString: implementedTransformerString },
                    { title: "./points", contentString: pointsString },
                    { title: "./reference_transformer", contentString: referenceTransformerString },
                    { title: "./transformer_spec", contentString: transformerSpecString },
                ]}
            />

            <h3 className="text-2xl my-4">Vizuāli piemēri</h3>

            <h4 className="text-xl my-4">Mērkaķis (z-ass skatītāja virzienā)</h4>

            {zTriangles && (
                <svg
                    viewBox="-2 -2 4 4"
                    className="max-w-80 border border-gray-500 fill-blue-100 stroke-black"
                >
                    {zTriangles}
                </svg>
            )}

            <h4 className="text-xl my-4">Mērkaķis (y-ass skatītāja virzienā)</h4>

            {yTriangles && (
                <svg
                    viewBox="-2 -2 4 4"
                    className="max-w-80 border border-gray-500 fill-blue-100 stroke-black"
                >
                    {yTriangles}
                </svg>
            )}

            <h4 className="text-xl my-4">Mērkaķis (x-ass skatītāja virzienā)</h4>

            {xTriangles && (
                <svg
                    viewBox="-2 -2 4 4"
                    className="max-w-80 border border-gray-500 fill-blue-100 stroke-black"
                >
                    {xTriangles}
                </svg>
            )}



            <h3 className="text-2xl my-4">Gadījumu tabula</h3>

            <div className="grid grid-cols-5 gap-2">
                <>
                    <div className="font-bold text-lg">Gadījums</div>
                    <div className="font-bold text-lg">References matrica</div>
                    <div className="font-bold text-lg">Implementētā matrica</div>
                    <div className="font-bold text-lg">Izvadītie references punkti</div>
                    <div className="font-bold text-lg">Izvadītie implementācijas punkti</div>
                </>
                {testCases.map((testCase) => reportTestCase(testCase))}
            </div>
        </div >
    );
};
