import { Transformer } from "./transformer_spec";
import implementedTransformer from "./implemented_transformer";
import referenceTransformer from "./implemented_transformer";
import { ReactNode } from "react";
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

const formatNumber = (x: number) => x.toFixed(4);

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


export default function () {
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
        </div>
    );
};
