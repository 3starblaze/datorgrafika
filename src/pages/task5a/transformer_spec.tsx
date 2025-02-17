export interface Transformer {
    transformPoint: (point: DOMPoint, matrix: DOMMatrix) => DOMPoint,
    translateToMatrix: (translateVector: DOMPoint) => DOMMatrix,
    scaleToMatrix: (scaleVector: DOMPoint) => DOMMatrix,
    reduceMatrix: (a: DOMMatrix, b: DOMMatrix) => DOMMatrix,
};
