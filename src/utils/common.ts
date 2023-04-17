export type IsNever<T> = [T] extends [never] ? true : false
export type UnknownIfNever<T, TRes = T> = IsNever<T> extends true ? unknown : TRes
