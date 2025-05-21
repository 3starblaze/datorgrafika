import { H3, P } from "@/components/typography";
import {
    AsyncAwareImageDataDisplay,
    ImageDataDisplay,
    imageDataToGrayscale,
    mod,
} from "@/lib/image_util";
import sampleImg from "@/lib/sample_screenshot.png";

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

const interpolateBilinear = function (
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

    type IndexedGetter = (x: number, y: number) => number;

    const interpolate = (
        x: number,
        y: number,
        x0: number,
        x1: number,
        y0: number,
        y1: number,
        indexedGetter: IndexedGetter,
    ): number => {
        const f_x_y0 = ((x1 - x) / (x1 - x0)) * indexedGetter(x0, y0)
                     + ((x - x0) / (x1 - x0)) * indexedGetter(x1, y0);
        const f_x_y1 = ((x1 - x) / (x1 - x0)) * indexedGetter(x0, y1)
                     + ((x - x0) / (x1 - x0)) * indexedGetter(x1, y1);

        const f_xy = ((y1 - y) / (y1 - y0)) * f_x_y0 + ((y - y0) / (y1 - y0)) * f_x_y1;

        return f_xy;
    };

    const redGetter: IndexedGetter = (x, y) => imageData.data[4 * (x + y * imageData.width)];
    const blueGetter: IndexedGetter = (x, y) => imageData.data[4 * (x + y * imageData.width) + 1];
    const greenGetter: IndexedGetter = (x, y) => imageData.data[4 * (x + y * imageData.width) + 2];


    for (let i = 0; i < byteCount; i += 4) {
        const gridIndex = i / 4;

        const x = mod(gridIndex, width);
        const y = Math.floor(gridIndex / width);

        const targetX = (x / width) * imageData.width;
        const targetY = (y / height) * imageData.height;

        const x0 = Math.floor(targetX);
        const x1 = x0 + 1;
        const y0 = Math.floor(targetY);
        const y1 = y0 + 1;

        // FIXME: Interpolating channels doesn't look good
        res.data[4 * gridIndex + 0] = interpolate(targetX, targetY, x0, x1, y0, y1, redGetter);
        res.data[4 * gridIndex + 1] = interpolate(targetX, targetY, x0, x1, y0, y1, greenGetter);
        res.data[4 * gridIndex + 2] = interpolate(targetX, targetY, x0, x1, y0, y1, blueGetter);
        res.data[4 * gridIndex + 3] = 255; // NOTE: Full opacity
    }

    return res;
}

type ScaleFn = (imageData: ImageData, newWidth: number, newHeight: number) => ImageData

// NOTE: Assuming a, b already in grayscale
const meanSquaredDifference = function(a: ImageData, b: ImageData): number {
    if ((a.width !== b.width) || (a.height !== b.height)) {
        throw new Error("Can't compute differece between differently-sized")
    }

    const n = a.width * a.height;
    let res = 0;

    for (let i = 0; i < n; i++) {
        const diff = a.data[4 * i] - b.data[4 * i];

        res += diff * diff;
    }

    return res / n;
}

const ScaleCaseComponent = function({
    imageData,
    scaleFn,
    upscaleRatio,
}:{
    imageData: ImageData,
    scaleFn: ScaleFn,
    upscaleRatio: number,
}) {
    const {width, height} = imageData;

    const upscaled = scaleFn(
        imageData,
        Math.floor(upscaleRatio * width),
        Math.floor(upscaleRatio * height),
    );
    const downscaled = scaleFn(upscaled, width, height);

    const meanSquaredError = meanSquaredDifference(imageData, downscaled);

    return (
        <div>
            <ImageDataDisplay
                allowResizing={true}
                imageData={downscaled}
            />
            <p>MRE: {meanSquaredError.toFixed(2)}</p>
        </div>
    );
}

const ReadyComponent = function ({
    imageData,
}: {
    imageData: ImageData,
}) {
    const grayscale = imageDataToGrayscale(imageData);
    const upscaleRatio = 1.8;

    return (
        <div>
            <H3>Oriģinālais attēls</H3>
            <ImageDataDisplay
                allowResizing={true}
                imageData={imageData}
            />

            <H3>Melnbaltais attēls</H3>
            <ImageDataDisplay
                allowResizing={true}
                imageData={grayscale}
            />

            <H3>Kā tiek mērīta kvalitāte?</H3>
            <P>
                Attēls tiek palielināts {upscaleRatio.toFixed(2)} reizes un samazināts atpakaļ uz
                oriģinālo izmēru. Lai novērtētu kvalitāti, tiek mērīta vidēja kvadrātiskā kļūda MSE
                <i> (Mean squared error)</i>, kur jauniegūtā attēla pikseļa vērtības tiek
                salīdzinātas ar oriģinālā pikseļa vērtībām.
            </P>

            <H3>Nearest neighbor</H3>
            <ScaleCaseComponent
                imageData={grayscale}
                scaleFn={interpolateNearestNeighbor}
                upscaleRatio={upscaleRatio}
            />

            <H3>Bilinear interpolation</H3>
            <ScaleCaseComponent
                imageData={grayscale}
                scaleFn={interpolateBilinear}
                upscaleRatio={upscaleRatio}
            />
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
