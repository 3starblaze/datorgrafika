import sampleImg from "@/lib/sample_screenshot.png";

import {
    AsyncAwareImageDataDisplay,
    ImageDataDisplay,
    imageDataToGrayscale,
} from "@/lib/image_util";
import {
    colorGraphGreedily,
    colorInfoToImageData,
    findRegions,
    performMergePass,
    RegionsInfo,
    regionsInfoSanityCheck,
    rgbStringToTuple,
} from "./util";
import { useEffect } from "react";

const RegionInfoDisplay = function({
    imageData,
    regionsInfo,
}: {
    imageData: ImageData,
    regionsInfo: RegionsInfo,
}) {
    const colorInfo = colorGraphGreedily(regionsInfo.regionAdjacencyList);

    // TODO: Gracefully handle lack of color values
    // While the colorCount shouldn't even reach double digits, exceptional case should be handled
    // even if the newly generated colors are not "optimal" for viewing.
    const colorStrings = [
        "#84cc16",
        "#ef4444",
        "#14b8a6",
        "#0ea5e9",
        "#a855f7",
        "#f43f5e",
    ];
    const colors: [number, number, number][] = colorStrings.map(rgbStringToTuple);

    return (
        <div>
            <ImageDataDisplay imageData={colorInfoToImageData(
                imageData,
                regionsInfo,
                colorInfo,
                colors
            )} />
            <div>Attēlu reģionu skaits {regionsInfo.regions.size}</div>
            <div>Krāsu skaits: {colorInfo.colorCount}</div>
            <div className="flex gap-2">
                {colorStrings.slice(0, colorInfo.colorCount).map((rgbString) => (
                    <div
                        className="h-8 w-8"
                        style={{
                            backgroundColor: rgbString,
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

const ReadyComponent = function ({
    imageData,
}: {
    imageData: ImageData,
}) {
    const grayscaleImageData = imageDataToGrayscale(imageData);
    const growOnlyRegionsInfo = findRegions(grayscaleImageData);
    const growOnlyRegionsInfoWithMergePass = performMergePass(growOnlyRegionsInfo);

    return (
        <div>
            <h3 className="text-2xl my-4">Oriģinālais attēls</h3>
            <ImageDataDisplay imageData={imageData} />

            <h3 className="text-2xl my-4">Melnbaltais attēls</h3>
            <ImageDataDisplay imageData={grayscaleImageData} />

            <h3 className="text-2xl my-4">Attēls sadalīts reģionos (v1)</h3>
            <RegionInfoDisplay
                imageData={grayscaleImageData}
                regionsInfo={growOnlyRegionsInfo}
            />

            <h3 className="text-2xl my-4">Attēls sadalīts reģionos (v2)</h3>
            <RegionInfoDisplay
                imageData={grayscaleImageData}
                regionsInfo={growOnlyRegionsInfoWithMergePass}
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
