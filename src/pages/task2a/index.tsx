import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import sampleImg from "./sample_screenshot.png";

const rgbToGray = function (r: number, g: number, b: number) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const calculateTwiddle = function (n: number, u: number, k: number): number {
    const sign = (k % 2 === 1) ? -1 : 1;
    return sign * Math.cos(2 * Math.PI * u * k / n);
};

const makeMemoizedTwiddle = function (n: number): (u: number, k: number) => number {
    const cache = new Float64Array(n * n);
    for (let u = 0; u < n; u++) {
        for (let k = 0; k < n; k++) {
            cache[u*n + k] = calculateTwiddle(n, u, k);
        }
    }

    return (u, k) => cache[u*n + k];
};

const fourierTransform = async function (imageData: ImageData) {
    const res = new ImageData(
        new Uint8ClampedArray(imageData.data.length),
        imageData.width,
        imageData.height
    );

    const incrementValue = (index: number, delta: number) => {
        res.data[index + 0] += delta;
        res.data[index + 1] += delta;
        res.data[index + 2] += delta;
        res.data[index + 3] = 255; // NOTE: Full opacity
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
                incrementValue(indexU, getTwiddle(u, k) * imageData.data[absoluteIndex(k)]);
            }
        }
    }

    /* const res1 = new ImageData(
*     new Uint8ClampedArray(imageData.data.length),
*     imageData.width,
*     imageData.height
* );

* n = imageData.height;
* getTwiddle = makeMemoizedTwiddle(n);
* for (let col = 0; col < imageData.width; col++) {
*     const absoluteIndex = (i: number) => (i * imageData.width + col) * BYTES_PER_PIXEL;
*     for (let u = 0; u < n; u++) {
*         const indexU = absoluteIndex(u);

*         for (let k = 0; k < n; k++) {
*             incrementValue(indexU, getTwiddle(u, k) * imageData.data[absoluteIndex(k)]);
*         }
*     }
* } */

    return res;
};

type MaybeLoading<T> = null | "loading" | T;

const useBindImageToCanvas = function (
    imageData: MaybeLoading<ImageData>,
    canvasRef: RefObject<HTMLCanvasElement | null>,
) {
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // NOTE: We put the imageData check here, so that we clear canvas when imageData is not
        // available
        if (imageData === null || imageData === "loading") return;
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
    }, [canvasRef, imageData]);
};

export default function Task() {
    const [imageData, setImageData] = useState<null | ImageData>(null);

    const grayscaleCanvasRef = useRef<HTMLCanvasElement>(null);
    const transformCanvasRef = useRef<HTMLCanvasElement>(null);

    const grayscaleImageData = useMemo<ImageData | null>(() => {
        if (imageData === null) return null;

        const res = new ImageData(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
        );

        for (let i = 0; i < 4 * imageData.width * imageData.height; i += 4) {
            const r = i;
            const g = i+1;
            const b = i+2;
            const strength = rgbToGray(imageData.data[r], imageData.data[g], imageData.data[b]);
            res.data[r] = strength;
            res.data[g] = strength;
            res.data[b] = strength;
        }

        return res;
    }, [imageData]);

    const [fourierTransformData, setFourierTransformData] = useState<MaybeLoading<ImageData>>(null);

    useEffect(() => {
        if (grayscaleImageData === null) {
            setFourierTransformData(null);
            return;
        }
        // NOTE: Loading does nor work, you probably want to offload this stuff to a worker
        setFourierTransformData("loading");
        (async () => {
            setFourierTransformData(await fourierTransform(grayscaleImageData));
        })();
    }, [grayscaleImageData]);


    useBindImageToCanvas(grayscaleImageData, grayscaleCanvasRef);

    useBindImageToCanvas(fourierTransformData, transformCanvasRef);

    useEffect(() => {
        (async () => {
            const image = new Image();
            const loadPromise = new Promise<void>((resolve) => {
                image.addEventListener("load", () => resolve());
            });


            image.src = sampleImg;
            await loadPromise;
            const context = Object.assign(document.createElement('canvas'), {
                width: image.width,
                height: image.height
            }).getContext('2d');
            if (!context) throw new Error("couldn't get context!");
            context.imageSmoothingEnabled = false;
            context.drawImage(image, 0, 0);
            setImageData(context.getImageData(0, 0, image.width, image.height));
        })();
    }, []);

    return (
        <div>
            <p className="text-lg">Oriģinālais attēls</p>
            <img src={sampleImg} alt="Koda redaktora ekrānuzņēmums" />

            <p className="text-lg">Melnbaltais attēls</p>
            <canvas ref={grayscaleCanvasRef} />

            <p className="text-lg">Attēls, kuram pielietota Furjē transformācija</p>
            {(fourierTransformData === "loading") && (<p>Transformācija tiek veikta, lūdzu uzgaidiet</p>)}
            <canvas ref={transformCanvasRef} />
        </div>
    );
};
