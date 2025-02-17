import { Transformer } from "./transformer_spec";
import implementedTransformer from "./implemented_transformer";
import referenceTransformer from "./implemented_transformer";
import { ReactNode } from "react";

interface TestCase {
    title: string,
    points: [number, number, number][],
    matrixProducer: (transformer: Transformer) => DOMMatrix,
};

const testCases: TestCase[] = [
    {
        title: "Translācija ar (1; 2; 3)",
        points: [
            [0, 0, 0],
            [3.2, 4.5, 7.8],
            [2.2, 1.3, 4.5],
        ],
        matrixProducer(transformer) {
            return transformer.translateToMatrix(new DOMPoint(1, 2, 3));
        },
    },
    {
        title: "Mērogošana ar (1; 2; 3)",
        points: [
            [0, 0, 0],
            [3.2, 4.5, 7.8],
            [2.2, 1.3, 4.5],
        ],
        matrixProducer(transformer) {
            return transformer.scaleToMatrix(new DOMPoint(1, 2, 3));
        },
    }
];

const MatrixCell = function({
    value
}: {
    value: number,
}) {
    return (
        <div className="flex justify-center items-center">
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
        <div className="flex">
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
    const domPoints = testCase.points.map(([x, y, z]) => new DOMPoint(x, y, z));
    const referencePoints = domPoints.map(
        (p) => referenceTransformer.transformPoint(p, referenceMatrix)
    );
    const implementedPoints = domPoints.map(
        (p) => implementedTransformer.transformPoint(p, implementedMatrix)
    );

    return [
        <div className="font-bold">{testCase.title}</div>,
        <div>{domPoints.map((p) => <PointDisplay point={p} />)}</div>,
        <MatrixDisplay matrix={referenceMatrix} />,
        <MatrixDisplay matrix={implementedMatrix} />,
        <div>{referencePoints.map((p) => <PointDisplay point={p} />)}</div>,
        <div>{implementedPoints.map((p) => <PointDisplay point={p} />)}</div>,
    ];
};


export default function () {
    return (
        <div>
            <h2 className="text-4xl mb-4">Uzdevums (5a)</h2>
            <div className="grid grid-cols-6 gap-2">
                <>
                    <div className="font-bold text-lg">Title</div>
                    <div className="font-bold text-lg">Input points</div>
                    <div className="font-bold text-lg">Reference matrix</div>
                    <div className="font-bold text-lg">Implemented matrix</div>
                    <div className="font-bold text-lg">Output reference points</div>
                    <div className="font-bold text-lg">Output implemented points</div>
                </>
                {testCases.map((testCase) => {
                    return (
                        <>
                            {reportTestCase(testCase).map((s) => <div>{s}</div>)}
                        </>
                    );
                })}
            </div>
        </div>
    );
};
