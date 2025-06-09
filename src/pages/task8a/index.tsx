import { H2, H3, P } from "@/components/typography";
import {
    AsyncAwareImageDataDisplay,
    ImageDataDisplay,
    mod,
} from "@/lib/image_util";
import sampleImg from "@/lib/sample_screenshot.png";
import { useEffect, useMemo } from "react";
import {
    imageDataToWasm,
    wasmToImageData,
    apply_grayscale,
    apply_lanczos3,
    test_lanczos3,
    test_catmull_rom,
    test_gaussian,
    test_triangle,
} from "@/lib/crate_util";

import { SourceCodeSection } from "@/components/source-code";

import thisString from ".?raw";
import crateUtilString from "@/lib/crate_util?raw";
import crateLibString from "@/../main_crate/src/lib.rs?raw";

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

const calculatePSNR = function(mse: number) {
    const MAX_VALUE = 255;

    return 20 * Math.log(MAX_VALUE) / Math.log(10) - 10 * Math.log(mse) / Math.log(10);
};

const calculateSSIM = function(a: ImageData, b: ImageData) {
    let covariance = 0;
    let varianceA = 0;
    let varianceB = 0;

    let sumA = 0;
    let sumB = 0;

    if ((a.width !== b.width) || (a.height !== b.height)) {
        throw new Error("Can't compute differece between differently-sized")
    }

    const n = a.width * a.height;

    for (let i = 0; i < n; i++) {
        sumA += a.data[4 * i];
        sumB += b.data[4 * i];
    }

    const meanA = sumA / n;
    const meanB = sumB / n;

    for (let i = 0; i < n; i++) {
        const deltaA = meanA - a.data[4 * i];
        const deltaB = meanB - b.data[4 * i];

        covariance += deltaA * deltaB;
        varianceA += deltaA * deltaA;
        varianceB += deltaB * deltaB;
    }

    covariance /= n;
    varianceA /= n;
    varianceB /= n;

    const L = 255;
    const k1 = 0.01;
    const k2 = 0.03;
    const c1 = (k1 * L) * (k1 * L);
    const c2 = (k2 * L) * (k2 * L);

    return ((2 * meanA * meanB + c1) * (2 * covariance + c2)) /
        ((meanA * meanA + meanB * meanB + c1) * (varianceA + varianceB + c2));
};

const PreprocessedScaleCaseComponent = function({
    oldImageData,
    newImageData,
}: {
    oldImageData: ImageData,
    newImageData: ImageData,
}) {
    const MSE = meanSquaredDifference(newImageData, oldImageData);
    const PSNR = calculatePSNR(MSE);
    const SSIM = calculateSSIM(newImageData, oldImageData);

    const format = (val: number) => val.toFixed(3);

    return (
        <div>
            <ImageDataDisplay
                allowResizing={true}
                imageData={oldImageData}
            />
            <div className="grid grid-cols-[auto_auto] w-fit gap-x-2">
                <p className="font-bold">MSE</p>
                <p>{format(MSE)}</p>

                <p className="font-bold">PSNR</p>
                <p>{PSNR === Infinity ? (<>&infin;</>) : format(PSNR)} dB</p>

                <p className="font-bold">SSIM</p>
                <p>{format(SSIM)}</p>
            </div>
        </div>
    );
}

const ScaleCaseComponent = function ({
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

    return (
        <PreprocessedScaleCaseComponent
            oldImageData={imageData}
            newImageData={downscaled}
        />
    );
}

const QualityInfo = function ({
    upscaleRatio,
}: {
    upscaleRatio: number,
}) {
    return (
        <>
            <H3>Kā tiek mērīta kvalitāte?</H3>
            <P>
                Attēls tiek palielināts {upscaleRatio.toFixed(2)} reizes un samazināts atpakaļ uz
                oriģinālo izmēru. Lai novērtētu kvalitāti, tiek izmantotas šādas metrikas:
                <ul className="ml-4 list-disc">
                    <li>
                        MSE (Mean Squared Error) &mdash; vidējā kvadrātiskā kļūda</li>
                    <li>
                        <a
                            className="underline text-blue-500"
                            href="https://en.wikipedia.org/wiki/Peak_signal-to-noise_ratio"
                        >
                            PSNR (Peak signal-to-noise ratio)
                        </a> &mdash;
                        attiecība starp lielāko "signāla" vērtību un troksni
                    </li>
                    <li>
                        <a
                            className="underline text-blue-500"
                            href="https://en.wikipedia.org/wiki/Structural_similarity_index_measure"
                        >
                            SSIM (Structural similarity index measure)
                        </a>
                        &mdash;
                        Korelācijas indekss diapazonā no -1 līdz 1, kur 1 nozīmē perfektu
                        korelāciju, -1 &mdash; perfektu antikorelāciju un 0 &mdash; nekādu
                        korelāciju.
                    </li>
                </ul>
            </P>
        </>
    );
};

const ReadyComponent = function ({
    imageData,
}: {
    imageData: ImageData,
}) {
    const upscaleRatio = 1.8;
    const grayscaleWasm = useMemo(() => {
        const wasmImageData = imageDataToWasm(imageData);

        apply_grayscale(wasmImageData);

        return wasmImageData;
    }, []);

    const grayscale = useMemo(() => {
        return wasmToImageData(grayscaleWasm);
    }, [grayscaleWasm]);

    const lanczos3Data = useMemo(() => {
        const newImageData = test_lanczos3(grayscaleWasm, upscaleRatio);

        const res = wasmToImageData(newImageData);

        return res;
    }, []);

    const catmullRomData = useMemo(() => {
        return wasmToImageData(test_catmull_rom(grayscaleWasm, upscaleRatio));
    }, []);

    const gaussianData = useMemo(() => {
        return wasmToImageData(test_gaussian(grayscaleWasm, upscaleRatio));
    }, []);

    const triangleData = useMemo(() => {
        return wasmToImageData(test_triangle(grayscaleWasm, upscaleRatio));
    }, []);

    return (
        <div>
            <H2>Uzdevums (8a)</H2>

            <SourceCodeSection
                sources={[
                    { title: "./index", contentString: thisString },
                    { title: "@/lib/crate_util", contentString: crateUtilString },
                    { title: "@/../main_crate/src/lib.rs", contentString: crateLibString },
                ]}
            />

            <H3>Apraksts</H3>

            <P>
                Lai iztestētu attēlu transformācijas, tika izmantots <i>image::imageops</i>,
                kas ir pieejams uz <i>Rust</i> programmēšanas valodas. Lai Rust izmantotu priekšgalā
                (frontend), Rust kods tika kompilēts uz <i>WASM</i>. Tika izveidota papildus
                funkcionalitāte, lai WASM modulis spētu piekļūt un apstrādāt attēla datus.
            </P>

            <P>
                Ideālajā gadījumā šī funkcionalitāte būtu aizstumta prom no galvenā pavediena, bet
                koordinēt WASM moduļa atmiņu nebija triviāli un galu galā darbība notiek tikai uz
                galvenā pavediena. Īsumā, ja buferi grib izmantot cits pavediens un bufera kopēšana
                nav pieņemama opcija, tad buferi vajag atdot (<i>transfer</i>) pavedienam. Lai WASM
                modulis spētu veikt savu darbu, datiem jābūt WASM moduļa atmiņā (kas ir buferis).
                Tātad vajag koordinēt WASM moduļa atmiņas nodošanu. Tas nav sarežģīti, bet ir
                laikietilpīgi.
            </P>

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

            <QualityInfo upscaleRatio={upscaleRatio} />

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

            <H3>Lanczos3</H3>
            <PreprocessedScaleCaseComponent
                oldImageData={grayscale}
                newImageData={lanczos3Data}
            />

            <H3>Catmull-Rom</H3>
            <PreprocessedScaleCaseComponent
                oldImageData={grayscale}
                newImageData={catmullRomData}
            />

            <H3>Gaussian</H3>
            <PreprocessedScaleCaseComponent
                oldImageData={grayscale}
                newImageData={gaussianData}
            />

            <H3>Triangle</H3>
            <PreprocessedScaleCaseComponent
                oldImageData={grayscale}
                newImageData={triangleData}
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
