import { useEffect, useRef, useState } from "react";
import sampleImg from "./sample_screenshot.png";

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

// NOTE: % gives remainder which is negative
const mod = function(n: number, m: number) {
    return ((n % m) + m) % m;
};

const interpolateNearestNeighbor = function (
    imageData: ImageData,
    width: number,
    height: number,
): ImageData {
    const byteCount = 4 * width * height;
    const res = new ImageData(
        new Uint8ClampedArray(byteCount),
        width,
        height,
    );

    for (let i = 0; i < byteCount; i += 4) {
        const gridIndex = i/4;

        const x = mod(gridIndex, width);
        const y = Math.floor(gridIndex / width);

        const targetX = Math.round((x / width) * imageData.width);
        const targetY = Math.round((y / height) * imageData.height);
        const targetGridIndex = targetX + targetY * imageData.width;

        res.data[4 * gridIndex + 0] = imageData.data[4 * targetGridIndex + 0];
        res.data[4 * gridIndex + 1] = imageData.data[4 * targetGridIndex + 1];
        res.data[4 * gridIndex + 2] = imageData.data[4 * targetGridIndex + 2];
        res.data[4 * gridIndex + 3] = imageData.data[4 * targetGridIndex + 3];
    }

    return res;
};

const ImageDataDisplay = function ({
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

const LoadedComponent = function ({
    sourceImageData,
}: {
    sourceImageData: ImageData,
}) {
    return (
        <div>
            <h3 className="text-2xl my-4">Oriģinālais attēls</h3>
            <ImageDataDisplay imageData={sourceImageData} />

            <h3 className="text-2xl my-4">Nearest neighbor (400x200)</h3>
            <ImageDataDisplay imageData={interpolateNearestNeighbor(
                sourceImageData,
                400,
                200,
            )} />
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
