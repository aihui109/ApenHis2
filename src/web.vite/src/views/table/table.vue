<template>
    <div class="container">
        <el-alert type="success" title="" style="line-height: 12px;margin-bottom: 10px;">
           table组件配置代码及参数说明,见企业版文档：Table组件
        </el-alert>
        <tableInfo class="table-item"></tableInfo>
        <tableEdit class="table-item"></tableEdit>
        <tableRender class="table-item"></tableRender>
        <tableSearch class="table-item"></tableSearch>
        <tableTree class="table-item"></tableTree>

    </div>
</template>
<script lang="jsx">
import tableInfo from './tableInfo.vue';
import tableEdit from './tableEdit.vue';
import tableRender from './tableRender.vue';
import tableSearch from './tableSearch.vue';
import tableTree from './tableTree.vue';
export default {

    components: {
        tableInfo,
        tableEdit,
        tableRender,
        tableSearch,
        tableTree

    },
    methods: {}
}
</script>
<style lang = "less" scoped >
.container {
    /* height: 100vh; */
    padding: 10px;
    background: #F3F7FC;

    .content {
        border-radius: 5px;
        padding: 10px 0;
        background: #fff;
    }

    .table-item {
        margin-bottom: 10px;
        background: #fff;
    }

}
</style >