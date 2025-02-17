import { Transformer } from "./transformer_spec";

const impl: Transformer = {
    transformPoint(point, matrix) {
        return point.matrixTransform(matrix);
    },
    reduceMatrix(a, b) {
        return a.multiply(b);
    },
    translateToMatrix({ x, y, z }) {
        return (new DOMMatrix()).translate(x, y, z);
    },
};

export default impl;
