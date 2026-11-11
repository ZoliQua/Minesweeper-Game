/** A fresh 32-bit board seed. Tests pin it by stubbing `Math.random`. */
export const randomSeed = (): number => Math.floor(Math.random() * 0x1_0000_0000) >>> 0;
