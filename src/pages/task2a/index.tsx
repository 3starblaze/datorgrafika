import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import sampleImg from "./sample_screenshot.png";
import MainWorker from "./main_worker?worker";
import {
    FourierTransformRequest,
    WorkerResponse,
} from "./main_worker";
import { rgbToGray } from "./util";

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
    const worker = useRef<Worker>(null);

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

    // NOTE: Worker setup
    useEffect(() => {
        worker.current = new MainWorker();
        worker.current.onmessage = ({data}: MessageEvent<WorkerResponse>) => {
            switch (data.id) {
                case "fourier_transform_result":
                    setFourierTransformData(data.imageData);
                    console.log("got DFT result!");
            }
        };
        return () => {
            // NOTE: Worker should be destroyed on unmount to prevent useless work being done
            worker.current?.terminate();
        };
    }, []);

    // NOTE: Effect that starts Fourier transform when grayscale image is available
    useEffect(() => {
        if (grayscaleImageData === null) {
            setFourierTransformData(null);
            return;
        }
        if (!worker.current) return;

        setFourierTransformData("loading");
        const message: FourierTransformRequest = {
            id: "fourier_transform_request",
            sourceImageData: grayscaleImageData,
        };
        worker.current.postMessage(message);
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
            {(fourierTransformData === "loading") && (
                <div className="flex gap-4 mt-2 items-center">
                    <p className="text-gray-500">Transformācija tiek veikta, lūdzu uzgaidiet...</p>
                    <div className="h-4 w-4 bg-gray-500 animate-spin"></div>
                </div>
            )}
            <canvas ref={transformCanvasRef} />
        </div>
    );
};
