import { describe, expect, test } from '@jest/globals';

import {
    mergeRegions,
    Region,
    RegionsInfo,
} from "./util";

describe('sum module', () => {
    test("merge example #001", () => {
        const regionA: Region = {
            id: 10,
            pixels: new Set([0, 1]),
            sum: 33,
        };

        const regionB: Region = {
            id: 20,
            pixels: new Set([2, 3]),
            sum: 66,
        };

        const oldRegionsInfo: RegionsInfo = {
            pixelToRegionMap: new Map([
                [0, regionA.id],
                [1, regionA.id],
                [2, regionB.id],
                [3, regionB.id],
            ]),
            regionAdjacencyList: new Map([
                [regionA.id, new Set([regionB.id])],
                [regionB.id, new Set([regionA.id])],
            ]),
            regions: new Map([
                [regionA.id, regionA],
                [regionB.id, regionB],
            ]),
        };

        const newRegionInfo = mergeRegions(oldRegionsInfo, regionA.id, regionB.id);

        const expectedNewRegion = {
            id: 10,
            pixels: new Set([0, 1, 2, 3]),
            sum: 99,
        };

        expect([...newRegionInfo.regions.entries()]).toEqual([[regionA.id, expectedNewRegion]]);
        expect([...newRegionInfo.pixelToRegionMap.entries()]).toEqual([
            [0, regionA.id],
            [1, regionA.id],
            [2, regionA.id],
            [3, regionA.id],
        ]);
        expect([...newRegionInfo.regionAdjacencyList.entries()]).toEqual([
            [regionA.id, new Set([])]
        ]);
    });
});
