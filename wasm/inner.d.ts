/* tslint:disable */
/* eslint-disable */
/**
*/
export function debug_mode(): void;
/**
*/
export function run(): void;
/**
* @param {string} code
*/
export function execute_code(code: string): void;
/**
* @param {string} code
* @returns {string}
*/
export function get_code_str(code: string): string;
/**
*/
export class M43Debugger {
  free(): void;
/**
* @param {string} code
* @param {Uint32Array} break_points
* @returns {M43Debugger}
*/
  static new(code: string, break_points: Uint32Array): M43Debugger;
/**
*/
  step(): void;
/**
*/
  run(): void;
/**
* @returns {M43State}
*/
  get_state(): M43State;
}
/**
*/
export class M43State {
  free(): void;
/**
* @returns {number}
*/
  get_storage(): number;
/**
* @returns {number}
*/
  get_coords_x(): number;
/**
* @returns {number}
*/
  get_coords_y(): number;
/**
* @returns {number}
*/
  get_storage_size(): number;
/**
*/
  dir: string;
/**
*/
  pos: number;
/**
*/
  val: BigInt;
}
