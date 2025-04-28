import implementedTransformer from "./implemented_transformer";
import { ReactNode, useEffect, useState } from "react";
import {
    SourceCodeSection,
} from "@/components/source-code";
import thisString from ".?raw";
import implementedTransformerString from "./implemented_transformer?raw";
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

type TriangleWithOrder = {
    el: ReactNode,
    // NOTE: Order number, the bigger the number, the later it appears in tree, akin
    // to CSS z-index.
    zIndex: number,
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
            <p>({state[0].toFixed(2)})</p>
        </>
    );
};

type Vec3 = [number, number, number];

const basisToTransformer = function(
    basisOrigin: Vec3,
    basisX: Vec3,
    basisY: Vec3,
    basisZ: Vec3,
): DOMMatrix {
    // NOTE: p1 = (basis axis matrix) mult (p0 - baseOrigin) which is equivalent to translating
    // point by -baseOrigin and then multiplying by basis axis matrix which is how this matrix
    // has been assembled -- take identity matrix, fill top-left corner with basis axis and then
    // add basis origin in the top right corner.
    return new DOMMatrix([
        basisX[0], basisX[1], basisX[2], -basisOrigin[0],
        basisY[0], basisY[1], basisY[2], -basisOrigin[1],
        basisZ[0], basisZ[1], basisZ[2], -basisOrigin[2],
        0, 0, 0, 1,
    ]);
}

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

    const skewXYXState = useState<number>(0);
    const [skewXYX] = skewXYXState;

    const skewXYYState = useState<number>(0);
    const [skewXYY] = skewXYYState;

    const skewYZYState = useState<number>(0);
    const [skewYZY] = skewYZYState;

    const skewYZZState = useState<number>(0);
    const [skewYZZ] = skewYZZState;

    const skewXZXState = useState<number>(0);
    const [skewXZX] = skewXZXState;

    const skewXZZState = useState<number>(0);
    const [skewXZZ] = skewXZZState;

    const parallelPerspectiveXState = useState<number>(1);
    const [parallelPerspectiveX] = parallelPerspectiveXState;

    const parallelPerspectiveYState = useState<number>(1);
    const [parallelPerspectiveY] = parallelPerspectiveYState;

    const parallelPerspectiveZState = useState<number>(1);
    const [parallelPerspectiveZ] = parallelPerspectiveZState;

    const perspectiveDepthState = useState<number>(2.0);
    const [perspectiveDepth] = perspectiveDepthState;

    // NOTE: Viewer state

    const originXState = useState<number>(0);
    const [originX] = originXState;

    const originYState = useState<number>(0);
    const [originY] = originYState;

    const originZState = useState<number>(0);
    const [originZ] = originZState;

    const basisOrigin: Vec3 = [originX, originY, originZ];


    const zAxisXState = useState<number>(0);
    const [zAxisX] = zAxisXState;

    const zAxisYState = useState<number>(0);
    const [zAxisY] = zAxisYState;

    const zAxisZState = useState<number>(1);
    const [zAxisZ] = zAxisZState;

    const basisZ: Vec3 = [zAxisX, zAxisY, zAxisZ];


    const xAxisXState = useState<number>(1);
    const [xAxisX] = xAxisXState;

    const xAxisYState = useState<number>(0);
    const [xAxisY] = xAxisYState;

    const xAxisZState = useState<number>(0);
    const [xAxisZ] = xAxisZState;

    const basisX: Vec3 = [xAxisX, xAxisY, xAxisZ];

    const crossProduct = function(
        [x0, y0, z0]: Vec3,
        [x1, y1, z1]: Vec3,
    ): Vec3 {
        return [
            y0 * z1 - z0 * y1,
            z0 * x1 - x0 * z1,
            x0 * y1 - y0 * x1,
        ];
    };

    const basisY = crossProduct(basisX, basisZ);

    const domPoints = positionArrToDomPointArr(geometry.attributes.position.array).map(
        (p) => implementedTransformer.transformPoint(
            p,
            [
                implementedTransformer.scaleToMatrix(new DOMPoint(scaleX, scaleY, scaleZ)),
                implementedTransformer.skewXY(skewXYX, skewXYY),
                implementedTransformer.skewYZ(skewYZY, skewYZZ),
                implementedTransformer.skewXZ(skewXZX, skewXZZ),
                implementedTransformer.rotateX(rotateX),
                implementedTransformer.rotateY(rotateY),
                implementedTransformer.rotateZ(rotateZ),
                implementedTransformer.translateToMatrix(
                    new DOMPoint(translateX, translateY, translateZ),
                ),
                basisToTransformer(
                    basisOrigin,
                    basisX,
                    basisY,
                    basisZ,
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
                <>
                    <h4 className="text-xl my-4 col-span-3">Skatītāja konfigurācija</h4>

                    <h5 className="col-span-3 font-bold mb-2">Translācija</h5>

                    <RangeSlider
                        label="Skatītāja x translācija"
                        name="originX"
                        state={originXState}
                        min={-10}
                        max={10}
                    />

                    <RangeSlider
                        label="Skatītāja y translācija"
                        name="originY"
                        state={originYState}
                        min={-10}
                        max={10}
                    />

                    <RangeSlider
                        label="Skatītāja z translācija"
                        name="originZ"
                        state={originZState}
                        min={-10}
                        max={10}
                    />

                    <h5 className="col-span-3 font-bold my-2">Skatītāja x-ass</h5>

                    <RangeSlider
                        label="Skatītāja x-ass x koordināta"
                        name="xAxisX"
                        state={xAxisXState}
                        min={0}
                        max={10}
                    />

                    <RangeSlider
                        label="Skatītāja x-ass y koordināta"
                        name="xAxisY"
                        state={xAxisYState}
                        min={0}
                        max={10}
                    />

                    <RangeSlider
                        label="Skatītāja x-ass z koordināta"
                        name="xAxisY"
                        state={xAxisZState}
                        min={0}
                        max={10}
                    />

                    <h5 className="col-span-3 font-bold my-2">Skatītāja z-ass</h5>

                    <RangeSlider
                        label="Skatītāja z-ass x koordināta"
                        name="yAxisY"
                        state={zAxisXState}
                        min={0}
                        max={10}
                    />

                    <RangeSlider
                        label="Skatītāja z-ass y koordināta"
                        name="zAxisY"
                        state={zAxisYState}
                        min={0}
                        max={10}
                    />

                    <RangeSlider
                        label="Skatītāja z-ass z koordināta"
                        name="xAxisY"
                        state={zAxisZState}
                        min={0}
                        max={10}
                    />

                    <h5 className="col-span-3 font-bold my-2">
                        (!) Skatītāja y-ass tiek automātiski izrēķināta
                    </h5>
                </>

                <h4 className="col-span-3 text-xl my-4">Objekta konfigurācija</h4>

                <h4 className="col-span-3 text-xl mb-2">Mērogošana</h4>

                <RangeSlider
                    label="X mērogojums"
                    name="scaleX"
                    state={scaleXState}
                    min={Math.pow(10, -1)}
                    max={Math.pow(10, 1)}
                />

                <RangeSlider
                    label="Y mērogojums"
                    name="scaleY"
                    state={scaleYState}
                    min={Math.pow(10, -1)}
                    max={Math.pow(10, 1)}
                />

                <RangeSlider
                    label="Z mērogojums"
                    name="scaleZ"
                    state={scaleZState}
                    min={Math.pow(10, -1)}
                    max={Math.pow(10, 1)}
                />


                <h4 className="col-span-3 text-xl my-2">Slīpā nobīde</h4>

                <RangeSlider
                    label="XY slīpās nobīdes X"
                    name="skewXYX"
                    state={skewXYXState}
                    min={0}
                    max={10}
                />

                <RangeSlider
                    label="XY slīpās nobīdes Y"
                    name="skewXYY"
                    state={skewXYYState}
                    min={0}
                    max={10}
                />

                <RangeSlider
                    label="XZ slīpās nobīdes X"
                    name="skewXZX"
                    state={skewXZXState}
                    min={0}
                    max={10}
                />

                <RangeSlider
                    label="XZ slīpās nobīdes Z"
                    name="skewXZZ"
                    state={skewXZZState}
                    min={0}
                    max={10}
                />

                <RangeSlider
                    label="YZ slīpās nobīdes Y"
                    name="skewYZY"
                    state={skewYZYState}
                    min={0}
                    max={10}
                />

                <RangeSlider
                    label="YZ slīpās nobīdes Z"
                    name="skewYZZ"
                    state={skewYZZState}
                    min={0}
                    max={10}
                />


                <h4 className="col-span-3 text-xl my-2">Rotācija</h4>

                <RangeSlider
                    label="X rotācija"
                    name="rotateX"
                    state={rotateXState}
                    min={-2 * Math.PI}
                    max={2 * Math.PI}
                />

                <RangeSlider
                    label="Y rotācija"
                    name="rotateY"
                    state={rotateYState}
                    min={-2 * Math.PI}
                    max={2 * Math.PI}
                />

                <RangeSlider
                    label="Z rotācija"
                    name="rotateZ"
                    state={rotateZState}
                    min={-2 * Math.PI}
                    max={2 * Math.PI}
                />

                <h4 className="col-span-3 text-xl my-2">Translācija</h4>

                <RangeSlider
                    label="X translācija"
                    name="translateX"
                    state={translateXState}
                    min={-5}
                    max={5}
                />

                <RangeSlider
                    label="Y translācija"
                    name="translateY"
                    state={translateYState}
                    min={-5}
                    max={5}
                />

                <RangeSlider
                    label="Z translācija"
                    name="translateZ"
                    state={translateZState}
                    min={-5}
                    max={5}
                />
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
                parallelProjectionMatrix(
                    new DOMPoint(parallelPerspectiveX, parallelPerspectiveY, parallelPerspectiveZ),
                ),
            )))}

            <div className="grid grid-cols-[auto_auto_auto] max-w-fit gap-x-4">
                <RangeSlider
                    label="Perspektīvvektora x"
                    name="parallelPerspectiveX"
                    min={0.1}
                    max={10.0}
                    state={parallelPerspectiveXState}
                />

                <RangeSlider
                    label="Perspektīvvektora y"
                    name="parallelPerspectiveY"
                    min={0.1}
                    max={10.0}
                    state={parallelPerspectiveYState}
                />

                <RangeSlider
                    label="Perspektīvvektora z"
                    name="parallelPerspectiveZ"
                    min={0.1}
                    max={10.0}
                    state={parallelPerspectiveZState}
                />
            </div>

            <h4 className="text-xl my-4">Centrālā projekcija</h4>

            {pointsToSvg(domPoints.map((p) => implementedTransformer.transformPoint(
                p,
                projectionMatrix(perspectiveDepth),
            )))}

            <div className="grid grid-cols-[auto_auto_auto] max-w-fit gap-2">
                <RangeSlider
                    label="Perspektīvas dziļums (depth)"
                    name="perspectiveDepth"
                    state={perspectiveDepthState}
                    min={0.1}
                    max={10.0}
                />
            </div>
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
                    { title: "./reference_transformer", contentString: referenceTransformerString },
                    { title: "./transformer_spec", contentString: transformerSpecString },
                ]}
            />

            {geometry && (<VisualExampleSection geometry={geometry}/>)}
        </div >
    );
};
