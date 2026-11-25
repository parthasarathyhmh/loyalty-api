// pg driver for node is a mess due to js numbers not having
// high-enough precision, hence this stupidity is necessary
export function numeric(val: number): number {
  return Number.parseFloat(val as unknown as string);
}
