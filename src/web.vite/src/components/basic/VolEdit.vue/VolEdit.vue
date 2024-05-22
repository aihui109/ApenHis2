<template>
  <div class="edit-container">
    <el-scrollbar style="height: 100%;  padding: 12px;">
      <slot name="header"></slot>
      <div class="edit-form">
        <div class="edit-form-header">
          <div class="edit-form-header-table-name">
            <div class="border"></div>
            <div class="name">
              {{ $ts(tableCNName) }}{{ keyValue ? '(' + $ts('编辑') + ')' : '(' + $ts('新建') + ')' }}
            </div>
          </div>
          <div class="edit-form-buttons form-buttons">
            <template v-for="(btn, index) in buttons" :key="index">
              <el-dropdown v-if="btn.drop" :type="btn.type" :color="btn.color" @click="() => { }">
                <el-button :plain="btn.plain" :type="btn.type" :color="btn.color" size="small">
                  {{ $ts(item.name)
                  }}<i class="el-icon-arrow-down el-icon-right"></i>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="() => { }" :name="item.name" v-show="!item.hidden"
                      v-for="(item, dIndex) in btn.data" :key="dIndex">
                      <i :class="item.icon"></i>
                      {{ $ts(item.name) }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button v-else :disabled="btn.readonly" :plain="btn.plain" :type="btn.type" :color="btn.color"
                v-show="!btn.hidden" @click="btnClick(btn)">
                <i :class="btn.icon"></i>
                {{ $ts(btn.name) }}
              </el-button>
            </template>
          </div>
        </div>
        <!-- -->
        <vol-form :load-key="false" ref="form" :label-position="labelPosition" :label-width="labelWidth"
          :formRules="formOptions" :formFields="formFields"></vol-form>
      </div>

      <slot name="content"></slot>

      <div v-if="detail.columns.length" class="edit-form edit-detail">
        <div class="edit-form-header">
          <div class="edit-form-header-table-name">
            <div class="border"></div>
            <div class="name">{{ $ts(detail.cnName) }}</div>
          </div>
          <div class="edit-form-buttons">
            <template v-for="(btn, index) in detailButtons" :key="index">
              <el-dropdown v-if="btn.drop" @click="() => { }">
                <el-button link plain size="small">
                  {{ $ts(item.name)
                  }}<i class="el-icon-arrow-down el-icon-right"></i>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="() => { }" :name="item.name" v-show="!item.hidden"
                      v-for="(item, dIndex) in btn.data" :key="dIndex">
                      <i :class="item.icon"></i>
                      {{ $ts(item.name) }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button v-else link v-show="!btn.hidden" @click="btnClick(btn)">
                <i :class="btn.icon"></i>
                {{ $ts(btn.name) }}
              </el-button>
            </template>
          </div>
        </div>
        <vol-table ref="table" @loadBefore="loadDetailTableBefore" @loadAfter="loadDetailTableAfter"
          @rowClick="rowClick" :url="detail.url" :load-key="true" :index="true" :columns="detail.columns"
          :pagination="detail.pagination" :max-height="detail.height" :pagination-hide="!!detail.paginationHide"
          :beginEdit="beginEdit" :endEditBefore="endEditBefore" :summary="true" :column-index="columnIndex" :ck="ck"
          :text-inline="textInline"></vol-table>
      </div>

      <slot name="footer"></slot>
    </el-scrollbar>

    <ViewGridAudit @auditClick="saveAudit" :option="autitTableOptions" ref="audit"> </ViewGridAudit>
  </div>
</template>
<script>
import { ElMessage, ElMessageBox } from 'element-plus';

import { defineComponent, ref, reactive, getCurrentInstance, defineAsyncComponent } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import store from '@/store/index';
import http from '@/api/http.js';
import VolForm from '@/components/basic/VolForm.vue';
import VolBox from '@/components/basic/VolBox.vue';
import VolTable from '@/components/basic/VolTable.vue';
//import AuditHis from '@/components/basic/ViewGrid/AuditHis';

export default defineComponent({
  name: 'vol-edit',
  components: {
    'vol-form': VolForm,
    'vol-table': VolTable,
    'vol-box': VolBox,
    // 'audit-his': AuditHis,  
    ViewGridAudit: defineAsyncComponent(() => import("../ViewGrid/ViewGridAudit"))
  },
  props: {
    keyField: {
      //主键字段
      type: String,
      default: ''
    },
    tableName: {
      type: String,
      default: ''
    },
    tableCNName: {
      type: String,
      default: '表名'
    },
    labelPosition: {
      //标签显示位置
      type: String,
      default: ''
    },
    labelWidth: {
      type: Number, //表单标签宽度
      default: 100
    },
    formFields: {
      type: Object,
      default: {}
    },
    formOptions: {
      type: Object,
      default: () => {
        return [];
      }
    },
    detail: {
      type: Object,
      default: () => {
        return {
          cnName: '',
          table: '',
          columns: [],
          url: '',
          paginationHide: false,//明细表隐藏分页
          pagination: { size: 100, sortName: '' },
          height: 0 //明细表高度
        };
      }
    },
    columnIndex: {
      type: Boolean,
      default: false
    },
    ck: {
      //明细表复选框
      type: Boolean,
      default: true
    },
    textInline: {
      //明细表不换行显示
      type: Boolean,
      default: true
    },
    loadFormBefore: {//表单加载前
      type: Function,
      default: (params, callback) => {
        callback(true);
      }
    },
    loadFormAfter: {//表单加载后
      type: Function,
      default: (result, callback) => {
        callback(true);
      }
    },

    loadTableBefore: { //明细表加载前
      type: Function,
      default: (params, callback) => {
        callback(true);
      }
    },
    loadTableAfter: {//明细表加载后
      type: Function,
      default: (params, result, callback) => {
        callback(true);
      }
    },

    addBefore: { //新建前
      type: Function,
      default: (formData, callback) => {
        callback(true);
      }
    },
    addAfter: {//新建后
      type: Function,
      default: (formData, callback) => {
        callback(true);
      }
    },
    updateBefore: { //更新前
      type: Function,
      default: (formData, callback) => {
        callback(true);
      }
    },
    updateAfter: {//更新后
      type: Function,
      default: (params, callback) => {
        callback(true);
      }
    },
    delRow: {
      type: Function,
      default: (rows) => {
        return true;
      }
    },
    addRow: {//明细表添加行
      type: Function,
      default: () => {
        return {};
      }
    }
  },
  setup(props, context) {
    const keyValue = ref(null);
    const router = useRouter();

    const route = useRoute();
    const id = ref(null);
    let isAdd = true;
    if (route.query.id) {
      isAdd = false;
      id.value = route.query.id;
    }

    keyValue.value = router.currentRoute.value.query.id;
    if (!props.detail.height) {
      props.detail.height = 500;
    }
    const { appContext, proxy } = getCurrentInstance();
    //主表按钮
    const buttons = reactive([]);
    //明细表按钮
    const detailButtons = reactive([]);

    const form = ref(null);
    //保存
    const save = () => {
      form.value.validate((result) => {
        if (!result) {
          return;
        }
        saveExecute();
      });
    };

    const saveExecute = async () => {
      const editFormFields = {};
      let formFields = props.formFields;
      for (const key in formFields) {
        if (Array.isArray(formFields[key])) {
          let u = formFields[key].some((x) => {
            return x.path;
          });
          if (u) {
            let allPath = formFields[key].map((x) => {
              return x.path;
            });
            editFormFields[key] = allPath.join(',');
          } else if (dicInfo[key] && (dicInfo[key].type == 'cascader')) {
            editFormFields[key] =
              formFields[key][formFields[key].length - 1] || null;
          } else {
            editFormFields[key] = formFields[key].join(',');
          }
        } else if (typeof formFields[key] == 'function') {
          try {
            editFormFields[key] = formFields[key]();
          } catch (error) { }
        } else {
          editFormFields[key] = formFields[key];
        }
      }
      if (id.value) {
        editFormFields[props.keyField] = id.value;
      }
      let formData = {
        mainData: editFormFields,
        detailData: null,
        delKeys: delKeys
      };
      //生成明细表数据d
      if (props.detail.columns.length) {
        formData.detailData = getDetailRows();
      }
      let status = true;
      // proxy.$emit(isAdd ? 'addBefore' : 'updateBefore', formData, (result) => {
      proxy[isAdd ? 'addBefore' : 'updateBefore'](formData, (result) => {
        // status = result;
        if (!result) {
          return;
        }
        saveExecting(formData);
      });
      if (!status) return;
    };

    const saveExecting = (formData) => {
      const saveUrl = `api/${props.tableName}/${isAdd ? 'add' : 'update'}`;
      http.post(saveUrl, formData, true).then((x) => {
        ElMessage({
          type: x.status ? 'success' : 'error',
          message: x.message
        });
        if (!x.status) {
          return;
        }
        proxy[isAdd ? 'addAfter' : 'updateAfter'](x, (result) => {
          //  status = result;
        });
        delKeys.splice(0);
        if (isAdd) {
          form.value.reset();
          //重置明细表数据
          table.value && table.value.reset();
          return;
        }
      });
    };

    const getDetailRows = () => {
      let detailData = table.value.rowData;
      let _fields = props.detail.columns
        .filter((c) => {
          return (
            c.type == 'selectList' || (c.edit && c.edit.type == 'selectList')
          );
        })
        .map((c) => {
          return c.field;
        });
      //2022.06.20增加保存时对明细表下拉框多选的判断
      if (_fields.length) {
        detailData = JSON.parse(JSON.stringify(detailData));
        detailData.forEach((row) => {
          for (let index = 0; index < _fields.length; index++) {
            const _field = _fields[index];
            if (Array.isArray(row[_field])) {
              row[_field] = row[_field].join(',');
            }
          }
        });
      }
      return detailData;
    };
    //删除
    const delClick = () => {
      if (isAdd) {
        return;
      }
      ElMessageBox.confirm('确定要删除此数据吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        center: true,
        type: 'warning'
      }).then(() => {
        const delUrl = `api/${props.tableName}/del`;
        http.post(delUrl, [id.value], true).then((x) => {
          ElMessage({
            type: x.status ? 'success' : 'error',
            message: x.message
          });
          if (!x.status) {
            return;
          }
          appContext.config.globalProperties.$tabs.close(route.path);
        });
      });
    };

    let permission = store.getters.getPermission('/' + props.tableName);
    if (!permission || !permission.permission) {
      permission = store.getters.getPermission(route.path);
    }
    permission = permission ? (permission.permission || []) : [];

    if (permission.includes('Add') || permission.includes('Update')) {
      buttons.push({
        name: '保存',
        hidden: false,
        readonly: false,
        icon: 'el-icon-check',
        plain: true,
        value: 'Delete',
        type: 'primary',
        // color:"#F56C6C",
        click: () => {
          save();
        }
      });

      detailButtons.push({
        name: '刷新',
        hidden: false,
        icon: 'el-icon-refresh',
        click: () => {
          getDetailData();
        }
      });

      detailButtons.push({
        name: '删除行',
        hidden: false,
        readonly: false,
        icon: 'el-icon-delete',

        click: () => {
          delRow();
        }
      });

      detailButtons.push({
        name: '添加行',
        readonly: false,
        hidden: false,
        icon: 'el-icon-plus',
        click: () => {
          detailAddRow();
        }
      });
    } else {
      //没有新建与编辑权限的设置为只读
      props.formOptions.forEach((options) => {
        options.forEach((op) => {
          op.readonly = true;
        });
      });
    }
    if (permission.includes('Audit') && !isAdd) {
      buttons.unshift({
        name: '审核',
        readonly: false,
        hidden: false,
        value: 'Audit',
        icon: 'el-icon-edit-outline',
        click: () => {
          auditClick();
        }
      });
    }
    if (id.value) {
      if (permission.includes('Delete')) {
        buttons.unshift({
          name: '删除',
          readonly: false,
          hidden: false,
          plain: true,
          value: 'Delete',
          type: 'danger',
          color: "#F56C6C",
          icon: 'el-icon-delete',
          click: () => {
            delClick();
          }
        });
      }
    }

    // buttons.unshift({
    //   name: '刷新',
    //   hidden: false,
    //   icon: 'el-icon-refresh',
    //   click: () => {}
    // });
    proxy.$emit('initButtons', buttons);

    proxy.$emit('initDetailButtons', detailButtons);

    //明细表加载前
    const loadDetailTableBefore = (param, callback) => {
      if (!id.value) {
        callback(false);
        return;
      }
      param.value = id.value;

      //这里现在不支持异步请求,需要修改voltable
      // proxy.$emit('loadTableBefore', param, (x) => {
      proxy.loadTableBefore(param, (x) => {
        callback(x);
      });
    };
    //明细表加载后
    const loadDetailTableAfter = (rows, result) => {
      proxy.loadTableAfter(rows, result, (x) => { });
      return true;
    };

    const rowClick = () => { };

    //开始编辑
    const beginEdit = (row, column, index) => {
      return true;
    };
    //结束编辑前
    const endEditBefore = (row, column, index) => {

      proxy.$emit("endEditBefore", row, column, index)
      return true;
    };

    //明细表refs
    const table = ref(null);
    //添加行
    const detailAddRow = () => {
      let _row = props.addRow()
      table.value.rowData.unshift(_row || {});
    };

    const delKeys = [];
    const delRow = () => {
      const selectRows = table.value.getSelected();

      if (!selectRows.length) {
        ElMessage({
          type: 'error',
          message: proxy.$ts('请选择行数据')
        });
        return;
      }

      if (!props.delRow(selectRows)) {
        return;
      }
      //  proxy.$emit('delRow',dsel)

      ElMessageBox.confirm(proxy.$ts('确定要删除选中的行吗?'), proxy.$ts('提示'), {
        confirmButtonText: proxy.$ts('确定'),
        cancelButtonText: proxy.$ts('取消'),
        center: true,
        type: 'warning'
      }).then(() => {
        let key = props.detail.key;
        //记录删除的行数据
        selectRows.forEach((x) => {
          if (x.hasOwnProperty(key) && x[key]) {
            delKeys.push(x[key]);
          }
        });
        table.value.delRow();
        updateDetailTableSummaryTotal();
      });
    };

    const updateDetailTableSummaryTotal = () => {
      //2021.09.25增加明细表删除、修改时重新计算行数与汇总
      //2021.12.12增加明细表判断(强制刷新合计时会用到)
      if (!props.detail.columns.length) {
        return;
      }
      //删除或新增行时重新设置显示的总行数
      table.value.paginations.total = table.value.rowData.length;
      //重新设置合计
      if (table.value.summary) {
        table.value.columns.forEach((column) => {
          if (column.summary) {
            table.value.getInputSummaries(null, null, null, column);
          }
        });
      }
    };

    const workFlowSteps = reactive([]);
    const audit = ref(null)
    //获取审核节点信息
    const auditClick = () => {
      let _row = JSON.parse(JSON.stringify(props.formFields))
      _row[props.keyField] = keyValue.value
      console.log(_row)
      audit.value.open([_row], null, '', false);

    };
    const saveAudit = (params, rows, callback) => {
      //保存审核
      let keys = rows.map((x) => {
        return x[props.keyField];
      });
      // if (!this.auditBefore(keys, rows)) {
      //   return;
      // }
      let url = `api/${props.tableName}/audit?auditReason=${params.reason
        }&auditStatus=${params.value}`;
      http.post(url, keys, 'loading....').then((x) => {
        // if (!this.auditAfter(x, keys)) {
        //   return;
        // }
        if (!x.status) return proxy.$message.error(x.message);

        callback && callback(x);
        proxy.$message.success(x.message);
        //this.refresh();
      });
    }


    let $message = appContext.config.globalProperties.$message;
    //当前操作的行数据
    const row = reactive({});

    const execGetPageData = (url, params) => {
      http.post(url, params, true).then((result) => {
        if (!result.rows) {
          ElMessage({
            type: 'error',
            message: proxy.$ts('参数不正确')
          });
          return;
        }
        if (result.rows[0].hasOwnProperty('AuditStatus')) {
          if (result.rows[0].AuditStatus === 1) {
            buttons.forEach((x) => {
              if (x.value == 'Audit') {
                x.readonly = true;
              }
            });
          }
        }
        Object.assign(row, result.rows[0]);
        for (const key in props.formFields) {
          let val = result.rows[0][key];

          if (val === null || val === '' || val === undefined) {
            if (Array.isArray(props.formFields[key])) {
              props.formFields[key] = [];
            } else {
              props.formFields[key] = null;
            }
            continue;
          }
          //文件处理
          if (files.indexOf(key) != -1) {
            props.formFields[key] = val.split(',').map((x) => {
              let index = x.lastIndexOf('/');
              return {
                name: x.substr(x.length, index - 1),
                path: x
              };
            });
            continue;
          }

          if (dicInfo[key]) {
            //多选
            if (
              ['checkbox', 'selectList', 'treeSelect'].indexOf(dicInfo[key].type) != -1
            ) {
              //多选
              val = val.split(',');
              if (dicInfo[key].isNumber) {
                props.formFields[key] = val.map((x) => {
                  return x * 1;
                });
              }
              props.formFields[key] = val;
              continue;
            }
            if (dicInfo[key].type == 'cascader') {
              let orginData = [];
              props.formOptions.forEach((option) => {
                option.forEach((item) => {
                  if (item.field == key) {
                    orginData = item.orginData || [];
                  }
                });
              });
              let treeVal = appContext.config.globalProperties.base.getTreeAllParent(
                val,
                orginData
              );
              props.formFields[key] = treeVal.map((x) => {
                return x.id;
              });
              //console.log('编辑级联');
              continue;
            }
            if (dicInfo[key].isNumber) {
              if (typeof val === 'string') {
                props.formFields[key] = val + '';
              } else {
                props.formFields[key] = val * 1;
              }
            } else {
              props.formFields[key] = val + '';
            }
            continue;
          }

          props.formFields[key] = val + '';
          //校验图片、多选字段设置值
          //校验字段值类型
        }

        proxy.loadFormAfter(result, () => {

        });
      });
    };

    const getData = () => {
      if (!id.value) {
        return;
      }
      const url = `api/${props.tableName}/getPageData`;
      const params = {
        page: 1,
        row: 1,
        wheres: JSON.stringify([{ name: props.keyField, value: id.value }])
      };
      //proxy.$emit('loadFormBefore', params, (x) => {
      proxy.loadFormBefore(params, (x) => {
        if (!x) {
          return;
        }
        execGetPageData(url, params);
      });
    };

    const getDetailData = () => {
      if (!id.value) {
        return;
      }
      delKeys.length = 0;
      table.value.load({}, true);
      // http.post(props.detail.url,{page:})
    };

    // if (id.value) {
    //   getData();
    //   //获取明细表数据
    //   // getDetailData();
    // }
    //图片与文件上传字段
    const files = [];
    const dicInfo = reactive({});
    const uploadUrl = 'api/' + props.tableName + '/upload';
    const initDic = () => {
      const keys = [];
      props.formOptions.forEach((options) => {
        options.forEach((op) => {
          if (route.query.audit) {
            op.readonly = true;
          }
          if (op.type == 'editor') {
            op.url = uploadUrl;
          }
          else if (['img', 'excel', 'file'].indexOf(op.type) != -1) {
            files.push(op.field);
            if (!op.url) {
              op.url = uploadUrl;
            }
          } else if (op.dataKey) {
            dicInfo[op.field] = {
              data: [],
              type: op.type,
              isNumber: false,
              key: op.dataKey
            };
            keys.push(op.dataKey);
            op.data = dicInfo[op.field].data;
          }
        });
      });
      if (!keys.length) {
        getData();
        return;
      }
      //初始化数据字典
      const dicUrl = 'api/Sys_Dictionary/GetVueDictionary';
      http.post(dicUrl, keys, true).then((result) => {
        for (let index = 0; index < result.length; index++) {
          const dicData = result[index];
          for (const key in dicInfo) {
            if (dicInfo[key].key == dicData.dicNo) {
              //生成级联数据
              if (dicInfo[key].type == 'cascader' || dicInfo[key].type == 'treeSelect') {
                let _data = JSON.parse(JSON.stringify(dicData.data));
                let cascaderArr = appContext.config.globalProperties.base.convertTree(
                  _data,
                  (node, data, isRoot) => {
                    if (!node.inited) {
                      node.inited = true;
                      node.label = node.value;
                      node.value = node.key;
                    }
                  }
                );
                props.formOptions.forEach((option) => {
                  option.forEach((item) => {
                    if (item.dataKey == dicData.dicNo) {
                      item.orginData = dicData.data;
                      item.data = cascaderArr;
                      if (!item.hasOwnProperty('checkStrictly')) {
                        item.checkStrictly = true;
                      }
                    }
                  });
                });
              } //select2组件
              else if (dicData.data.length >= 500 && !dicData.data[0].label) {
                dicData.data.forEach((item) => {
                  item.label = item.value;
                  item.value = item.key;
                });
              }
              dicInfo[key].data.splice(0);
              dicInfo[key].data.push(...dicData.data);
              if (dicData.data.length) {
                dicInfo[key].isNumber = typeof dicData.data[0].key !== 'string';
              }
            }
          }
        }
        //获取数据
        getData();
      });
    };
    initDic();

    const btnClick = (item) => {
      if (item.click) {
        item.click();
      } else if (item.onClick) {
        item.onClick();
      }
    };
    const autitTableOptions = reactive({
      key: props.keyField,
      tableName: props.tableName,
      url: props.tableName,
      tableCNName: props.tableCNName
    });
    const getTable = () => {
      return table.value;
    }
    return {
      id,
      dicInfo,
      getData,
      buttons,
      detailButtons,
      loadDetailTableAfter,
      loadDetailTableBefore,
      rowClick,
      beginEdit,
      endEditBefore,
      form,
      table,
      detailAddRow,
      keyValue,
      workFlowSteps,
      row,
      btnClick,
      autitTableOptions,
      audit,
      saveAudit,
      getTable,
      save,
      getDetailData
    };
  }
});
</script>
<style lang="less" scoped>
@import './edit.less';

.form-buttons {
  font-weight: 500;
}
</style>
