import { Transformer } from "./transformer_spec";

// TODO: Implement this yourself
const matrixMult = function(a: DOMMatrix, b: DOMMatrix): DOMMatrix {
    return a.multiply(b);
};

const impl: Transformer = {
    transformPoint({ x, y, z, w }, matrix) {
        return new DOMPoint(
            matrix.m11 * x + matrix.m12 * y + matrix.m13 * z + matrix.m14 * w,
            matrix.m21 * x + matrix.m22 * y + matrix.m23 * z + matrix.m24 * w,
            matrix.m31 * x + matrix.m32 * y + matrix.m33 * z + matrix.m34 * w,
            matrix.m41 * x + matrix.m42 * y + matrix.m43 * z + matrix.m44 * w,
        );
    },
    reduceMatrix: matrixMult,
    translateToMatrix({ x, y, z }) {
        const args = [
            1, 0, 0, x,
            0, 1, 0, y,
            0, 0, 1, z,
            0, 0, 0, 1,
        ];
        return new DOMMatrix(args);
    },
};

export default impl;
