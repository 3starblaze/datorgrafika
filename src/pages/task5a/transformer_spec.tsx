export interface Transformer {
    transformPoint: (point: DOMPoint, matrix: DOMMatrix) => DOMPoint,
    translateToMatrix: (translateVector: DOMPoint) => DOMMatrix,
    scaleToMatrix: (scaleVector: DOMPoint) => DOMMatrix,
    reduceMatrix: (a: DOMMatrix, b: DOMMatrix) => DOMMatrix,
    skewXY: (a: number, b: number) => DOMMatrix,
    skewYZ: (a: number, b: number) => DOMMatrix,
    skewXZ: (a: number, b: number) => DOMMatrix,
    skew2DX: (a: number) => DOMMatrix,
    skew2DY: (a: number) => DOMMatrix,
};
