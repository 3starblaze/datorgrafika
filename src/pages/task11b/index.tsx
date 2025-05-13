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
    /*
     * Indices of pixels that belong to the region
     */
    pixels: Set<number>,
    /*
     * Sum of the pixel values
     */
    sum: number,
};

const findRegions = function (imageData: ImageData): Region[] {
    const { width, height } = imageData;
    const totalPixels = width * height;

    if (totalPixels === 0) throw new Error("0 width/height for image not supported!");

    const getValue = function(i: number) {
        return imageData.data[4 * i];
    }

    const regionlessPixels = new Set(Array(width * height).keys());

    const regions: Region[] = [];

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

        const region: Region = {
            pixels: new Set([]),
            sum: 0,
        };
        regions.push(region);

        while (pixelsToProcess.length !== 0) {
            const currentIndex = pixelsToProcess.pop() as number;


            if (isPixelBelongingToRegion(region, currentIndex)) {
                region.pixels.add(currentIndex);
                region.sum += getValue(currentIndex);

                regionlessPixels.delete(currentIndex);

                getNeighbors(currentIndex)
                    .filter((i) => regionlessPixels.has(i))
                    .forEach((i) => pixelsToProcess.push(i))
            }
        }
    }

    return regions;
};

const ReadyComponent = function ({
    imageData,
}: {
    imageData: ImageData,
}) {
    const grayscaleImageData = grayscaleMap(imageData);
    const regions = findRegions(grayscaleImageData);

    return (
        <div>
            <h3 className="text-2xl my-4">Oriģinālais attēls</h3>
            <ImageDataDisplay imageData={imageData} />

            <h3 className="text-2xl my-4">Melnbaltais attēls</h3>
            <ImageDataDisplay imageData={grayscaleImageData} />

            <div>Region data:</div>
            <div>Region count: {regions.length}</div>
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
