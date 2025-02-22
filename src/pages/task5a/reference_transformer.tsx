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
    scaleToMatrix({ x, y, z }) {
        return (new DOMMatrix()).scale(x, y, z);
    },
    skewXY(a, b) {
        return (new DOMMatrix([
            1, 0, a, 0,
            0, 1, b, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]));
    },
    skewYZ(a, b) {
        return (new DOMMatrix([
            1, 0, 0, 0,
            a, 1, 0, 0,
            b, 0, 1, 0,
            0, 0, 0, 1,
        ]));
    },
    skewXZ(a, b) {
        return (new DOMMatrix([
            1, a, 0, 0,
            0, 1, 0, 0,
            0, b, 1, 0,
            0, 0, 0, 1,
        ]));
    },
    skew2DX(a) {
        return (new DOMMatrix([
            1, a, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]));
    },
    skew2DY(a) {
        return (new DOMMatrix([
            1, 0, 0, 0,
            a, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]));
    },
};

export default impl;
