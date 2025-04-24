
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

export const fourierTransform = async function (imageData: ImageData) {
    const res0 = new ImageData(
        new Uint8ClampedArray(imageData.data.length),
        imageData.width,
        imageData.height
    );

    const incrementValue = (arr: Uint8ClampedArray, index: number, delta: number) => {
        arr[index + 0] += delta;
        arr[index + 1] += delta;
        arr[index + 2] += delta;
        arr[index + 3] = 255; // NOTE: Full opacity
    };

    const BYTES_PER_PIXEL = 4;
    let n;
    let getTwiddle;

    n = imageData.width;
    getTwiddle = makeMemoizedTwiddle(n);
    for (let row = 0; row < imageData.height; row++) {
        const absoluteIndex = (i: number) => (row * imageData.width + i) * BYTES_PER_PIXEL;
        for (let u = 0; u < n; u++) {
            const indexU = absoluteIndex(u);

            for (let k = 0; k < n; k++) {
                incrementValue(res0.data, indexU, getTwiddle(u, k) * imageData.data[absoluteIndex(k)]);
            }
        }
    }

    const res1 = new ImageData(
        new Uint8ClampedArray(imageData.data.length),
        imageData.width,
        imageData.height
    );

    n = imageData.height;
    getTwiddle = makeMemoizedTwiddle(n);
    for (let col = 0; col < imageData.width; col++) {
        const absoluteIndex = (i: number) => (i * imageData.width + col) * BYTES_PER_PIXEL;
        for (let u = 0; u < n; u++) {
            const indexU = absoluteIndex(u);

            for (let k = 0; k < n; k++) {
                incrementValue(res1.data, indexU, getTwiddle(u, k) * res0.data[absoluteIndex(k)]);
            }
        }
    }

    return res1;
};
