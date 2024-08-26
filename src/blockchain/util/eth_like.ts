export function fromHexadecimalToDecimal(hex: string): number {
    const asInt = parseInt(hex, 16);
    return asInt / Math.pow(10, 18);
}