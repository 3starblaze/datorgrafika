import {
    AsyncAwareImageDataDisplay,
    ImageDataDisplay,
    imageDataToGrayscale,
} from "@/lib/image_util";
import sampleImg from "@/lib/sample_screenshot.png";


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
    const n = imageData.width * imageData.height;

    const histogramLog = histogram.map((v) => Math.log(v + 1));
    const logN = Math.log(n + 1);

    return (
        <div>
            <h4>Histogramma</h4>
            <div className="flex bg-gray-100 h-16 w-100">
                {histogram.map((value, i) => (
                    <div
                        key={i}
                        className="bg-black w-full"
                        style={{
                            height: `${100 * (value / n)}%`,
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
                            height: `${100 * (value / logN)}%`,
                        }}>
                    </div>
                ))}
            </div>
        </div>
    );
}

const ReadyComponent = function ({
    imageData,
}: {
    imageData: ImageData,
}) {
    return (
        <div>
            <h3 className="text-2xl my-4">Oriģinālais attēls</h3>
            <ImageDataDisplay imageData={imageData} />

            <h3 className="text-2xl my-4">Melnbaltais attēls</h3>
            <ImageDataDisplay imageData={imageDataToGrayscale(imageData)} />

            <HistogramDisplay imageData={imageData} />
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
