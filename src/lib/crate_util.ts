/**
 * Utilities for simplifying access to crate utilities.
 */
import initMainCrate, {
    ImageData as WasmImageData,
} from "main_crate?wasm";
export * from "main_crate?wasm";

const mainCrateModule = await initMainCrate();

export const imageDataToWasm = function ({ width, height, data }: ImageData): WasmImageData {
    const wasmImageData = WasmImageData.new(width, height);

    const pixelCount = 4 * width * height;

    const arr = new Uint8ClampedArray(
        mainCrateModule.memory.buffer,
        wasmImageData.data(),
        pixelCount,
    );

    // NOTE: Copy array into WASM memory
    for (let i = 0; i < pixelCount; i++) {
        arr[i] = data[i];
    }

    return wasmImageData;
};

export const wasmToImageData = function(self: WasmImageData): ImageData {
    const width = self.width();
    const height = self.height();

    const pixelCount = 4 * width * height;

    const arr = new Uint8ClampedArray(
        mainCrateModule.memory.buffer,
        self.data(),
        pixelCount,
    );

    const resArr = new Uint8ClampedArray(pixelCount);

    const res = new ImageData(resArr, width, height);

    // NOTE: Copying back
    for (let i = 0; i < pixelCount; i++) {
        res.data[i] = arr[i];
    }

    return res;
}
