<template>
  <el-alert :closable="false" style="margin-top: -5px;margin-bottom: 5px; height: 31px;line-height: 16px;" type="success" title="">
    一对多(支持多个二级明细与三级明细表)零代码全自动生成...
  </el-alert>
</template>
<script setup>

import {
  ref,
  reactive,
  toRefs,
  getCurrentInstance
} from 'vue';
const val = ref('')

</script>

<style lang="less" scoped></style>
