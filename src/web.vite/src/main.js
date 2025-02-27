import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import ElementPlus from 'element-plus';
// import 'element-plus/lib/theme-chalk/index.css';
import 'element-plus/dist/index.css';
import './assets/element-icon/icon.css';
import './assets/bootstrap-icons/font/bootstrap-icons.min.css';
import base from './uitils/common';
import http from './api/http';
// import 'dayjs/locale/zh-cn'
// import locale from 'element-plus/lib/locale/lang/zh-cn'
import translator from './uitils/translator';
import permission from './api/permission';
import viewgird from './components/basic/ViewGrid';
import ServiceSelect from './components/ServiceSelect';
import VolEdit from './components/basic/VolEdit.vue';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

const app = createApp(App);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

import VolSelectBox from './components/basic/VolSelectBox';
import VolSelectTable from './components/basic/VolSelectTable';
translator.init(app);
app.config.globalProperties.base = base;
app.config.globalProperties.http = http;
app.config.globalProperties.$tabs = {};
app.config.globalProperties.permission = permission;
app.config.globalProperties.$global = {
  layout:'left',//菜单布局方式：classics=经典导航，top=顶部导航,left=侧边导航
  theme:"dark",//默认布局颜色：dark、blue、red、orange、green
  menuSearch:true,//菜单是否启用搜索功能
  table: {
    smallCell:true,//表格单元格大小
    useTag: true //table组件下拉框数据源的字段是否显示背景颜色
  },
  border: true,
  lang: true, //是否使用多语言
  labelPosition:"top",//表单(弹出框表单)标签显示位置,可选值，top、left，2023.07.04
  db: true, //是否使用分库
  signalR: true, //是否开启signalR
  audit: {
    //审核选项
    data: [
      { text: '通过', value: 1 },
      { text: '拒绝', value: 3 },
      { text: '驳回', value: 4 }
    ],
    status: [0, 2] //审核中的数据
    // 待审核 = 0,
    // 审核通过 = 1,
    // 审核中 = 2,
    // 审核未通过 = 3,
    // 驳回 = 4
  }
};

import DeptSelect from './components/DeptSelect';

app
  .use(store)
  .use(ElementPlus, { size: 'default' })
  .use(router)
  .use(DeptSelect)
  .use(ServiceSelect)
  .use(VolEdit)
  .use(viewgird)
  .use(VolSelectBox)
  .use(VolSelectTable)
  .mount('#app');
app.config.globalProperties.$Message = app.config.globalProperties.$message;
