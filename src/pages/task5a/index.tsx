import { Transformer } from "./transformer_spec";
import implementedTransformer from "./implemented_transformer";
import referenceTransformer from "./implemented_transformer";
import { ReactNode, useEffect, useMemo, useState } from "react";
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

const positionArrToDomPointArr = function(
    positionArr: TypedArray,
): DOMPoint[] {
    const res: DOMPoint[] = [];

    for (let i = 0; i + 3 <= positionArr.length; i += 3) {
        res.push(new DOMPoint(
            positionArr[i + 0],
            positionArr[i + 1],
            positionArr[i + 2],
        ));
    }

    return res;
};

const domPointArrToSvg = function(
    domPointArr: DOMPoint[],
    indexArr: TypedArray,
): ReactNode {
    const unsortedTriangles: TriangleWithOrder[] = [];

    for (let i = 0; i + 3 <= indexArr.length; i += 3) {
        const p0 = domPointArr[indexArr[i + 0]];
        const p1 = domPointArr[indexArr[i + 1]];
        const p2 = domPointArr[indexArr[i + 2]];

        // NOTE: Normalize coordinates before drawing
        const x0 = p0.x / p0.w;
        const y0 = p0.y / p0.w;
        const z0 = p0.z / p0.w;
        const x1 = p1.x / p1.w;
        const y1 = p1.y / p1.w;
        const z1 = p1.z / p1.w;
        const x2 = p2.x / p2.w;
        const y2 = p2.y / p2.w;
        const z2 = p2.z / p2.w;

        unsortedTriangles.push({
            el: (
                <polygon
                    points={`${x0},${y0} ${x1},${y1}, ${x2},${y2}`}
                    strokeWidth={"0.001"}
                />
            ),
            zIndex: z0 + z1 + z2,
        });
    }

    unsortedTriangles.sort((a, b) => a.zIndex - b.zIndex);

    return (
        <svg
            viewBox="-2 -2 4 4"
            className="max-w-80 border border-gray-500 fill-blue-100 stroke-black"
        >
            {unsortedTriangles.map(({ el }) => el)}
        </svg>
    );
};

const RangeSlider = function({
    name,
    label,
    state,
    min,
    max,
}: {
    name: string,
    label: string,
    state: [number, (value: number) => void],
    min: number,
    max: number,
}) {
    return (
        <>
            <label htmlFor={name}>{label}</label>
            <input
                name={name}
                type="range"
                value={state[0]}
                min={min}
                max={max}
                step="any"
                onChange={(ev) => state[1](Number(ev.target.value))}
            />
        </>
    );
};

const VisualExampleSection = function({
    geometry,
}: {
    geometry: BufferGeometry,
}) {
    const translateXState = useState<number>(0);
    const [translateX] = translateXState;

    const translateYState = useState<number>(0);
    const [translateY] = translateYState;

    const translateZState = useState<number>(0);
    const [translateZ] = translateZState;

    const rotateXState = useState<number>(0);
    const [rotateX] = rotateXState;

    const rotateYState = useState<number>(0);
    const [rotateY] = rotateYState;

    const rotateZState = useState<number>(0);
    const [rotateZ] = rotateZState;

    const scaleXState = useState<number>(1);
    const [scaleX] = scaleXState;

    const scaleYState = useState<number>(1);
    const [scaleY] = scaleYState;

    const scaleZState = useState<number>(1);
    const [scaleZ] = scaleZState;

    const domPoints = positionArrToDomPointArr(geometry.attributes.position.array).map(
        (p) => implementedTransformer.transformPoint(
            p,
            [
                implementedTransformer.scaleToMatrix(new DOMPoint(scaleX, scaleY, scaleZ)),
                implementedTransformer.rotateX(rotateX),
                implementedTransformer.rotateY(rotateY),
                implementedTransformer.rotateZ(rotateZ),
                implementedTransformer.translateToMatrix(
                    new DOMPoint(translateX, translateY, translateZ),
                ),
            ].reduce(implementedTransformer.reduceMatrix)
        ),
    );

    const indexArr = geometry.index!.array;
    const pointsToSvg = (points: DOMPoint[]) => domPointArrToSvg(points, indexArr);

    return (
        <div>
            <h3 className="text-2xl my-4">Vizuālo piemēru konfigurēšana</h3>

            <div className="grid grid-cols-[repeat(3,auto)] max-w-fit gap-x-4">
                <h4 className="col-span-3 text-xl mb-2">Mērogošana</h4>

                <RangeSlider
                    label="X mērogojums"
                    name="scaleX"
                    state={scaleXState}
                    min={Math.pow(10, -1)}
                    max={Math.pow(10, 1)}
                />
                <p>({scaleX.toFixed(2)})</p>

                <RangeSlider
                    label="Y mērogojums"
                    name="scaleY"
                    state={scaleYState}
                    min={Math.pow(10, -1)}
                    max={Math.pow(10, 1)}
                />
                <p>({scaleY.toFixed(2)})</p>

                <RangeSlider
                    label="Z mērogojums"
                    name="scaleZ"
                    state={scaleZState}
                    min={Math.pow(10, -1)}
                    max={Math.pow(10, 1)}
                />
                <p>({scaleZ.toFixed(2)})</p>

                <h4 className="col-span-3 text-xl my-2">Rotācija</h4>

                <RangeSlider
                    label="X rotācija"
                    name="rotateX"
                    state={rotateXState}
                    min={-2 * Math.PI}
                    max={2 * Math.PI}
                />
                <p>({rotateX.toFixed(2)})</p>

                <RangeSlider
                    label="Y rotācija"
                    name="rotateY"
                    state={rotateYState}
                    min={-2 * Math.PI}
                    max={2 * Math.PI}
                />
                <p>({rotateY.toFixed(2)})</p>

                <RangeSlider
                    label="Z rotācija"
                    name="rotateZ"
                    state={rotateZState}
                    min={-2 * Math.PI}
                    max={2 * Math.PI}
                />
                <p>({rotateZ.toFixed(2)})</p>

                <h4 className="col-span-3 text-xl my-2">Translācija</h4>

                <RangeSlider
                    label="X translācija"
                    name="translateX"
                    state={translateXState}
                    min={-5}
                    max={5}
                />
                <p>({translateX.toFixed(2)})</p>

                <RangeSlider
                    label="Y translācija"
                    name="translateY"
                    state={translateYState}
                    min={-5}
                    max={5}
                />
                <p>({translateY.toFixed(2)})</p>

                <RangeSlider
                    label="Z translācija"
                    name="translateZ"
                    state={translateZState}
                    min={-5}
                    max={5}
                />
                <p>({translateZ.toFixed(2)})</p>
            </div>

            <h3 className="text-2xl my-4">Vizuāli piemēri</h3>

            <h4 className="text-xl my-4">Mērkaķis (z-ass skatītāja virzienā)</h4>

            {pointsToSvg(domPoints)}

            <h4 className="text-xl my-4">Mērkaķis (y-ass skatītāja virzienā)</h4>

            {pointsToSvg(domPoints.map((p) => new DOMPoint(p.x, p.z, p.y)))}

            <h4 className="text-xl my-4">Mērkaķis (x-ass skatītāja virzienā)</h4>

            {pointsToSvg(domPoints.map((p) => new DOMPoint(p.y, p.z, p.x)))}

            <h4 className="text-xl my-4">Isometriskā projekcija</h4>

            {pointsToSvg(domPoints.map((p) => implementedTransformer.transformPoint(
                p,
                parallelProjectionMatrix(new DOMPoint(1, 1, 1)),
            )))}

            <h4 className="text-xl my-4">Centrālā projekcija</h4>

            {pointsToSvg(domPoints.map((p) => implementedTransformer.transformPoint(
                p,
                [
                    implementedTransformer.rotateY(5 * Math.PI / 4),
                    implementedTransformer.scaleToMatrix(new DOMPoint(1, -1, 1)),
                    implementedTransformer.translateToMatrix(new DOMPoint(0, 0, 3.0)),
                    projectionMatrix(5.0),
                ].reduce(implementedTransformer.reduceMatrix),
            )))}
        </div>
    );
};

export default function () {
    const [geometry, setGeometry] = useState<BufferGeometry | null>(null);

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

            {geometry && (<VisualExampleSection geometry={geometry}/>)}

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
