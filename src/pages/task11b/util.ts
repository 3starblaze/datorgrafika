
// HACK: It exists in "@/lib/image_util" but that's a tsx file which is a problem when this file needs to be tested in Jest
const rgbToGray = function (r: number, g: number, b: number) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export type Region = {
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

export type RegionsInfo = {
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

export const throwingMapGet = function <K, V>(map: Map<K, V>, key: K): V {
    const maybeRes = map.get(key);
    if (maybeRes === undefined) {
        throw new Error(`Unexpected missing key "${key}" in map!`);
    }
    return maybeRes;
}

export const findRegions = function (imageData: ImageData): RegionsInfo {
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

/**
 * Create a new RegionsInfo object by merging oldRegion into destinationRegion.
 */
export const mergeRegions = function (
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

    // NOTE: reference to itself is useless
    mergedDestinationAdjacencySet.delete(destinationRegionId);
    // NOTE oldRegion is gone
    mergedDestinationAdjacencySet.delete(oldRegionId);

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

export const grayscaleMap = function(imageData: ImageData): ImageData {
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

export const colorGraphGreedily = function (
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

// NOTE: For some reason iterators don't have mapping functionality, so we are making our own
export const iterMap = function<T, U>(
    iterable: Iterable<T>,
    callbackFn: (val: T) => U,
): U[] {
    const res: U[] = [];

    for (const val of iterable) {
        res.push(callbackFn(val));
    }

    return res;
}

// NOTE: Similar reason for existence as `iterMap`
export const iterEach = function<T>(
    iterable: Iterable<T>,
    callbackFn: (val: T) => void,
): void {
    for (const val of iterable) {
        callbackFn(val);
    }
}

export const mutableMergeRegionsMultiple = function (
    regionsInfo: RegionsInfo,
    destinationRegionId: number,
    oldRegionIds: Set<number>,
) {
    const destinationRegion = throwingMapGet(regionsInfo.regions, destinationRegionId);
    const oldRegions = iterMap(oldRegionIds, (id) => throwingMapGet(regionsInfo.regions, id));


    const newRegion: Region = {
        id: destinationRegionId,
        pixels: new Set([
            ...destinationRegion.pixels.values(),
            ...oldRegions.map((region) => [...region.pixels.values()]).flat()
        ]),
        sum: destinationRegion.sum + oldRegions.reduce((acc, reg) => acc + reg.sum, 0),
    };

    // NOTE: Correct pixelToRegionMap
    oldRegions.forEach((region) => {
        region.pixels.forEach((pixelIndex) => {
            regionsInfo.pixelToRegionMap.set(pixelIndex, destinationRegionId);
        });
    });

    const destinationRegionAdjacenyList = throwingMapGet(
        regionsInfo.regionAdjacencyList,
        destinationRegionId
    );

    // NOTE: Remove stale regions
    oldRegionIds.forEach((id) => {
        regionsInfo.regions.delete(id);
        regionsInfo.regionAdjacencyList.delete(id);
        destinationRegionAdjacenyList.delete(id);
    });

    // NOTE: Destination region inherits itself as a neighbor, that should be deleted
    destinationRegionAdjacenyList.delete(destinationRegionId);

    regionsInfo.regions.set(destinationRegionId, newRegion);
}


/**
 * Make a new regionsInfo by going through regions and merging similar regions.
 */
export const performMergePass = function(
    oldRegionsInfo: RegionsInfo,
): RegionsInfo {
    // TODO: make the predicate as a function argument?
    const predicate = function (r0: Region, r1: Region) {
        if ((r0.pixels.size === 0) || (r1.pixels.size === 0)) return true;

        return Math.abs((r0.sum / r0.pixels.size) - (r1.sum / r1.pixels.size)) < 25;
    };

    const regionsInfo = structuredClone(oldRegionsInfo);

    // NOTE: key region -- old region, value region -- the new region
    // NOTE: In the beginning nothing is merged and thus every key maps to itself but as the time
    // goes on, the regions get merged. It's important to keep this info because, for example, if
    // b is merged into a and c wants to merge into b, it actually wants to merge into a because
    // b will not exist in next pass.
    const currentRegionToActualRegion = new Map<number, number>(
        [...regionsInfo.regions.keys()].map((id) => [id, id])
    );
    // NOTE: All regions in value set will be merged into key region
    const mergeMap = new Map<number, Set<number>>();

    for (const [v0, neighbors] of regionsInfo.regionAdjacencyList) {
        for (const v1 of neighbors) {
            // NOTE: Processing edges in ascending order to avoid double counting
            if (v0 > v1) continue;

            const v0Region = throwingMapGet(regionsInfo.regions, v0);
            const v1Region = throwingMapGet(regionsInfo.regions, v1);

            if (predicate(v0Region, v1Region)) {
                const resolvedV0 = throwingMapGet(currentRegionToActualRegion, v0);
                const resolvedV1 = throwingMapGet(currentRegionToActualRegion, v1);

                const realV0 = Math.min(resolvedV0, resolvedV1);
                const realV1 = Math.max(resolvedV0, resolvedV1);

                let maybeMergeSet = mergeMap.get(realV0);

                if (maybeMergeSet === undefined) {
                    maybeMergeSet = new Set();
                    mergeMap.set(realV0, maybeMergeSet);
                }

                maybeMergeSet.add(realV1);
                currentRegionToActualRegion.set(realV1, realV0);

                // NOTE: If v1 has a merge set, we have to merge the v1 set
                const maybeV1MergeSet = mergeMap.get(realV1);
                if (maybeV1MergeSet !== undefined) {
                    for (const v of maybeMergeSet) {
                        // NOTE: Put into merge set
                        maybeMergeSet.add(v);
                        // NOTE: Fix currentRegionToActualRegion mapping
                        currentRegionToActualRegion.set(v, realV0);
                    }
                    // NOTE: The old set has been merged and is no longer needed
                    mergeMap.delete(realV1);
                }
            }
        }
    }

    iterEach(mergeMap.entries(), ([destination, sources]) => {
        mutableMergeRegionsMultiple(regionsInfo, destination, sources);
    });

    return regionsInfo;
};

export const colorInfoToImageData = function (
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


export const rgbStringToTuple = function(rgbString: string): [number, number, number] {
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


/**
 * Check regionsInfo integrity by returning a list of human-readable error strings.
 */
export const regionsInfoSanityCheck = function(
    regionsInfo: RegionsInfo,
): string[] {
    const errors: string[] = [];
    const availableIds = new Set([...regionsInfo.regions.keys()]);

    for (const [k, v] of regionsInfo.regions) {
        if (v.id !== k) errors.push(`id mismatch -- this.regions.get(${k}).id === ${v}`);
    }

    [...regionsInfo.pixelToRegionMap.entries()].forEach(([k, v]) => {
        if (!availableIds.has(v)) errors.push(
            `dangling id at this.pixelToRegionMap.get(${k}) = ${v}`
        );
    });

    for (const [k, v] of regionsInfo.regionAdjacencyList) {
        if (!availableIds.has(k)) {
            errors.push(`dangling adjacency list this.regionAdjacencyList.get(${k})`);
        } else {
            for (const id of v) {
                if (!availableIds.has(id)) {
                    errors.push(`dangling id at this.regionAdjacencyList.get(${k}).has(${id})`);
                }
            }
        }
    }

    return errors;
};
