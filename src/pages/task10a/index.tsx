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

const grayscaledImageData = function (imageData: ImageData): ImageData {
    const rgbToGray = function (r: number, g: number, b: number) {
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const res = new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
    );

    for (let i = 0; i < 4 * imageData.width * imageData.height; i += 4) {
        const r = i;
        const g = i + 1;
        const b = i + 2;
        const strength = rgbToGray(imageData.data[r], imageData.data[g], imageData.data[b]);
        res.data[r] = strength;
        res.data[g] = strength;
        res.data[b] = strength;
    }

    return res;
};

const LoadedComponent = function({
    sourceImageData,
}: {
    sourceImageData: ImageData,
}) {
    // NOTE: Grayscale is not needed for this task but this is a quick way to check imageData
    // pipeline is going well
    const grayscaleImageData = grayscaledImageData(sourceImageData);

    return (
        <div>
            <h3 className="text-2xl my-4">Oriģinālais attēls</h3>
            <ImageDataDisplay imageData={sourceImageData} />

            <h3 className="text-2xl my-4">Melnbaltais attēls (tmp)</h3>
            <ImageDataDisplay imageData={grayscaleImageData} />
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
