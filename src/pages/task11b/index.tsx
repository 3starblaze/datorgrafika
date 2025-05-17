import sampleImg from "@/lib/sample_screenshot.png";

import { AsyncAwareImageDataDisplay, ImageDataDisplay, rgbToGray } from "@/lib/image_util";

const grayscaleMap = function(imageData: ImageData): ImageData {
    const { width, height } = imageData;

    const res = new ImageData(
        new Uint8ClampedArray(imageData.data.length),
        width,
        height,
    );

    for (let i = 0; i < width * height * 4; i += 4) {

        const value = rgbToGray(
            imageData.data[i + 0],
            imageData.data[i + 1],
            imageData.data[i + 2],
        );
        res.data[i + 0] = value;
        res.data[i + 1] = value;
        res.data[i + 2] = value;
        res.data[i + 3] = 255; // NOTE: Full opacity
    }

    return res;
};

type Region = {
    id: number,
    /*
     * Indices of pixels that belong to the region
     */
    pixels: Set<number>,
    /*
     * Sum of the pixel values
     */
    sum: number,
};

type RegionsInfo = {
    /**
     * Array of all found regions.
     */
    regions: Map<number, Region>,
    /**
     * Mapping from pixel index to region id to which this pixel belongs to.
     */
    pixelToRegionMap: Map<number, number>,
    /**
     * Graph of `regions`, stored as adjacency list.
     *
     * Regions are identified by id.
     */
    regionAdjacencyList: Map<number, Set<number>>,
};

const throwingMapGet = function <K, V>(map: Map<K, V>, key: K): V {
    const maybeRes = map.get(key);
    if (maybeRes === undefined) {
        throw new Error(`Unexpected missing key "${key}" in map!`);
    }
    return maybeRes;
}

const findRegions = function (imageData: ImageData): RegionsInfo {
    const { width, height } = imageData;
    const totalPixels = width * height;

    if (totalPixels === 0) throw new Error("0 width/height for image not supported!");

    const getValue = function(i: number) {
        return imageData.data[4 * i];
    }

    const regionlessPixels = new Set(Array(width * height).keys());
    const regionAdjacencyList: Map<number, Set<number>> = new Map();
    const pixelToRegionMap: RegionsInfo["pixelToRegionMap"] = new Map();

    const regions: Map<number, Region> = new Map();
    let regionCounter = 0;

    const getNeighbors = function(index: number): number[] {
        const neighborDelta: [number, number][] = [
            [0, -1],
            [-1, 0],
            [1, 0],
            [0, 1],
        ];

        const indexX = index % width;
        const indexY = Math.floor(index / width);

        return neighborDelta.map((([dx, dy]) => {
            const newX = indexX + dx;
            const newY = indexY + dy;

            if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
                return newX + newY * width;
            } else {
                return null;
            }
        })).filter((x) => x !== null);
    };

    const isPixelBelongingToRegion = function(region: Region, pixel: number) {
        // NOTE: Every pixel is welcome in an empty region
        if (region.pixels.size === 0) return true;

        const avg = region.sum / region.pixels.size;
        // NOTE: 25 is around 10% of 255
        return Math.abs(getValue(pixel) - avg) <= 25;
    };

    while (regionlessPixels.size !== 0) {
        const pixelsToProcess = [regionlessPixels.values().next().value as number];

        const regionId = regionCounter;
        regionCounter++;
        const region: Region = {
            id: regionId,
            pixels: new Set([]),
            sum: 0,
        };

        regions.set(regionId, region);

        regionAdjacencyList.set(regionId, new Set());

        while (pixelsToProcess.length !== 0) {
            const currentIndex = pixelsToProcess.pop() as number;

            if (isPixelBelongingToRegion(region, currentIndex)) {
                region.pixels.add(currentIndex);
                region.sum += getValue(currentIndex);

                pixelToRegionMap.set(currentIndex, regionId);
                regionlessPixels.delete(currentIndex);

                getNeighbors(currentIndex)
                    .map((i) => {
                        const maybeVal = pixelToRegionMap.get(i);
                        return (
                            [i, (maybeVal === undefined) ? null : maybeVal]
                        ) as [number, number | null];
                    })
                    .forEach(([pixelIndex, neighborRegionId]) => {
                        if (neighborRegionId === null) {
                            pixelsToProcess.push(pixelIndex);
                        } else if (neighborRegionId !== regionId) {
                            // NOTE: This branch kicks in when a neighbor region is found and this
                            // is a good opportunity to update the adjacency list.
                            throwingMapGet(regionAdjacencyList, regionId).add(neighborRegionId);
                            throwingMapGet(regionAdjacencyList, neighborRegionId).add(regionId);
                        }
                    });
            }
        }
    }

    return {
        pixelToRegionMap,
        regionAdjacencyList,
        regions,
    };
};

// FIXME: Broken
/**
 * Create a new RegionsInfo object by merging oldRegion into destinationRegion.
 */
const mergeRegions = function (
    regionsInfo: RegionsInfo,
    destinationRegionId: number,
    oldRegionId: number,
): RegionsInfo {
    const destinationRegion = throwingMapGet(regionsInfo.regions, destinationRegionId);

    const oldRegion = throwingMapGet(regionsInfo.regions, oldRegionId);

    const newRegion: Region = {
        id: destinationRegionId,
        pixels: new Set([
            ...destinationRegion.pixels.values(),
            ...oldRegion.pixels.values(),
        ]),
        sum: destinationRegion.sum + oldRegion.sum,
    };

    const regions = new Map(regionsInfo.regions);
    regions.delete(oldRegionId);
    regions.set(destinationRegionId, newRegion);

    // NOTE: Update pixelToRegionMap references to the new region
    const pixelToRegionMap = new Map(regionsInfo.pixelToRegionMap);
    oldRegion.pixels.forEach((pixelIndex) => {
        pixelToRegionMap.set(pixelIndex, destinationRegionId);
    });

    const regionAdjacencyList: (typeof regionsInfo)["regionAdjacencyList"] = new Map();

    // NOTE: Performing a deep copy of regionAdjacencyList
    for (const [id, adjacencySet] of regionsInfo.regionAdjacencyList.entries()) {
        regionAdjacencyList.set(id, new Set(adjacencySet));
    }

    // NOTE: Merge oldRegion neighbors into destinationRegion neighbor set
    const mergedDestinationAdjacencySet = new Set([
        ...throwingMapGet(regionsInfo.regionAdjacencyList, destinationRegionId),
        ...throwingMapGet(regionsInfo.regionAdjacencyList, oldRegionId),
    ]);
    // NOTE: destinationId is inherited from oldRegion but having itself as a neigbor is a mistake
    // that causes problems in other steps so we have to delete it.
    mergedDestinationAdjacencySet.delete(destinationRegionId);
    regionAdjacencyList.set(destinationRegionId, mergedDestinationAdjacencySet);

    // NOTE: Delete old region because it is gone
    regionAdjacencyList.delete(oldRegionId);

    // NOTE: Since being a neighbor is a bidirectional attribute, we find the affected vertices
    // and replace oldRegionId with destinationRegionId. Old region neighbor list is a very
    // convenient way of getting all the affected vertices.
    throwingMapGet(regionsInfo.regionAdjacencyList, oldRegionId).forEach((neighbor) => {
        // NOTE: We skip the destination id because we have already handled it properly
        if (neighbor === newRegion.id) return;
        const adjacencySet = throwingMapGet(regionAdjacencyList, neighbor);
        adjacencySet.delete(oldRegionId);
        adjacencySet.add(destinationRegionId);
    });

    return {
        regions,
        pixelToRegionMap,
        regionAdjacencyList
    };
};

const colorGraphGreedily = function (
    adjacencyList: Map<number, Set<number>>
): {
    colorMapping: Map<number, number>,
    colorCount: number,
} {
    let colorCount = 0;
    const colorMapping = new Map();
    const vertices = adjacencyList.keys();

    for (let vertex of vertices) {
        // NOTE: We start with all possible colors and then we cross them out as we go through neighbors
        const colorCandidates = new Set<number>([...Array(colorCount).keys()]);

        for (let neighbor of throwingMapGet(adjacencyList, vertex).values()) {
            const maybeColor = colorMapping.get(neighbor);
            if (maybeColor !== undefined) colorCandidates.delete(maybeColor);
        }

        let newColor;

        if (colorCandidates.size === 0) {
            newColor = colorCount;
            colorCount++;
        } else {
            newColor = Math.min(...colorCandidates.values());
        }

        colorMapping.set(vertex, newColor);
    }

    return {
        colorMapping,
        colorCount,
    };
};


// FIXME: Broken
/**
 * Make a new regionsInfo by going through regions and merging similar regions.
 */
const performMergePass = function(
    regionsInfo: RegionsInfo
): RegionsInfo {
    // TODO: make the predicate as a function argument?
    const predicate = function (r0: Region, r1: Region) {
        if ((r0.pixels.size === 0) || (r1.pixels.size === 0)) return true;

        return Math.abs((r0.sum / r0.pixels.size) - (r1.sum / r1.pixels.size)) < 25;
    };

    const edgesToProcess = new Set<string>();
    const serializeEdge = (v0: number, v1: number) => {
        // NOTE: We are sorting vertices because [v0, v1] is the same edge as [v1, v0] and this
        // normalization will help us avoid double-counting the same edge.
        return `[${Math.min(v0, v1)},${Math.max(v0, v1)}]`
    };
    const deserializeEdge = (s: string): [number, number] => {
        const val = JSON.parse(s);
        if (
            Array.isArray(val)
            && val.length == 2
            && typeof val[0] === "number"
            && typeof val[1] === "number"
        )  {
            return [val[0], val[1]];
        }

        throw new Error("could not deserialize edge!");
    };


    for (const [vertex, neighbors] of regionsInfo.regionAdjacencyList) {
        for (const neighbor of neighbors) {
            edgesToProcess.add(serializeEdge(vertex, neighbor));
        }
    }

    let iterCounter = 0;

    while (edgesToProcess.size !== 0) {
        const serializedEdge = edgesToProcess.values().next().value;
        // NOTE: this should never happen because edgesToProcess.size !== 0
        if (serializedEdge === undefined) throw new Error("unexpected missing edge");

        edgesToProcess.delete(serializedEdge);
        const [v0, v1] = deserializeEdge(serializedEdge);

        const v0Region = throwingMapGet(regionsInfo.regions, v0);
        const v1Region = throwingMapGet(regionsInfo.regions, v1);

        // HACK: We somehow always end up with stale edges and we do this check to compensate
        if (!throwingMapGet(regionsInfo.regionAdjacencyList, v0).has(v1)) continue;

        // HACK: We should never end up with situation but we do
        if (v0 === v1) continue;

        if (predicate(v0Region, v1Region)) {
            const newRegionsInfo = mergeRegions(regionsInfo, v0, v1);

            // NOTE: invalidate all edges that contain v0
            for (const neighbor of throwingMapGet(regionsInfo.regionAdjacencyList, v0)) {
                edgesToProcess.delete(serializeEdge(v0, neighbor));
            }

            // NOTE: invalidate all edges that contain v1
            for (const neighbor of throwingMapGet(regionsInfo.regionAdjacencyList, v1)) {
                edgesToProcess.delete(serializeEdge(v1, neighbor));
            }

            // NOTE: Add all new edges that contain v0
            // NOTE: A natural question may arise, why were the old v0 edges deleted and the answer
            // is that perhaps we have gone through an edge which was not previously mergeable but is
            // now mergeable. Actually the v0 deletion step might not be needed since the only neighbor
            // that v0 is losing is v1 but it's "safer" to keep it as is.
            for (const neighbor of throwingMapGet(newRegionsInfo.regionAdjacencyList, v0)) {
                if (neighbor === v0 || neighbor === v1) continue;
                edgesToProcess.add(serializeEdge(v0, neighbor));
            }

            regionsInfo = newRegionsInfo;
        }
        iterCounter++;
    }

    // FIXME: Deep copy regionsInfo. If there is nothing to merge, regionsInfo will be shallowly
    // copied!
    return regionsInfo;
}

const colorInfoToImageData = function (
    imageData: ImageData,
    regionsInfo: RegionsInfo,
    colorInfo: ReturnType<typeof colorGraphGreedily>,
    colors: [number, number, number][],
): ImageData {
    if (colors.length < colorInfo.colorCount) {
        throw new Error("not enough colors to make an image!");
    }

    const res = new ImageData(
        new Uint8ClampedArray(imageData.data.length),
        imageData.width,
        imageData.height,
    );

    for (let i = 0; i < imageData.width * imageData.height; i += 1) {
        const regionId = throwingMapGet(regionsInfo.pixelToRegionMap, i);
        const rgb = colors[throwingMapGet(colorInfo.colorMapping, regionId)];

        res.data[4 * i + 0] = rgb[0];
        res.data[4 * i + 1] = rgb[1];
        res.data[4 * i + 2] = rgb[2];
        res.data[4 * i + 3] = 255; // NOTE: Full opacity
    }

    return res;
};


const rgbStringToTuple = function(rgbString: string): [number, number, number] {
    if (rgbString.length !== 7) {
        throw new Error(`rgbString has invalid size ${rgbString.length}, expected 7!`);
    }

    if (rgbString[0] !== "#") {
        throw new Error("rgbString does not start with '#'");
    }

    const r = parseInt(rgbString.slice(1, 3), 16);
    const g = parseInt(rgbString.slice(3, 5), 16);
    const b = parseInt(rgbString.slice(5, 7), 16);

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        throw new Error("could not parse numeric value of string!");
    }

    return [r, g, b];
};

const ReadyComponent = function ({
    imageData,
}: {
    imageData: ImageData,
}) {
    const grayscaleImageData = grayscaleMap(imageData);
    const regionsInfo = performMergePass(findRegions(grayscaleImageData));
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
            <h3 className="text-2xl my-4">Oriģinālais attēls</h3>
            <ImageDataDisplay imageData={imageData} />

            <h3 className="text-2xl my-4">Melnbaltais attēls</h3>
            <ImageDataDisplay imageData={grayscaleImageData} />

            <h3 className="text-2xl my-4">Attēls sadalīts reģionos</h3>
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

export default function () {
    return (
        <AsyncAwareImageDataDisplay
            imgUrl={sampleImg}
            PlaceholderComponent={() => (<p>Lūdzu uzgaidiet</p>)}
            ReadyComponent={ReadyComponent}
        />
    );
};
