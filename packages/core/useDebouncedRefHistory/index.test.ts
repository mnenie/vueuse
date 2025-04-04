import { describe, expect, it, vi } from 'vitest'
import { nextTick, shallowRef } from 'vue'
import { useDebouncedRefHistory } from './index'

describe('useDebouncedRefHistory', () => {
  it('once the ref\'s value has changed and some time has passed, ensure the snapshot is updated', async () => {
    const v = shallowRef(0)

    const { history } = useDebouncedRefHistory(v, { debounce: 10 })
    v.value = 100
    expect(history.value.length).toBe(1)
    expect(history.value[0].snapshot).toBe(0)

    await vi.waitFor(() => {
      expect(history.value.length).toBe(2)
      expect(history.value[0].snapshot).toBe(100)
    }, { interval: 5 })
  })

  it('when debounce is undefined', async () => {
    const v = shallowRef(0)

    const { history } = useDebouncedRefHistory(v, { deep: false })

    v.value = 100

    await nextTick()

    expect(history.value.length).toBe(2)
    expect(history.value[0].snapshot).toBe(100)
  })
})
