import {
    AsyncAwareMultiImageDataDisplay,
    ImageDataDisplay,
    imageDataToGrayscale,
} from "@/lib/image_util";
import sampleImg from "@/lib/sample_screenshot.png";
import samplePhoto from "@/lib/sample_photo.jpg"


const getHistogram = function(imageData: ImageData) {
    const res: number[] = [...Array(256).keys()].map((_) => 0);

    for (let i = 0; i < imageData.width * imageData.height; i++) {
        // NOTE: We assume that we have grayscale data, so it doesn't matter which channel we take
        // the value
        const value = imageData.data[4 * i];
        res[value]++;
    }

    return res;
};

/**
 * Given histogram with n occurences, return a map that equalizes image's histogram.
 *
 * @returns Mapping array where key is the old intensity and value is the new intensity
 */
const makeHistogramEqualizationMap = function(
    histogram: number[],
    n: number,
): number[] {
    const cdf: number[] = [];

    cdf[0] = histogram[0];

    const iterator = histogram[Symbol.iterator]();
    iterator.next();

    for (const val of iterator) {
        cdf.push(cdf[cdf.length - 1] + val);
    }

    const cdfMin = Math.min(...cdf.filter((val) => val !== 0));

    return cdf.map((cdfValue) => Math.round((cdfValue - cdfMin) / (n - cdfMin) * 255));
};

const BarDisplay = function({
    values,
}: {
    values: number[],
}) {
    return (
        <div className="flex bg-gray-100 h-16 w-100">
            {values.map((value, i) => (
                <div
                    key={i}
                    className="bg-black w-full"
                    style={{
                        height: `${100 * value}%`,
                    }}>
                </div>
            ))}
        </div>
    );
};

const HistogramDisplay = function ({
    imageData,
}: {
    imageData: ImageData,
}) {
    const histogram = getHistogram(imageData);
    const histMax = Math.max(...histogram);

    return (
        <div>
            <h4>Histogramma</h4>
            <BarDisplay values={histogram.map((v) => v / histMax)} />

            <h4>Histogramma (f(x) = ln(x+1))</h4>
            <BarDisplay values={histogram.map((v) => Math.log(v + 1) / Math.log(histMax + 1))} />
        </div>
    );
}

type ImageUrlMap = {
    screenshot: string,
    photo: string,
};

const grayscaleMap = function(
    imageData: ImageData,
    callbackfn: (value: number) => number,
): ImageData {
    const { width, height } = imageData;

    const res = new ImageData(
        new Uint8ClampedArray(imageData.data.length),
        width,
        height,
    );

    for (let i = 0; i < width * height * 4; i += 4) {
        const value = callbackfn(imageData.data[i]);
        res.data[i + 0] = value;
        res.data[i + 1] = value;
        res.data[i + 2] = value;
        res.data[i + 3] = 255; // NOTE: Full opacity
    }

    return res;
};

const OneImageAnalysis = function ({
    imageData,
}: {
    imageData: ImageData,
}) {
    const grayscale = imageDataToGrayscale(imageData);

    const histogram = getHistogram(imageData);
    const n = imageData.width * imageData.height;
    const histogramEqualizationMap = makeHistogramEqualizationMap(histogram, n);

    const normalizedImageData = grayscaleMap(grayscale, (v) => histogramEqualizationMap[v]);

    return (
        <div>
            <h3 className="text-2xl my-4">Oriģinālais attēls</h3>
            <ImageDataDisplay imageData={imageData} />

            <h3 className="text-2xl my-4">Melnbaltais attēls</h3>
            <ImageDataDisplay imageData={grayscale} />
            <HistogramDisplay imageData={grayscale} />

            <h3 className="text-2xl my-4">Normalizētais attēls</h3>
            <ImageDataDisplay imageData={normalizedImageData} />
            <HistogramDisplay imageData={normalizedImageData} />
        </div>
    );
}

const ReadyComponent = function ({
    imageDataMap,
}: {
    imageDataMap: {[key in keyof ImageUrlMap]: ImageData},
}) {
    const { screenshot, photo } = imageDataMap;

    return (
        <div>
            <OneImageAnalysis imageData={screenshot} />
            <OneImageAnalysis imageData={photo} />
        </div>
    );
};

export default function () {
    const imageUrlMap: ImageUrlMap = {
        screenshot: sampleImg,
        photo: samplePhoto,
    };

    return (
        <AsyncAwareMultiImageDataDisplay
            imageUrlMap={imageUrlMap}
            PlaceholderComponent = {() => (<p>Lūdzu uzgaidiet</p>)}
            ReadyComponent={ReadyComponent}
        />
    );
};
