/* eslint-disable @typescript-eslint/no-unused-vars */

export type Prettify<T> = {
  [K in keyof T]: T[K]
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {}
export type And<T extends readonly boolean[]> = T extends { length: 0 }
  ? true
  : T extends [infer TFirst, ...infer TRest]
  ? TFirst extends true
    ? TRest extends boolean[]
      ? And<TRest>
      : false
    : false
  : false
export type IsNever<T> = [T] extends [never] ? true : false
{
  //IsNever tests
  type tests = [
    Expect<Equals<IsNever<never>, true>>,
    Expect<Equals<IsNever<number>, false>>,
    Expect<Equals<IsNever<string>, false>>,
    Expect<Equals<IsNever<4>, false>>,
    Expect<Equals<IsNever<"Hello">, false>>,
    Expect<Equals<IsNever<unknown>, false>>,
    Expect<Equals<IsNever<any>, false>>
  ]
}
export type Is<TSubject, TReference> = And<[IsNever<TSubject>, IsNever<TReference>]> extends true
  ? true
  : IsNever<TSubject> extends true
  ? false
  : IsNever<TReference> extends true
  ? IsNever<TSubject>
  : TSubject extends TReference
  ? true
  : false
{
  //Is tests
  type tests = [
    Expect<Equals<Is<never, never>, true>>,
    Expect<Equals<Is<never, number>, false>>,
    Expect<Equals<Is<5, number>, true>>,
    Expect<Equals<Is<"Hello", string>, true>>,
    Expect<Equals<Is<unknown, boolean>, false>>,
    // anything is unknown so this should be okay
    Expect<Equals<Is<boolean, unknown>, true>>
  ]
}
export type UnknownIfNever<T, TRes = T> = IsNever<T> extends true ? unknown : TRes
