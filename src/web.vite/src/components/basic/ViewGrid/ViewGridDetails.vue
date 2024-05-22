<template>
    <div class="detail-container" :class="[getData.length == 1 ? 'detail-single' : '']">
        <el-tabs type="border-card" v-model="activeName" class="details-tabs" @tab-click="tabsClick">
            <el-tab-pane :lazy="false" v-for="(item, index) in getData" :key="item.table" :label="$ts(item.cnName)"
                :name="item.table">
                <div class="detail-title">
                    <div class="detail-name">{{ $ts(item.cnName) }}</div>
                    <div class="detail-btn">
                        <template v-for="(btn, index2) in item.buttons" :key="index2">
                            <view-grid-expand :render="btn.render" :item="btn" v-if="btn.render"></view-grid-expand>
                            <el-button v-else v-show="!btn.hidden" link @click="btnClick(btn, item, index)"><i
                                    :class="btn.icon"></i>{{ $ts(btn.name) }}</el-button>
                        </template>
                    </div>
                </div>
            </el-tab-pane>
        </el-tabs>
        <div v-for="(item, index) in data" v-show="!item.hidden&&activeName==item.table">
            <vol-table :ref="item.table" @loadBefore="(param, callBack) => { loadBefore(param, callBack, item) }"
                @loadAfter="(param, callBack) => { loadAfter(param, callBack, item) }"
                @rowChange="(rows) => { rowChange(rows, item) }" @rowClick="(ops) => { rowClick(ops, item) }" :url="url"
                :load-key="true" :index="true" :columns="item.columns" :pagination="item.pagination" :height="height"
                :single="item.single" :pagination-hide="false" :defaultLoadPage="!!item.load" :beginEdit="item.beginEdit"
                :endEditBefore="item.endEditBefore" :endEditAfter="item.endEditAfter" :summary="item.summary"
                :click-edit="true" :column-index="item.columnIndex" :ck="item.ck" :text-inline="item.textInline"
                :select2Count="1000" :selectable="item.selectable"></vol-table>
        </div>
    </div>
</template>

<script>
import {
    defineComponent,
    ref,
    reactive,
    toRefs,
    getCurrentInstance
} from 'vue';
import ViewGridExpand from "./ViewGridExpand";
import VolTable from "@/components/basic/VolTable.vue";
import VolForm from "@/components/basic/VolForm.vue";
export default {
    props: {
        mainTable: { //主表表名
            typeof: String,
            default: ""
        },
        data: {
            typeof: Array,
            default: () => {
                return []
            }
        },
        height: {
            typeof: Number,
            default: 300,
        }
    },
    components: {
        ViewGridExpand,
        "vol-form": VolForm,
        "vol-table": VolTable,
    },
    computed: {
        getData() {
            return this.data.filter(x => { return !x.hidden });
        }
    },
    setup(props, context) {

        //  const height=ref(300);

        const activeName = ref()
        if (props.data.length) {
            activeName.value = props.data[0].table;
        }

        const url = `api/${props.mainTable.replaceAll('/', '')}/getDetailPage`;


        const loadBefore = (rows, callBack, item) => {
            item.delKeys.splice(0)
            clearFreeze(item.table);
            context.emit('loadBefore', rows, callBack, item.table, item)

            //callBack(true)

        }
        const loadAfter = (rows, callBack, item) => {
            //callBack(true)
            context.emit('loadAfter', rows, callBack, item.table, item);
            if (item.detail) {
                // rows.forEach(x=>{
                //     x[item.detail.table]=[];
                // })
            }
            setFreeze(item.table, rows);
        }

        const rowChange = (rows, item) => {
            //row, table
            context.emit('rowChange', rows, item)
        }
        const rowClick = (ops, item) => {
            context.emit('rowClick', { row: ops.row, column: ops.column, event: ops.event, item })
        }
        const setTable = (table) => {
            activeName.value = table;
        }
        const tabsClick = (obj) => {
            context.emit('tabsClick', obj.props.name)
        }
        const btnClick = (btn, item, index) => {
            btn.onClick(item.table, item, btn, index);
        }
        // const addRow=()=>{

        // }

        const clearFreeze = (table) => {
            let _obj = freezeze.find(c => { return c.table == table });
            if (_obj) {
                _obj.rows = []
            }
        }

        const freezeze = props.data.filter(c => { return c.columns }).map(c => {
            return {
                table: c.table,
                fields: c.columns.map(x => { return x.field }),
                rows: []
            }
        });
        //记录返回的行数据
        const setFreeze = (table, rows) => {
            let _obj = freezeze.find(c => { return c.table == table });
            if (!_obj) {
                return;
            }
            let _rows = rows.map(c => {
                let row = {};
                _obj.fields.forEach(x => {
                    row[x] = c[x];
                })
                return row;
            })
            _obj.rows = _rows;
        }

        //获取修改过的行
        const getDiffRows = (table, key, rows, detailItem) => {
            if (!rows.length) {
                return rows;
            }
            let _obj = freezeze.find(c => { return c.table == table });
            if (!_obj || !_obj.rows.length) {
                return rows;
            }
            //都是新增的数据
            if (!rows.some(c => { return c[key] })) {
                return rows;
            }


            let newRows = [];
            for (let index = 0; index < rows.length; index++) {
                const row = rows[index];
                if (!row[key] || (detailItem && row[detailItem.table] && row[detailItem.table].length)) {
                    newRows.push(row);
                } else { //if(checkRowDiff(_obj.fields,row,)){
                    //找到相同的数据
                    let rowOrg = _obj.rows.find(c => { return c[key] === row[key] });
                    if (!rowOrg) {
                        newRows.push(row);
                    } else if (checkRowDiff(_obj.fields, row, rowOrg)) {
                        newRows.push(row);
                    }
                }
            }
            return newRows;
        }

        const checkRowDiff = (fields, row1, row2) => {
            for (let index = 0; index < fields.length; index++) {
                const field = fields[index];
                if (row1[field] !== row2[field]) {
                    return true;
                }
            }
            return false;
        }


        return {
            activeName,
            loadBefore,
            loadAfter,
            rowChange,
            rowClick,
            //  height,
            tabsClick,
            btnClick,
            url,
            clearFreeze,
            getDiffRows,
            setTable
        }
    }
}
</script>
<style lang="less" scoped>
.detail-container {
    // padding: 0 10px;
    // border-top: 1.5px solid #eaeaea;
    min-height: 300px;
margin: 0 10px 10px 10px;
    ::v-deep(.el-tabs__nav-wrap:after) {
        background: none !important;
    }

    ::v-deep(.el-tabs__item) {
        height: 35px !important;
    }

    ::v-deep(.el-tabs) {
        border-bottom: none;
    }

    ::v-deep(.el-tabs__content) {
        padding: 10px;
        padding-top: 0;
        padding-bottom: 3px;
    }

    .detail-title {
        display: flex;
        padding: 10px 0 5px 0;
        position: relative;

        .detail-name {
            flex: 1;
            font-size: 13px;
            font-weight: bold;
            width: 0;
            padding-left: 10px;
            color: #3b3b3b;
        }

        .detail-name:before {
            content: "";
            position: absolute;
            width: 5px;
            height: 16px;
            background: #2b2a2a;
            left: 0px;
            border-radius: 2px;
            bottom: -9px;
            top: 11px;
        }
    }
}

.detail-single ::v-deep(.el-tabs__header) {
    display: none;
}

.detail-single .details-tabs {
    border-top: 1px solid #eee;
}
.detail-btn{
    display: flex;
    justify-content: flex-end;
}
</style>