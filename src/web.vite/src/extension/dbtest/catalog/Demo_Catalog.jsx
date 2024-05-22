/*****************************************************************************************
 **  Author:jxx 2022
 **  QQ:283591387
 **完整文档见：http://v2.volcore.xyz/document/api 【代码生成页面ViewGrid】
 **常用示例见：http://v2.volcore.xyz/document/vueDev
 **后台操作见：http://v2.volcore.xyz/document/netCoreDev
 *****************************************************************************************/
//此js文件是用来自定义扩展业务代码，可以扩展一些自定义页面或者重新配置生成的代码

let extension = {
  components: {
    //查询界面扩展组件
    gridHeader: '',
    gridBody: '',
    gridFooter: '',
    //新建、编辑弹出框扩展组件
    modelHeader: '',
    modelBody: '',
    modelFooter: ''
  },
  tableAction: '', //指定某张表的权限(这里填写表名,默认不用填写)
  buttons: { view: [], box: [], detail: [] }, //扩展的按钮
  methods: {
    //下面这些方法可以保留也可以删除
    onInit() {
      //示例：设置修改新建、编辑弹出框字段标签的长度
      // this.boxOptions.labelWidth = 150;
      //显示所有查询条件
      this.setFiexdSearchForm(true);

      //设置主键字段
      this.rowKey = 'CatalogId';
    },
    dicInited (params) { //数据源加载完成时的方法,2022.04.04更新method.js文件后才能使用

    },
    onInited() {
      this.height = this.height - 76;
      //框架初始化配置后
      //如果要配置明细表,在此方法操作
      //this.detailOptions.columns.forEach(column=>{ });
      this.boxOptions.height = 390;
    },
    /***加载后台数据见Demo_CatalogController.cs文件***/
    loadTreeChildren(tree, treeNode, resolve) {
      //加载子节点
      let url = `api/Demo_Catalog/getChildrenData?catalogId=${tree.CatalogId}`;
      this.http.post(url, {}).then((result) => {
        resolve(result.rows);
      });
    },
    /***加载后台数据见Demo_CatalogController.cs文件***/
    searchBefore(params) {
      //查询前的方法，如果没有输入查询条件，默认显示一级节点的数据
      if (params.wheres.length == 0) {
        params.value = 1;
      }
      return true;
    },
    addAfter() {
      //新建后刷新下级联的数据字典
      this.initDicKeys();
      return true;
    },
    updateAfter() {
      //编辑后刷新下级联的数据字典
      this.initDicKeys();
      return true;
    },
    delAfter() {
      //删除后刷新下级联的数据字典
      this.initDicKeys();
      return true;
    },
  }
};
export default extension;
