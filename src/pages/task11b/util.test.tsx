import { describe, expect, test } from '@jest/globals';

import {
    mergeRegions,
    mutableMergeRegionsMultiple,
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

    test("mutableMergeRegionsMultiple example #001", () => {
        // NOTE regions A-B-C

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

        const regionC: Region = {
            id: 30,
            pixels: new Set([4, 5]),
            sum: 99,
        };

        const oldRegionsInfo: RegionsInfo = {
            pixelToRegionMap: new Map([
                [0, regionA.id],
                [1, regionA.id],
                [2, regionB.id],
                [3, regionB.id],
                [4, regionC.id],
                [5, regionC.id],
            ]),
            regionAdjacencyList: new Map([
                [regionA.id, new Set([regionB.id])],
                [regionB.id, new Set([regionA.id, regionC.id])],
                [regionC.id, new Set([regionB.id])],
            ]),
            regions: new Map([
                [regionA.id, regionA],
                [regionB.id, regionB],
                [regionC.id, regionC],
            ]),
        };

        mutableMergeRegionsMultiple(oldRegionsInfo, regionA.id, new Set([regionB.id, regionC.id]));

        expect([...oldRegionsInfo.regions.entries()]).toEqual([[regionA.id, {
            id: 10,
            pixels: new Set([0, 1, 2, 3, 4, 5]),
            sum: 198,
        }]]);


        expect(oldRegionsInfo.pixelToRegionMap).toEqual(
            new Map([...(new Array(6).keys())].map((i) => [i, regionA.id]))
        );

        expect([...oldRegionsInfo.regionAdjacencyList.entries()])
            .toEqual([[regionA.id, new Set()]]);
    });

    test("mutableMergeRegionsMultiple example #002", () => {
        // NOTE Similar to example #001 but regions are linked A-C-B

        const regionA: Region = {
            id: 10,
            pixels: new Set([0, 1]),
            sum: 33,
        };

        const regionC: Region = {
            id: 20,
            pixels: new Set([2, 3]),
            sum: 66,
        };

        const regionB: Region = {
            id: 30,
            pixels: new Set([4, 5]),
            sum: 99,
        };

        const oldRegionsInfo: RegionsInfo = {
            pixelToRegionMap: new Map([
                ...[...regionA.pixels.values()].map((i) => [i, regionA.id] as const),
                ...[...regionB.pixels.values()].map((i) => [i, regionB.id] as const),
                ...[...regionC.pixels.values()].map((i) => [i, regionC.id] as const),
            ]),
            regionAdjacencyList: new Map([
                [regionA.id, new Set([regionB.id])],
                [regionB.id, new Set([regionC.id])],
                [regionC.id, new Set([regionA.id, regionB.id])],
            ]),
            regions: new Map([
                [regionA.id, regionA],
                [regionB.id, regionB],
                [regionC.id, regionC],
            ]),
        };

        mutableMergeRegionsMultiple(oldRegionsInfo, regionA.id, new Set([regionB.id, regionC.id]));

        expect([...oldRegionsInfo.regions.entries()]).toEqual([[regionA.id, {
            id: 10,
            pixels: new Set([0, 1, 2, 3, 4, 5]),
            sum: 198,
        }]]);


        expect(oldRegionsInfo.pixelToRegionMap).toEqual(
            new Map([...(new Array(6).keys())].map((i) => [i, regionA.id]))
        );

        expect([...oldRegionsInfo.regionAdjacencyList.entries()])
            .toEqual([[regionA.id, new Set()]]);
    });
});
