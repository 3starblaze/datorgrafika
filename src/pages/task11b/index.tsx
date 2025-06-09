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
import { H2, H3, P } from "@/components/typography";
import { SourceCodeSection } from "@/components/source-code";
import thisString from ".?raw";
import utilString from "./util?raw";

const RegionInfoDisplay = function ({
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
            <ImageDataDisplay
                allowResizing={true}
                imageData={colorInfoToImageData(
                    imageData,
                    regionsInfo,
                    colorInfo,
                    colors
                )}
            />
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

const mergeUntilNoChange = function(regionsInfo: RegionsInfo) {
    const regionCountHistory: number[] = [];

    let currentRegionsInfo = performMergePass(regionsInfo);

    regionCountHistory.push(currentRegionsInfo.regions.size);

    while (true) {
        currentRegionsInfo = performMergePass(currentRegionsInfo);

        const currentSize = currentRegionsInfo.regions.size;
        if (currentSize === regionCountHistory[regionCountHistory.length - 1]) break;
        regionCountHistory.push(currentSize);
    }

    return {
        regionCountHistory,
        regionsInfo: currentRegionsInfo,
    };
};

const ReadyComponent = function ({
    imageData,
}: {
    imageData: ImageData,
}) {
    const grayscaleImageData = imageDataToGrayscale(imageData);
    const growOnlyRegionsInfo = findRegions(grayscaleImageData);

    const {
        regionCountHistory,
        regionsInfo: fullyMergedRegionsInfo,
    } = mergeUntilNoChange(growOnlyRegionsInfo);

    return (
        <>
            <H3>Oriģinālais attēls</H3>
            <ImageDataDisplay
                allowResizing={true}
                imageData={imageData}
            />

            <H3>Melnbaltais attēls</H3>
            <ImageDataDisplay
                allowResizing={true}
                imageData={grayscaleImageData}
            />

            <H3>Attēls sadalīts reģionos izmantojot pikseļu audzēšanu</H3>
            <RegionInfoDisplay
                imageData={grayscaleImageData}
                regionsInfo={growOnlyRegionsInfo}
            />

            <H3>Attēls sadalīts reģionos ar pludināšanu</H3>
            <P className="text-gray-600">
                Attēla reģioni tikai sapludināti {regionCountHistory.length} reizes un reģionu
                skaits attiecīgi bija {JSON.stringify(regionCountHistory)}
            </P>
            <RegionInfoDisplay
                imageData={grayscaleImageData}
                regionsInfo={fullyMergedRegionsInfo}
            />
        </>
    );
};

export default function () {
    return (
        <div>
            <H2>Uzdevums (11a)</H2>

            <SourceCodeSection
                sources={[
                    { title: "./index", contentString: thisString },
                    { title: "./util", contentString: utilString },
                ]}
            />

            <H3>Apraksts</H3>

            <P>
                Reģiona atrašana no sākuma tika veikta ar pikseļu audzēšanu, kur pikseļa
                pievienošana reģionam tika noteikta ar predikātu. Lai mazinātu sašķeltību, tika
                veikta sapludināšana pār audzētajiem pikseļiem ar to pašu predikātu. Reģioni tika
                sadalīti "novados" un pēc tam katrs novads palika par vienu jaunu reģionu.
                Pludināšana tiek atkārtota tiktāl līdz reģionu skaits pirms un pēc pludināšanas soļa
                ir nemainīgs.
            </P>

            <P>
                Reģiona informācijas uzturēšana tika realizēta ar grafu ar kaimiņu sarakstiem, kā
                arī tika uzturēts kartējums no pikseļa uz reģionu, lai ātri varētu iegūt reģionu,
                kuram pieder dotais pikselis.
            </P>

            <P>
                Lai demonstrētu reģionus, tika pielietots mantkārīgais (greedy) krāsošanas
                algoritms, lai katram reģionam nevajadzētu izmantot savu krāsu, kas varētu
                padarīt reģionu atšķiršanu problemātisku. Kad reģioniem ir piešķirtas krāsas,
                tiek izveidots jauns attēla buferis, kas ir attiecīgi izkrāsots.
            </P>

            <AsyncAwareImageDataDisplay
                imgUrl={sampleImg}
                PlaceholderComponent={() => (<p className="text-gray-500">Lūdzu uzgaidiet</p>)}
                ReadyComponent={ReadyComponent}
            />
        </div>
    );
};
