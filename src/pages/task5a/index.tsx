import { Transformer } from "./transformer_spec";
import implementedTransformer from "./implemented_transformer";
import referenceTransformer from "./implemented_transformer";
import { ReactNode } from "react";
import { points as importedPoints } from "./points";

const points = importedPoints.slice(0, 5);

interface TestCase {
    title: string,
    matrixProducer: (transformer: Transformer) => DOMMatrix,
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
];

const MatrixCell = function({
    value
}: {
    value: number,
}) {
    return (
        <div className="flex">
            <div className="">{value}</div>
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
            <div className="grid grid-cols-4 gap-1">
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
    point,
}: {
    point: DOMPoint,
}): ReactNode {
    return <div>({point.x}; {point.y}; {point.z})</div>;
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

    return (
        <>
            <div className="font-bold">{testCase.title}</div>
            <MatrixDisplay matrix={referenceMatrix} />
            <MatrixDisplay matrix={implementedMatrix} />
            <div>{referencePoints.map((p) => <PointDisplay point={p} />)}</div>
            <div>{implementedPoints.map((p) => <PointDisplay point={p} />)}</div>
        </>
    );
};


export default function () {
    return (
        <div>
            <h2 className="text-4xl mb-4">Uzdevums (5a)</h2>
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
        </div>
    );
};
