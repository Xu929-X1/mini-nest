import "reflect-metadata";
export function Injectable() {
    return function (_target: any) {
        //just a marker for typescript to emit design:paramtypes metadata
    };
}