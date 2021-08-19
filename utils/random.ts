export class Random {
    static randomArrayElement(items: any[]): any {
        return items[Math.floor(Math.random()*items.length)];
    }
    static randomNumber(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }
    static randomIntegerNumber(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}