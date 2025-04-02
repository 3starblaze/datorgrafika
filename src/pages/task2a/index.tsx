import { useEffect, useMemo, useRef, useState } from "react";
import sampleImg from "./sample_screenshot.png";

const rgbToGray = function (r: number, g: number, b: number) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export default function Task() {
    const [imageData, setImageData] = useState<null | ImageData>(null);

    const grayscaleCanvasRef = useRef<HTMLCanvasElement>(null);

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

    useEffect(() => {
        const canvas = grayscaleCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!grayscaleImageData) return;
        canvas.width = grayscaleImageData.width;
        canvas.height = grayscaleImageData.height;
        ctx.putImageData(grayscaleImageData, 0, 0);
    }, [grayscaleImageData]);

    useEffect(() => {
        (async () => {
            const image = new Image();
            const loadPromise = new Promise<void>((resolve) => {
                image.addEventListener("load", () => resolve());
            });


            image.src = sampleImg;
            console.log("before promise");
            await loadPromise;
            console.log("after promise");
            const context = Object.assign(document.createElement('canvas'), {
                width: image.width,
                height: image.height
            }).getContext('2d');
            console.log("before context");
            if (!context) throw new Error("couldn't get context!");
            console.log("after context");
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
        </div>
    );
};
