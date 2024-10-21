import type { Fn, MaybeRefOrGetter } from '@vueuse/shared'
import type { ConfigurableWindow } from '../_configurable'
import type { MaybeElementRef } from '../unrefElement'
import { isIOS, noop, toValue } from '@vueuse/shared'
import { defaultWindow } from '../_configurable'
import { unrefElement } from '../unrefElement'
import { useEventListener } from '../useEventListener'

export interface OnClickOutsideOptions extends ConfigurableWindow {
  ignore?: MaybeRefOrGetter<(MaybeElementRef | string)[]>
  capture?: boolean
  detectIframe?: boolean
}

export type OnClickOutsideHandler<T extends { detectIframe: OnClickOutsideOptions['detectIframe'] } = { detectIframe: false }> = (evt: T['detectIframe'] extends true ? PointerEvent | FocusEvent : PointerEvent) => void

let _iOSWorkaround = false

export function onClickOutside<T extends OnClickOutsideOptions>(
  target: MaybeElementRef,
  handler: OnClickOutsideHandler<{ detectIframe: T['detectIframe'] }>,
  options: T = {} as T,
) {
  const { window = defaultWindow, ignore = [], capture = true, detectIframe = false } = options

  if (!window)
    return noop

  if (isIOS && !_iOSWorkaround) {
    _iOSWorkaround = true
    Array.from(window.document.body.children)
      .forEach(el => el.addEventListener('click', noop))
    window.document.documentElement.addEventListener('click', noop)
  }

  // eslint-disable-next-line unused-imports/no-unused-vars
  let shouldListen = true

  const shouldIgnore = (event: PointerEvent) => {
    return toValue(ignore).some((target) => {
      if (typeof target === 'string') {
        return Array.from(window.document.querySelectorAll(target))
          .some(el => el === event.target || event.composedPath().includes(el))
      }
      else {
        const el = unrefElement(target)
        return el && (event.target === el || event.composedPath().includes(el))
      }
    })
  }

  const listener = (event: PointerEvent) => {
    const el = unrefElement(target)

    if (!el || event.composedPath().includes(el))
      return

    // Проверка на количество дочерних элементов, игнорируем клик, если их больше одного
    if (el.childNodes.length > 1) {
      return
    }

    if (shouldIgnore(event))
      return

    handler(event)
  }

  let isProcessingClick = false

  const cleanup = [
    useEventListener(window, 'click', (event: PointerEvent) => {
      if (!isProcessingClick) {
        isProcessingClick = true
        setTimeout(() => {
          isProcessingClick = false
        }, 0)
        listener(event)
      }
    }, { passive: true, capture }),
    useEventListener(window, 'pointerdown', (e) => {
      const el = unrefElement(target)
      shouldListen = !shouldIgnore(e) && !!(el && !e.composedPath().includes(el))
    }, { passive: true }),
    detectIframe && useEventListener(window, 'blur', (event) => {
      setTimeout(() => {
        const el = unrefElement(target)
        if (
          window.document.activeElement?.tagName === 'IFRAME'
          && !el?.contains(window.document.activeElement)
        ) {
          handler(event as any)
        }
      }, 0)
    }),
  ].filter(Boolean) as Fn[]

  const stop = () => cleanup.forEach(fn => fn())

  return stop
}
