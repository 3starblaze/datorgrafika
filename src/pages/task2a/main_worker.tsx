import { fourierTransform } from "./util";

export interface FourierTransformRequest {
    id: "fourier_transform_request",
    sourceImageData: ImageData,
}

export type WorkerRequest = FourierTransformRequest;

export interface FourierTransformResult {
    id: "fourier_transform_result",
    imageData: ImageData,
};

export type WorkerResponse = FourierTransformResult;

onmessage = (msg: MessageEvent<WorkerRequest>) => {
    const {data} = msg;
    switch (data.id) {
        case "fourier_transform_request":
            (async () => {
                const result: FourierTransformResult = {
                    id: "fourier_transform_result",
                    imageData: await fourierTransform(data.sourceImageData),
                };
                postMessage(result);
            })();
    }
};
