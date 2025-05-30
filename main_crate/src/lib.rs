use image::{imageops::resize, ImageBuffer, Rgba};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, Rust!");
}

// NOTE: Helper struct to make pixels easier to handle
#[repr(C, packed)]
#[derive(Debug)]
pub struct Pixel {
    r: u8,
    g: u8,
    b: u8,
    a: u8
}

#[wasm_bindgen]
pub struct ImageData {
    data: Vec<u8>,
    width: usize,
    height: usize,
}

#[wasm_bindgen]
impl ImageData {
    pub fn new(width: usize, height: usize) -> ImageData {
        let size = size_of::<Pixel>() * width*height;
        let mut vec = Vec::with_capacity(size);
        // NOTE: Length is set explicitly because we are altering memory directly from JS and when
        // buffer is filled, length is not updated. The length of this vector won't be changed anyways.
        unsafe {
            vec.set_len(size);
        }
        ImageData {
            data: vec,
            width,
            height,
        }
    }

    pub fn width(&self) -> usize {
        self.width
    }

    pub fn height(&self) -> usize {
        self.height
    }

    pub fn data(&mut self) -> *mut u8 {
        self.data.as_mut_ptr().cast()
    }
}

#[wasm_bindgen]
pub fn apply_grayscale(image_data: &mut ImageData) -> () {
    for pixel in image_data.data.chunks_exact_mut(4) {
        let [r, g, b, _] = pixel else { unreachable!() };

        let strength = (
            0.2126 * (*r as f64) + 0.7152 * (*g as f64) + 0.0722 * (*b as f64)
        ) as u8;
        *r = strength;
        *g = strength;
        *b = strength;
    }
}


#[wasm_bindgen]
pub fn apply_lanczos3(image_data: &ImageData, new_width: u32, new_height: u32) -> ImageData {
    let width = image_data.width as u32;
    let height = image_data.height as u32;
    let data = image_data.data.as_slice();
    let img: ImageBuffer<Rgba<u8>, &[u8]> = ImageBuffer::from_raw(width, height, data).unwrap();

    let res = resize(
        &img,
        new_width,
        new_height,
        image::imageops::FilterType::Lanczos3
    );

    ImageData {
        data: res.into_raw(),
        width: new_width as usize,
        height: new_height as usize,
    }
}

#[wasm_bindgen]
pub fn test_lanczos3(image_data: &ImageData, ratio: f32) -> ImageData {
    let width = image_data.width as u32;
    let height = image_data.height as u32;

    let upscale_width = (width as f32 * ratio).floor() as u32;
    let upscale_height = (height as f32 * ratio).floor() as u32;

    let upscaled = apply_lanczos3(image_data, upscale_width, upscale_height);
    let downscaled = apply_lanczos3(&upscaled, width, height);

    return downscaled;
}
