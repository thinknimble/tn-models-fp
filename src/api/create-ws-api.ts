import { z } from "zod"
import {
  GetInferredFromRaw,
  GetInferredFromRawWithStripReadonly,
  objectToCamelCaseArr,
  objectToSnakeCaseArr,
  parseResponse,
} from "../utils"
import { WSClientLike } from "./types"

type SendOperationDef = {
  inputShape: z.ZodRawShape
}

type ReceiveOperationDef = {
  outputShape: z.ZodRawShape
}

type SendMethods<T extends Record<string, SendOperationDef>> = {
  [K in keyof T]: keyof T[K]["inputShape"] extends never
    ? () => void
    : (input: GetInferredFromRawWithStripReadonly<T[K]["inputShape"]>) => void
}

type OnMethods<T extends Record<string, ReceiveOperationDef>> = {
  [K in keyof T]: (handler: (data: GetInferredFromRaw<T[K]["outputShape"]>) => void) => void
}

type OffMethods<T extends Record<string, ReceiveOperationDef>> = {
  [K in keyof T]: (handler?: (data: GetInferredFromRaw<T[K]["outputShape"]>) => void) => void
}

type WSApiResult<
  TSend extends Record<string, SendOperationDef> | undefined,
  TReceive extends Record<string, ReceiveOperationDef> | undefined,
> = (TSend extends Record<string, SendOperationDef> ? { send: SendMethods<TSend> } : unknown) &
  (TReceive extends Record<string, ReceiveOperationDef>
    ? { on: OnMethods<TReceive>; off: OffMethods<TReceive> }
    : unknown)

export const createWSApi = <
  TSend extends Record<string, SendOperationDef> | undefined = undefined,
  TReceive extends Record<string, ReceiveOperationDef> | undefined = undefined,
>(args: {
  channel: string
  client: WSClientLike
  operations?: {
    send?: TSend
    receive?: TReceive
  }
}): WSApiResult<TSend, TReceive> => {
  const { channel, client, operations } = args

  const result: Record<string, unknown> = {}

  if (operations?.send) {
    const sendMethods: Record<string, (input?: unknown) => void> = {}
    for (const [name, def] of Object.entries(operations.send)) {
      const eventName = `${channel}:${name}`
      const shape = def.inputShape
      const hasFields = Object.keys(shape).length > 0

      sendMethods[name] = (input?: unknown) => {
        if (hasFields) {
          const parsed = z.object(shape).parse(input)
          client.send(eventName, objectToSnakeCaseArr(parsed))
        } else {
          client.send(eventName, {})
        }
      }
    }
    result.send = sendMethods
  }

  if (operations?.receive) {
    const onMethods: Record<string, (handler: (data: unknown) => void) => void> = {}
    const offMethods: Record<string, (handler?: (data: unknown) => void) => void> = {}

    for (const [name, def] of Object.entries(operations.receive)) {
      const eventName = `${channel}:${name}`
      const shape = def.outputShape

      onMethods[name] = (handler: (data: unknown) => void) => {
        const wrappedHandler = (rawData: unknown) => {
          const camelCased = typeof rawData === "object" && rawData !== null ? objectToCamelCaseArr(rawData) : rawData
          const parsed = parseResponse({
            identifier: `${channel}:${name}`,
            data: camelCased as object,
            zod: z.object(shape),
          })
          handler(parsed)
        }
        // Store wrapped handler reference on the original for off() lookup
        ;(handler as any).__wsWrapped = wrappedHandler
        client.on(eventName, wrappedHandler)
      }

      offMethods[name] = (handler?: (data: unknown) => void) => {
        if (handler && (handler as any).__wsWrapped) {
          client.off(eventName, (handler as any).__wsWrapped)
        } else {
          client.off(eventName, handler)
        }
      }
    }
    result.on = onMethods
    result.off = offMethods
  }

  return result as any
}
