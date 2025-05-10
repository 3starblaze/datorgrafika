import { useEffect, useRef, useState } from "react";
import sampleImg from "./sample_screenshot.png";

type Kernel = {
    squareLength: number,
    data: number[],
};

const boxBlur3: Kernel = {
    squareLength: 3,
    data: [
        1, 1, 1,
        1, 1, 1,
        1, 1, 1,
    ].map((n) => n/9),
};

const gaussianBlur3: Kernel = {
    squareLength: 3,
    data: [
        1, 2, 1,
        2, 4, 2,
        1, 2, 1,
    ].map((n) => n / 16),
};

const gaussianBlur5: Kernel = {
    squareLength: 5,
    data: [
        1, 4,  6,  4,  1,
        4, 16, 24, 16, 4,
        6, 24, 36, 24, 6,
        4, 16, 24, 16, 4,
        1, 4,  6,  4,  1,
    ].map((n) => n / 256),
};

const isKernelValid = function ({ squareLength, data }: Kernel) {
    // NOTE: Kernel must be odd-sized because the kernel must have a central element
    return (squareLength % 2 === 1) && (squareLength * squareLength == data.length);
};

// NOTE: % gives remainder which is negative
const mod = function(n: number, m: number) {
    return ((n % m) + m) % m;
};

const imageDataToConvolvedImageData = function(
    imageData: ImageData,
    kernel: Kernel,
) {
    if (!isKernelValid) throw new Error("Invalid kernel");

    const {width, height} = imageData;

    const res = new ImageData(
        new Uint8ClampedArray(imageData.data.length),
        width,
        height,
    );


    const originToKernelIndices = function(origin: number): number[] {
        const x = mod(origin, width);
        const y = Math.floor(origin / width);

        const l = kernel.squareLength;
        // NOTE: shift is an integer because squareLength must be odd
        const shift = (l - 1) / 2;

        return [...Array(l * l).keys()].map((i) => {
            const dx = (i % l) - shift;
            const dy = Math.floor(i / l) - shift;

            const newX = mod(x + dx, width);
            const newY = mod(y + dy, height);

            return newX + newY * width;
        });
    };


    for (let i = 0; i < 4 * imageData.width * imageData.height; i += 4) {
        const gridIndex = i / 4;

        originToKernelIndices(gridIndex).forEach((targetIndex, relativeKernelIndex) => {
            const strength = kernel.data[relativeKernelIndex];

            res.data[i + 0] += imageData.data[4 * targetIndex + 0] * strength;
            res.data[i + 1] += imageData.data[4 * targetIndex + 1] * strength;
            res.data[i + 2] += imageData.data[4 * targetIndex + 2] * strength;
            res.data[i + 3] = 255; // NOTE: Full opacity
        });
    }

    return res;
};

const imageToImageData = async function (imageSource: string) {
    const image = new Image();
    const loadPromise = new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve());
    });

    image.src = imageSource;
    await loadPromise;
    const context = Object.assign(document.createElement('canvas'), {
        width: image.width,
        height: image.height
    }).getContext('2d');
    if (!context) throw new Error("couldn't get context!");
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, image.width, image.height);
};

const ImageDataDisplay = function({
    imageData,
}: {
    imageData: ImageData,
}) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        canvas.width = imageData.width;
        canvas.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
    }, [canvasRef, imageData]);

    return (
        <canvas ref={canvasRef} />
    );
};

const LoadedComponent = function({
    sourceImageData,
}: {
    sourceImageData: ImageData,
}) {
    const conv = (kernel: Kernel) => imageDataToConvolvedImageData(sourceImageData, kernel);

    const boxBlur3ImageData = conv(boxBlur3);
    const gaussianBlur3ImageData = conv(gaussianBlur3);

    return (
        <div>
            <h3 className="text-2xl my-4">Oriģinālais attēls</h3>
            <ImageDataDisplay imageData={sourceImageData} />

            <h3 className="text-2xl my-4">Box blur 3 attēls</h3>
            <ImageDataDisplay imageData={boxBlur3ImageData} />

            <h3 className="text-2xl my-4">Gaussian blur 3 attēls</h3>
            <ImageDataDisplay imageData={gaussianBlur3ImageData} />

            <h3 className="text-2xl my-4">Gaussian blur 5 attēls</h3>
            <ImageDataDisplay imageData={conv(gaussianBlur5)} />
        </div>
    );
};


export default function () {
    // NOTE: We have to jump through some hoops because imageData retrieval is async and component
    // logic would quickly become messy when every derived image checks for source imageData
    // existence.
    const [imageData, setImageData] = useState<ImageData | null>(null);

    useEffect(() => {
        (async () => {
            setImageData(await imageToImageData(sampleImg));
        })()
    }, []);


    return (imageData === null) ? (
        <p>Lūdzu uzgaidiet</p>
    ) : (
        <LoadedComponent sourceImageData={imageData} />
    );
};
