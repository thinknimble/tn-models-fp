export type Prettify<T> = {
  [K in keyof T]: T[K]
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {}
export type And<TLeft, TRight> = TLeft extends true ? (TRight extends true ? true : false) : false
export type IsNever<T> = [T] extends [never] ? true : false
export type Is<TSubject, TReference> = IsNever<TReference> extends true
  ? IsNever<TSubject>
  : TSubject extends TReference
  ? true
  : false
export type UnknownIfNever<T, TRes = T> = IsNever<T> extends true ? unknown : TRes
