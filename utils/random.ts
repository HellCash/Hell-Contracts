export class Random {
    static randomArrayElement(items: any[]): any {
        return items[Math.floor(Math.random()*items.length)];
    }
    static randomNumber(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }
}