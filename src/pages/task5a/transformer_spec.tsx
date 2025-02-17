export interface Transformer {
    transformPoint: (point: DOMPoint, matrix: DOMMatrix) => DOMPoint,
    translateToMatrix: (translateVector: DOMPoint) => DOMMatrix,
    reduceMatrix: (a: DOMMatrix, b: DOMMatrix) => DOMMatrix,
};
