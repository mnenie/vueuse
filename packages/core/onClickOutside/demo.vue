<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { ref } from 'vue'
import Component1 from './component1.vue'
import Component2 from './component2.vue'

const target1 = ref(null)
const target2 = ref(null)

const counter1 = ref(0)
const counter2 = ref(0)
onClickOutside(target1, () => {
  counter1.value++
})
onClickOutside(target2, () => {
  counter2.value++
})
</script>

<template>
  <h1>Hello VueUse!</h1>

  Counter1 {{ counter1 }} <br>
  Counter2 {{ counter2 }}

  <Component1 ref="target1" />
  <br>
  <Component2 ref="target2" />

  <br>

  <p>clicking me should increase both</p>
</template>
