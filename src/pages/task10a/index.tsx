import {
    AsyncAwareImageDataDisplay,
    ImageDataDisplay,
    mod,
} from "@/lib/image_util";
import sampleImg from "@/lib/sample_screenshot.png";

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

const ReadyComponent = function({
    imageData,
}: {
    imageData: ImageData,
}) {
    const conv = (kernel: Kernel) => imageDataToConvolvedImageData(imageData, kernel);

    const boxBlur3ImageData = conv(boxBlur3);
    const gaussianBlur3ImageData = conv(gaussianBlur3);

    return (
        <div>
            <h3 className="text-2xl my-4">Oriģinālais attēls</h3>
            <ImageDataDisplay imageData={imageData} />

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
    return (
        <AsyncAwareImageDataDisplay
            imgUrl={sampleImg}
            PlaceholderComponent={() => (<p>Lūdzu uzgaidiet</p>)}
            ReadyComponent={ReadyComponent}
        />
    );
};
