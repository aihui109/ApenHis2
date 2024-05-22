<template>
  <vol-edit ref="edit" :keyField="options.key" :tableName="options.tableName" :tableCNName="options.tableCNName"
    :labelWidth="80" labelPosition="left" :formFields="options.editFormFields" :formOptions="options.editFormOptions"
    :detail="options.detail" :addRow="addRow" @initButtons="initButtons" @initDetailButtons="initDetailButtons"
    :loadFormAfter="loadFormAfter" :updateAfter="updateAfter" :addAfter="addAfter">
    <template #header>
      <el-alert title="新窗口编辑模式同样支持主从模式,只需要配置编辑类型" type="success" />
    </template>
    <!-- 
    <template #content>
      <el-alert title="slot数据槽content位置" type="warning" />
    </template>

    <template #footer>
      <el-alert title="slot数据槽footer位置" type="error" />
    </template> -->
  </vol-edit>
</template>

<script>
import { defineComponent, ref, reactive, getCurrentInstance } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import store from '@/store/index';
import http from '@/api/http.js';
import editOptions from './options.js';
//参数传递与方法实现，看VolEdit.vue文件
export default defineComponent({
  setup(props, context) {

    const { proxy } = getCurrentInstance();
    
    //通过获取路由参数id判断是编辑还是新建
    const route = useRoute();
    //let isAdd = true;
    if (route.query.id) {
      //isAdd = false;
    }


    //vol-edit组件
    const edit = ref(null);

    const options = reactive({
      //表单字段
      editFormFields: {},
      //表单配置
      editFormOptions: [],
      //明细表信息
      detail: {
        cnName: '',
        table: '',
        url: '',
        columns: [],
        sortName: '',
        key: ''
      },
      details: []
    });
    Object.assign(options, editOptions());

    //表单按钮
    const formButtons = reactive([]);
    //初始化主表按钮
    const initButtons = (buttons) => {
      //设置表单按钮隐藏
      //buttons[0].hidden=true;
      //记录表单按钮
      formButtons.push(...buttons);
    };
    //初始化明细表按钮
    const initDetailButtons = (buttons) => { };

    //表单数据添加载方法
    const loadFormAfter = (result) => {
      //显示表单按钮(判断表单的值)
      // if (options.formFields.字段==='xxx') {
      //   // formButtons[0].hidden=false;
      // }
    };

    //设置合计
    options.detail.columns.forEach(x => {
      if (x.field == 'Qty') {
        //设置合计
        x.summary = true;
        x.onKeyPress = (row) => {
          //给单价设置值
          row.Price = row.Qty * 2;
          //调用单价刷新合计
          edit.value.getTable().updateSummary('Price')
          return row.Qty;
        }
      }
    })

    //配置编辑表单下拉框table搜索选项
    options.editFormOptions.forEach((option) => {
      option.forEach((item) => {
        if (item.field == 'Customer') {
          item.readonly = false;
          item.url = 'api/Demo_Customer/search';
          //设置显示的字段
          item.columns = [
            {
              field: 'Customer_Id',
              title: 'Customer_Id',
              type: 'int',
              width: 110,
              hidden: true
            },
            //设置search:true,则字段可以搜索
            {
              field: 'Customer',
              title: '客户',
              type: 'string',
              width: 80,
              search: false
            }, //search是否开启表格上方的字段搜索
            {
              field: 'PhoneNo',
              title: '手机',
              type: 'string',
              width: 110,
              search: false
            },
            {
              field: 'Province',
              title: '省',
              type: 'string',
              bind: { key: '省', data: [] },
              width: 80,
              search: false
            },
            {
              field: 'DetailAddress',
              title: '详细地址',
              type: 'string',
              width: 120
            }
          ];

          //选中table数据后，回写到表单
          item.onSelect = (rows) => {
            options.editFormFields.Customer = rows[0].Customer;
            options.editFormFields.PhoneNo = rows[0].PhoneNo;
          };

          /****下面的这些都是可以选配置，上面的是必填的******/

          //(输入框搜索)表格数据加载前处理
          item.loadBefore = (param, callback) => {
            //方式1、手动设置查询条件
            // param.wheres.push({
            //       name:"Customer",
            //       value:this.editFormFields.Customer,
            //       displayType:"like"
            // })
            //方式2、给param.value设置值，后台手动处理查询条件
            param.value = options.editFormFields.Customer;
            callback(true);
          };

          /****************下面这些配置不是必须的**************/
          //表格数据加载后处理
          item.loadAfter = (rows, callback, result) => {
            callback(true);
          };

          //设置弹出框高度(默认200)
          item.height = 200;
          //设置弹出框宽度(默认500)
          //item.width = 400;
          // item.textInline = false; //设置表格超出自动换行显示
          //设置表格是否单选
          item.single = true;
          //设置是否显示分页
          item.paginationHide = false;
        }
      });
    });

    options.detail.columns.forEach((item) => {
      if (item.field == 'Price') {
        item.summary = true;
      } else if (item.field == 'GoodsName') {
        item.readonly = false;
        //配置请求的接口地址
        //可以使用生成的页面接口，注意接口权限问题，如果提示没有权限,参照后台后开发文档上的重写权限示例
        //item.url = 'api/Demo_Goods/getPageData';

        //尽量自定义接口，见下面的文档描述，或者Demo_GoodsController类的方法Search
        item.url = 'api/Demo_Goods/search';

        //设置显示的字段
        item.columns = [
          { field: 'GoodsName', title: '商品名称', type: 'string', width: 120 },
          { field: 'GoodsCode', title: '商品编号', type: 'string', width: 100 },
          {
            field: 'Specs',
            title: '规格',
            type: 'string',
            width: 60,
            align: 'left'
          },
          { field: 'Price', title: '单价', type: 'decimal', width: 60 },
          { field: 'Remark', title: '备注', type: 'string', width: 100 }
        ];

        //选中table数据后，回写到表单
        //editRow:当前正在编辑的行
        //rows:选中的行
        item.onSelect = (editRow, rows) => {
          editRow.GoodsName = rows[0].GoodsName;
          editRow.GoodsCode = rows[0].GoodsCode;
          editRow.Price = rows[0].Price;
        };

        /****下面的这些都是可以选配置，上面的是必填的******/
        //(输入框搜索)表格数据加载前处理
        //editRow:当前正在编辑的行
        //param:请求的参数
        item.loadBefore = (editRow, param, callback) => {
          //方式1、手动设置查询条件
          // param.wheres.push({
          //       name:"GoodsName",
          //       value:row.GoodsName,
          //       displayType:"like"
          // })
          //方式2、给param.value设置值，后台手动处理查询条件
          param.value = editRow.GoodsName;
          callback(true);
        };

        /****************下面这些配置不是必须的**************/
        //表格数据加载后处理
        //editRow:当前正在编辑的行
        //rows:后台返回的数据
        item.loadAfter = (editRow, rows, callback, result) => {
          callback(true);
        };

        //设置弹出框高度(默认200)
        item.height = 200;
      }
    });
    //新建保存后方法
    const addAfter = (result, callback) => {
      //保存后关闭页面
      // proxy.$tabs.close('/路由地址');
      callback(true);
    };

    //编辑保存后方法
    const updateAfter = (result, callback) => {
      callback(true);
    };
    //明细表添加行方法
    const addRow = () => {
      return { Remark: "123456" }
    }
    return {
      edit,
      options,
      initButtons,
      initDetailButtons,
      loadFormAfter,
      addAfter,
      updateAfter,
      addRow
    };
  },
  /****************************************/
  //这里是vue2语法,不想写vue3语法就在这里写vue2
  data() {
    return {};
  },
  methods: {},
  created() {
    //this.options
  }
});
</script>
