
const BYTES_PER_PIXEL = 4;

export const rgbToGray = function (r: number, g: number, b: number) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const calculateTwiddle = function (n: number, u: number, k: number): number {
    const sign = (k % 2 === 1) ? -1 : 1;
    return sign * Math.cos(2 * Math.PI * u * k / n);
};

export const makeMemoizedTwiddle = function (n: number): (u: number, k: number) => number {
    const cache = new Float64Array(n * n);
    for (let u = 0; u < n; u++) {
        for (let k = 0; k < n; k++) {
            cache[u*n + k] = calculateTwiddle(n, u, k);
        }
    }

    return (u, k) => cache[u*n + k];
};

const incrementValue = (destinationArray: Uint8ClampedArray, index: number, delta: number) => {
    destinationArray[index + 0] += delta;
    destinationArray[index + 1] += delta;
    destinationArray[index + 2] += delta;
    destinationArray[index + 3] = 255; // NOTE: Full opacity
};

const rowwiseFourierTransform = function (sourceImageData: ImageData) {
    const { width, height } = sourceImageData;

    const res = new ImageData(
        new Uint8ClampedArray(sourceImageData.data.length),
        width,
        height,
    );

    const n = width;
    const getTwiddle = makeMemoizedTwiddle(n);

    for (let row = 0; row < height; row++) {
        const absoluteIndex = (i: number) => (row * width + i) * BYTES_PER_PIXEL;
        for (let u = 0; u < n; u++) {
            const indexU = absoluteIndex(u);

            for (let k = 0; k < n; k++) {
                incrementValue(
                    res.data,
                    indexU,
                    getTwiddle(u, k) * sourceImageData.data[absoluteIndex(k)],
                );
            }
        }
    }

    return res;
};

const columnwiseFourierTransform = function (sourceImageData: ImageData) {
    const { width, height } = sourceImageData;

    const res = new ImageData(
        new Uint8ClampedArray(sourceImageData.data.length),
        width,
        height,
    );

    const n = sourceImageData.height;
    const getTwiddle = makeMemoizedTwiddle(n);

    for (let col = 0; col < width; col++) {
        const absoluteIndex = (i: number) => (i * width + col) * BYTES_PER_PIXEL;
        for (let u = 0; u < n; u++) {
            const indexU = absoluteIndex(u);

            for (let k = 0; k < n; k++) {
                incrementValue(
                    res.data,
                    indexU,
                    getTwiddle(u, k) * sourceImageData.data[absoluteIndex(k)],
                );
            }
        }
    }

    return res;
};

export const fourierTransform = async function (imageData: ImageData) {
    return columnwiseFourierTransform(rowwiseFourierTransform(imageData));
};
