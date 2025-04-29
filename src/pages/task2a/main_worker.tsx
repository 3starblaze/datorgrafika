import { fourierTransform, inverseFourierTransform } from "./util";

export interface FourierTransformRequest {
    id: "fourier_transform_request",
    sourceImageData: ImageData,
}

export interface InverseFourierTransformRequest {
    id: "inverse_fourier_transform_request",
    sourceImageData: ImageData,
}

export type WorkerRequest = FourierTransformRequest | InverseFourierTransformRequest;

export interface FourierTransformResult {
    id: "fourier_transform_result",
    imageData: ImageData,
};

export interface InverseFourierTransformResult {
    id: "inverse_fourier_transform_result",
    imageData: ImageData,
};

export type WorkerResponse = FourierTransformResult | InverseFourierTransformResult;

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
            break;
        case "inverse_fourier_transform_request":
            const result: InverseFourierTransformResult = {
                id: "inverse_fourier_transform_result",
                imageData: inverseFourierTransform(data.sourceImageData),
            };
            postMessage(result);
            break;
    }
};
