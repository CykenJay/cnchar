declare type idiomArg = 'char' | 'stroke' | 'spell' | 'tone';

export declare interface Idiom {
    (text:string | number | Array<string|number>, ...idiomArgs: Array<idiomArg>):Array<string>;
}

declare const idiom: Idiom;

declare module 'cnchar' {
    interface CnCharStatic {
        idiom: Idiom;
    }
}

export default idiom;