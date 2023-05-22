export function defineProperty<T extends object, TKey extends string, TValue>(
  obj: T,
  key: TKey,
  value: TValue
): asserts obj is T & { [K in TKey]: TValue } {
  Object.defineProperty(obj, key, {
    value,
  })
}
