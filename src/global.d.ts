declare type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
declare type Expect<T extends true> = T
declare type Extends<T1, T2> = T2 extends T1 ? true : false
