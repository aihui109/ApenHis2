export default function(){
    const editFormFields = {"OrderNo":"","OrderType":"","TotalPrice":"","TotalQty":"","OrderDate":"","Customer":"","PhoneNo":"","OrderStatus":""};
    const editFormOptions = [[{"title":"订单编号","required":true,"field":"OrderNo","disabled":true},
                       {"dataKey":"订单状态","data":[],"title":"订单类型","required":true,"field":"OrderType","type":"select"},
                       {"title":"总价","field":"TotalPrice","type":"decimal"},
                       {"title":"总数量","field":"TotalQty","type":"number"}],
                      [{"title":"订单日期","required":true,"field":"OrderDate","type":"datetime"},
                       {"title":"客户","field":"Customer","disabled":false,"type":"selectTable"},
                       {"title":"手机","field":"PhoneNo","disabled":true,"type":"text"},
                       {"dataKey":"订单状态","data":[],"title":"订单状态","required":true,"field":"OrderStatus","type":"select"}]];
        const tableName="Demo_Order";
        const tableCNName="订单管理窗口模式";
        const newTabEdit=true;
        const key='GoodsId';
        const detail = {
                    cnName: '订单明细',
                    table: 'Demo_OrderList',
                    columns: [{field:'OrderList_Id',title:'OrderList_Id',type:'guid',width:110,hidden:true,readonly:true,require:true,align:'left'},
                       {field:'Order_Id',title:'Order_Id',type:'guid',width:110,hidden:true,align:'left'},
                       {field:'GoodsId',title:'商品id',type:'guid',width:110,hidden:true,align:'left'},
                       {field:'GoodsName',title:'商品名称',type:'string',width:120,edit:{type:'selectTable'},require:true,align:'left',sort:true},
                       {field:'GoodsCode',title:'商品编号',type:'string',width:120,edit:{type:'text'},require:true,align:'left'},
                       {field:'Img',title:'商品图片',type:'img',width:100,align:'left',edit:{type:'img'}},
                       {field:'Specs',title:'商品规格',type:'string',bind:{ key:'商品规格',data:[]},width:120,readonly:true,edit:{type:'select'},align:'left'},
                       {field:'Price',title:'单价',type:'decimal',width:110,readonly:true,edit:{type:''},require:true,align:'left'},
                       {field:'Qty',title:'数量',type:'int',width:110,edit:{type:''},require:true,align:'left'},
                       {field:'Remark',title:'备注',type:'string',width:100,edit:{type:''},align:'left'},
                       {field:'CreateID',title:'CreateID',type:'int',width:80,hidden:true,align:'left'},
                       {field:'Creator',title:'创建人',type:'string',width:100,align:'left'},
                       {field:'CreateDate',title:'创建时间',type:'datetime',width:145,align:'left',sort:true},
                       {field:'ModifyID',title:'ModifyID',type:'int',width:80,hidden:true,align:'left'},
                       {field:'Modifier',title:'Modifier',type:'string',width:130,hidden:true,align:'left'},
                       {field:'ModifyDate',title:'ModifyDate',type:'datetime',width:110,hidden:true,align:'left',sort:true}],
                    sortName: 'CreateDate',
                    key: 'OrderList_Id',
                    url:"api/Demo_Order/GetDetailPage",
                    buttons:[],
                    delKeys:[]
        };

       const details=[]

    return {
        key,
        tableName,
        tableCNName,
        editFormFields,
        editFormOptions,
        detail,
        details,
        newTabEdit
    }
}