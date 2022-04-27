import * as wasm from "wasm-app";
import { memory } from "wasm-app/inner_bg";

window.wasm = wasm;
window.wasm_memory = memory;
wasm.debug_mode();
