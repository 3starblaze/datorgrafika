import { JSX, useEffect, useRef, useState } from "react";

export const ImageDataDisplay = function ({
    imageData,
    allowResizing = false,
    ...props
}: {
    imageData: ImageData,
    allowResizing?: boolean,
} & JSX.IntrinsicElements["canvas"]) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        canvas.width = imageData.width;
        canvas.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
    }, [canvasRef, imageData]);

    return (
        <canvas
            className={allowResizing ? "max-w-full" : ""}
            ref={canvasRef}
            {...props}
        />
    );
};

// NOTE: % gives remainder which is negative
export const mod = function(n: number, m: number) {
    return ((n % m) + m) % m;
};

export const imageToImageData = async function (imageSource: string): Promise<ImageData> {
    const image = new Image();
    const loadPromise = new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve());
    });

    image.src = imageSource;
    await loadPromise;
    const context = Object.assign(document.createElement('canvas'), {
        width: image.width,
        height: image.height
    }).getContext('2d');
    if (!context) throw new Error("couldn't get context!");
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, image.width, image.height);
};

/**
 * Show placeholder while ImageData is being loaded and swap it to ReadyComponent.
 */
export const AsyncAwareImageDataDisplay = function({
    imgUrl,
    PlaceholderComponent,
    ReadyComponent,
}: {
    PlaceholderComponent: React.FC,
    imgUrl: string,
    ReadyComponent: React.FC<{ imageData: ImageData }>,
}) {
    // NOTE: We have to jump through some hoops because imageData retrieval is async and component
    // logic would quickly become messy when every derived image checks for source imageData
    // existence.
    const [imageData, setImageData] = useState<ImageData | null>(null);

    useEffect(() => {
        (async () => {
            setImageData(await imageToImageData(imgUrl));
        })()
    }, []);


    return (imageData === null) ? (
        <PlaceholderComponent />
    ) : (
        <ReadyComponent imageData={imageData} />
    );
}


/**
 * Like `AsyncAwareImageDataDisplay` but for awaiting multiple images.
 */
export const AsyncAwareMultiImageDataDisplay = function<K extends string>({
    imageUrlMap,
    PlaceholderComponent,
    ReadyComponent
}: {
    imageUrlMap: { [key in K]: string },
    PlaceholderComponent: React.FC,
    ReadyComponent: React.FC<{ imageDataMap: { [key in K]: ImageData } }>,
}) {
    const [imageDataMap, setImageDataMap] = useState<{ [key in K]: ImageData } | null>(null);

    useEffect(() => {
        (async () => {
            const entries = Object.entries(imageUrlMap) as [K, string][];

            const imageDatas = await Promise.all(entries.map(([_, url]) => imageToImageData(url)));

            let obj = {} as { [key in K]: ImageData };

            entries.forEach(([k], i) => obj[k] = imageDatas[i]);

            setImageDataMap(obj);
        })()
    }, []);

    return (imageDataMap === null) ? (
        <PlaceholderComponent />
    ) : (
        <ReadyComponent imageDataMap={imageDataMap} />
    );
};

export const rgbToGray = function (r: number, g: number, b: number) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const imageDataToGrayscale = function(imageData: ImageData) {
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
