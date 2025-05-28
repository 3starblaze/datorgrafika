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
    data: Vec<Pixel>,
    width: usize,
    height: usize,
}

#[wasm_bindgen]
impl ImageData {
    pub fn new(width: usize, height: usize) -> ImageData {
        let size = width*height;
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
    for pixel in image_data.data.iter_mut() {
        let strength = (
            0.2126 * (pixel.r as f64) + 0.7152 * (pixel.g as f64) + 0.0722 * (pixel.b as f64)
        ) as u8;
        pixel.r = strength;
        pixel.g = strength;
        pixel.b = strength;
    }
}
