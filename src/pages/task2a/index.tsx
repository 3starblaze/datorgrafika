import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import sampleImg from "./sample_screenshot.png";
import MainWorker from "./main_worker?worker";
import {
    WorkerRequest,
    WorkerResponse,
} from "./main_worker";
import { rgbToGray } from "./util";

import thisString from ".?raw";
import mainWorkerString from "./main_worker?raw";
import utilString from "./util?raw";
import { SourceCodeSection } from "@/components/source-code";

/**
 * Type for reporting values that can have "loading" state.
 *
 * This type is needed because my (I)DFT implementation is slow enough to warrant a loading message.
 */
type MaybeLoading<T> = null | "loading" | T;
type State<T> = [T, (value: T) => void];

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

const useWorker = function(onmessage: Worker["onmessage"]) {
    const worker = useRef<Worker>(null);

    useEffect(() => {
        worker.current = new MainWorker();
        worker.current.onmessage = onmessage;
        return () => {
            // NOTE: Worker should be destroyed on unmount to prevent useless work being done
            worker.current?.terminate();
        };
    }, []);

    return worker
};


const useScheduleWorkerAction = function<T>(
    sourceImageData: ImageData | null,
    workerRef: RefObject<Worker | null>,
    state: State<MaybeLoading<T>>,
    messageConstructor: (imageData: ImageData) => WorkerRequest,
): void {
    useEffect(() => {
        if (sourceImageData === null) {
            state[1](null);
            return;
        }

        if (!workerRef.current) return;

        state[1]("loading");

        workerRef.current.postMessage(messageConstructor(sourceImageData));
    }, [sourceImageData]);
};

const MaybeCanvas = function({
    maybeImageData,
    loadingText,
}: {
    maybeImageData: MaybeLoading<ImageData>,
    loadingText: string,
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useBindImageToCanvas(maybeImageData, canvasRef);

    return (
        <div>
            {(maybeImageData === "loading") && (
                <div className="flex gap-4 mt-2 items-center">
                    <p className="text-gray-500">{loadingText}</p>
                    <div className="h-4 w-4 bg-gray-500 animate-spin"></div>
                </div>
            )}
            <canvas ref={canvasRef} />
        </div>
    );
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

    const fourierTransformDataState = useState<MaybeLoading<ImageData>>(null);
    const [fourierTransformData, setFourierTransformData] = fourierTransformDataState;

    const inverseFourierTransformDataState = useState<MaybeLoading<ImageData>>(null);
    const [inverseFourierTransformData, setInverseFourierTransformData] = inverseFourierTransformDataState;

    const transformWorker = useWorker(({ data }: MessageEvent<WorkerResponse>) => {
        switch (data.id) {
            case "fourier_transform_result":
                setFourierTransformData(data.imageData);
                break;
        }
    });

    useScheduleWorkerAction(
        grayscaleImageData,
        transformWorker,
        fourierTransformDataState,
        (data) => ({
            id: "fourier_transform_request",
            sourceImageData: data,
        })
    );

    const inverseTransformWorker = useWorker(({ data }: MessageEvent<WorkerResponse>) => {
        switch (data.id) {
            case "inverse_fourier_transform_result":
                setInverseFourierTransformData(data.imageData);
                break;
        }
    });

    useScheduleWorkerAction(
        grayscaleImageData,
        inverseTransformWorker,
        inverseFourierTransformDataState,
        (data) => ({
            id: "inverse_fourier_transform_request",
            sourceImageData: data,
        }),
    );

    useBindImageToCanvas(grayscaleImageData, grayscaleCanvasRef);

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
            <h2 className="text-4xl mb-4">Uzdevums (2a)</h2>

            <SourceCodeSection
                sources={[
                    { title: "./index", contentString: thisString },
                    { title: "./main_worker", contentString: mainWorkerString },
                    { title: "./util", contentString: utilString },
                ]}
            />

            <h3 className="text-2xl my-4">Apraksts</h3>
            <p className="max-w-[40rem] my-2">
                Galvenā algoritma darbība notiek <pre className="inline text-blue-500">./util
                </pre> failā. Tika izmantots primitīvs (I)DFT algoritms, kas tika nedaudz paātrināts
                ar koeficientu saglabāšanu masīvos, jo to bija viegli implementēt.
            </p>
            <p className="max-w-[40rem] my-2">
                Tā kā DFT un IDFT ir laikietilpīgas operācijas, tās tiek veiktas atsevišķos
                pavedienos, izmantojot <i>Web workers</i>. Galvenā motivācija šim lēmumam bija
                galvenā pavediena atbrīvošana. Ja galvenais pavediens ir aizņemts, mājaslapas
                saskarne tiek iesaldēta, kas dod ļoti negatīvu lietotāja pieredzi, it īpaši,
                ja uz šī uzdevuma cilni uzspiež netīšām. Kā patīkams pārsteigums, abas
                transformācijas tika pabeigtas ātrāk, jo tās tika veiktas paralēli.
            </p>

            <h3 className="text-2xl my-4">Oriģinālais attēls</h3>
            <img src={sampleImg} alt="Koda redaktora ekrānuzņēmums" />

            <h3 className="text-2xl my-4">Melnbaltais attēls</h3>
            <canvas ref={grayscaleCanvasRef} />

            <h3 className="text-2xl my-4">Attēls, kuram pielietota Furjē transformācija</h3>
            <MaybeCanvas
                maybeImageData={fourierTransformData}
                loadingText="Transformācija tiek veikta, lūdzu uzgaidiet..."
            />

            <h3 className="text-2xl my-4">Attēls, kuram pielietota inversā Furjē transformācija</h3>
            <MaybeCanvas
                maybeImageData={inverseFourierTransformData}
                loadingText="Inversā transformācija tiek veikta, lūdzu uzgaidiet..."
            />
        </div>
    );
};
