import {
    AsyncAwareMultiImageDataDisplay,
    ImageDataDisplay,
    imageDataToGrayscale,
} from "@/lib/image_util";
import sampleImg from "@/lib/sample_screenshot.png";
import samplePhoto from "@/lib/sample_photo.jpg"


const getHistogram = function(imageData: ImageData) {
    const res: number[] = [...Array(255).keys()].map((_) => 0);

    for (let i = 0; i < imageData.width * imageData.height; i++) {
        // NOTE: We assume that we have grayscale data, so it doesn't matter which channel we take
        // the value
        const value = imageData.data[4 * i];
        res[value]++;
    }

    return res;
};

const HistogramDisplay = function({
    imageData,
}: {
    imageData: ImageData,
}) {
    const histogram = getHistogram(imageData);
    const histMax = Math.max(...histogram);

    const histogramLog = histogram.map((v) => Math.log(v + 1));
    const logNMax = Math.log(histMax)

    return (
        <div>
            <h4>Histogramma</h4>
            <div className="flex bg-gray-100 h-16 w-100">
                {histogram.map((value, i) => (
                    <div
                        key={i}
                        className="bg-black w-full"
                        style={{
                            height: `${100 * (value / histMax)}%`,
                        }}>
                    </div>
                ))}
            </div>
            <h4>Histogramma (f(x) = ln(x+1))</h4>
            <div className="flex bg-gray-100 h-16 w-100">
                {histogramLog.map((value, i) => (
                    <div
                        key={i}
                        className="bg-black w-full"
                        style={{
                            height: `${100 * (value / logNMax)}%`,
                        }}>
                    </div>
                ))}
            </div>
        </div>
    );
}

type ImageUrlMap = {
    screenshot: string,
    photo: string,
};

const ReadyComponent = function ({
    imageDataMap,
}: {
    imageDataMap: {[key in keyof ImageUrlMap]: ImageData},
}) {
    const { screenshot, photo } = imageDataMap;

    return (
        <div>
            <h3 className="text-2xl my-4">Oriģinālais attēls</h3>
            <ImageDataDisplay imageData={screenshot} />

            <h3 className="text-2xl my-4">Melnbaltais attēls</h3>
            <ImageDataDisplay imageData={imageDataToGrayscale(screenshot)} />

            <HistogramDisplay imageData={screenshot} />

            <h3 className="text-2xl my-4">Oriģinālais attēls</h3>
            <ImageDataDisplay imageData={photo} />

            <h3 className="text-2xl my-4">Melnbaltais attēls</h3>
            <ImageDataDisplay imageData={imageDataToGrayscale(photo)} />

            <HistogramDisplay imageData={photo} />
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
