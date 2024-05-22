<template>
  <div class="home-content" data-v-7f6868a7="">
    <el-scrollbar style="height: 100%;">
      <div style="margin:10px 0 -5px 12px;font-size: 14px;font-weight: bold;">
        <i class="el-icon-warning-outline"></i> 功能说明
        <a class="contact" target="_blank">
          <!-- href="https://qm.qq.com/cgi-bin/qm/qr?k=t6OMhfBOnZ3urZiH4_keyIaKA98C9ieH&noverify=0&personal_qrcode_source=4" -->
          企业版可以面向更复杂的系统，支持分库与动态无限分库完美结合saas平台等功能，并提供技术支持、包括更完整的功能,
          <img src="/static/qq.png" style="height: 15px;" />联系方式：283591387</a>
      </div>
      <div class="home-list">
        <div class="list-item" v-for="(item, index) in list" :key="index">
          <div class="content">
            <div class="content-right">
              <div class="name">
                <i class="el-icon-warning-outline"></i>{{ item.name }}
              </div>
              <div class="data" data-v-7f2e9c68="">
                {{ item.desc }}
              </div>
            </div>
            <div class="mouse-enter-class"></div>
          </div>
          <div :class="[item.type == '增强' ? 'item-strengthen' : (item.type == '新增' ? 'item-new' : 'item-other')]">{{
            item.type }}</div>
        </div>
      </div>
      <div class="home-list-content">
        <div class="chart-line">
          <div id="h-chart1" style="width: 100%;height:100%;"></div>

          <div class="radio-group">
            <el-radio-group v-model="radioValue" size="small">
              <el-radio-button label="本月" />
              <el-radio-button label="上月" />
              <el-radio-button label="近三月" />
              <el-radio-button label="近半年" />
            </el-radio-group>
          </div>
        </div>
        <div id="h-chart2" style="height: 250px; background: white;width: 350px; "></div>
      </div>
    </el-scrollbar>
  </div>
</template>
<script>
import {
  defineComponent,
  ref,
  reactive,
  toRefs,
  getCurrentInstance,
  onMounted,
  onUnmounted
} from 'vue';
import { chart1, chart2, chart3, chart4 } from './home/home-chart-options';
import * as echarts from 'echarts';
import { useRouter, useRoute } from 'vue-router';
import store from '../store/index';
import http from '@/../src/api/http.js';
export default {
  components: {},
  setup(props) {
    const radioValue=ref();
    const list = reactive([
      {
        name: '移动端开发',
        desc: '移动端基于uniapp开发,同样自动生成代码,小程序搜：vol开发框架',
        type: "基础"
      },
      {
        name: '审批流程',
        desc: '支持按条件分支、多部门、多角色、多用户、并签、或签、终止、回退、重新发起流程、反审等功能',
        type: "增强"
      },
      { name: '多组织架构、多角色', desc: '支持用户分配多组织、多角色并支持层级关系', type: "增强" },
      { name: '国际化', desc: '后台生成语言包,前后端实时显示翻译', type: "新增" },
      {
        name: '一对多代码生成',
        desc: '不需要写代码即可生成一对多,见菜单[一对多生成]',
        type: "新增"
      },
      { name: '业务分库', desc: '支持按业务划分不同的数据', type: "增强" },
      {
        name: '动态无限分库',
        type: "新增",
        desc: '支持全自动无限动态分库(如：每个租户都有一个独立的数据库)'
      },
      { name: '数据权限', desc: '支持配置角色与者组织部门数据权限', type: "新增" },
      {
        name: '字段权限',
        type: "新增",
        desc: '支持配置不同角色字段权限(每个角色看到的字段不一样)'
      },
      {
        name: 'tab页面编辑功能',
        type: "新增",
        desc: '默认编辑弹出框编辑,支持tab选项卡编辑'
      },
      { name: '物理删除与逻辑删除', type: "新增", desc: '支持配置文件设置物理、逻辑删除' },
      { name: '自定义大屏设计器', type: "新增", desc: '可以在线设计各种大屏数据,支持大屏菜单权限' },
      { name: '打印功能', type: "新增", desc: '支持自定义在线打印设计' },
      { name: '数据库与缓存支持', type: "基础", desc: 'sqlserver、mysql、pgsql、oracle、redis' },
      { name: '其他', type: "新增", desc: '100%提供源码、技术支持、二次开发、销售商业使用及正规发票' }

    ]);

    const { proxy } = getCurrentInstance();
    let dateArr = new Array(10).fill(0).map((x, i) => {
      let date = proxy.base.getDate();
      return proxy.base.addDays(date, i * -1)
    })

    const getChartData = () => {

      return {
        title: {
          text: '收支记录',
          textStyle: {
            fontSize: 16
          }
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          padding: 5,
          textStyle: {
            fontSize: 12,
            // color: '#afe3ff'
          },
          itemHeight: 9,
          itemWidth: 12,
          icon: 'roundRect',// 'circle',
          data: ['收入', '支出']
        },
        xAxis: {
          show: true,
          axisTick: {
            show: false // 不显示坐标轴刻度线
          },
          axisLine: {
            show: false // 不显示坐标轴线
          },
          type: 'category',
          boundaryGap: false,
          data: dateArr,// ['05-17', '05-18', '05-19', '05-20', '05-21', '05-22', '05-23'],
          axisLabel: {
            //y轴文字的配置
            textStyle: {
              color: '#a7a7a7',
              margin: 15
            }
          }
        },
        grid: {
          left: 50,
          bottom: 20,
          top: 40,
          right: 50
        },
        yAxis: {

          splitNumber: 3,
          splitLine: { show: false },
          type: 'value',
          axisLabel: {
            //y轴文字的配置
            textStyle: {
              color: '#a7a7a7',
              margin: 15
            }
          }

        },
        series: [
          {
            name: '收入',
            type: 'line',
            smooth: true,
            lineStyle: {      // 阴影部分
              shadowOffsetX: 0, // 折线的X偏移    
              shadowOffsetY: 6,// 折线的Y偏移  
              shadowBlur: 8,  // 折线模糊
              shadowColor: "#e3d6fd", //折线颜色
            },

            showSymbol: false,

            emphasis: {
              focus: 'series'
            },
            data: [30, 765, 456, 697, 23, 564, 400, 345, 478, 123, 45, 789, 231, 654, 98, 34, 56, 78, 192, 321, 645, 700, 213, 546, 600, 312]
          },
          {
            name: '支出',
            type: 'line',
            smooth: true,
            lineStyle: {      // 阴影部分
              shadowOffsetX: 0, // 折线的X偏移    
              shadowOffsetY: 7,// 折线的Y偏移  
              shadowBlur: 8,  // 折线模糊
              shadowColor: "#9fceff", //折线颜色
            },

            itemStyle: {
              color: '#2196F3'
            },
            showSymbol: false,

            emphasis: {
              focus: 'series'
            },
            data: [0, 456, 789, 280, 800, 470, 213, 546, 98, 312, 432, 567, 891, 234, 561, 784, 325, 647, 892, 135, 462,
              781, 700, 236, 578, 899]
          }
        ]
      }

    }

    const chartPie = () => {
      return {
        color: ['#95a2ff', '#3cb9fc	', '#76da91', '#fae768', '#87e885', '#87e125', '#f89588'],
        tooltip: {
          trigger: 'item'
        },
        legend: {
          padding: 5,
          textStyle: {
            fontSize: 12,
            // color: '#afe3ff'
          },
          itemHeight: 9,
          itemWidth: 12,
          icon: 'roundRect',// 'circle',
          top: 'center',
          orient: 'vertical',
          left: 'left'
        },
        grid: {
          bottom: 120,
          top: -10
        },
        series: [
          {
            name: '收入',
            type: 'pie',
            center: ['50%', '50%'], //饼图位置
            radius: ['60%', '75%'],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 40,
                fontWeight: 'bold'
              }
            }, label: {
              normal: {
                show: true,
                position: 'center',
                color: '#4c4a4a',
                formatter: '{total|' + 20000 + '}' + '\n\r' + '{active|累计收入}',
                rich: {
                  total: {
                    fontSize: 35,
                    fontWeight: 700,
                    fontFamily: "微软雅黑",
                    color: '#454c5c'
                  },
                  active: {
                    fontFamily: "微软雅黑",
                    fontSize: 16,
                    color: '#6c7a89',
                    lineHeight: 30,
                  },
                }
              },
              emphasis: {//中间文字显示
                show: true,
              }
            },
            lableLine: {
              normal: {
                show: false
              },
              emphasis: {
                show: true
              },
              tooltip: {
                show: false
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: 200, name: '昨天收入' },
              { value: 600, name: '本周收入' },
              { value: 735, name: '本月收入' },
              { value: 580, name: '本季收入' },
              { value: 884, name: '本年收入' },
              { value: 900, name: '累计收入' },
              { value: 300, name: '其他收入' }

            ]
          }
        ]
      };
    }


    onMounted(() => {
      // let $chart = echarts.init(document.getElementById('h-chart1'));
      // $chart.setOption(chart1);
      // let $chart2 = echarts.init(document.getElementById('h-chart2'));
      // $chart2.setOption(chart2);

      let $chart = echarts.init(document.getElementById('h-chart1'));
      $chart.setOption(getChartData());
      let $chart2 = echarts.init(document.getElementById('h-chart2'));
      $chart2.setOption(chartPie());
    });
    return {
      list,
      radioValue
    };
  }
};
</script>
<style lang="less" scoped>
// @import './home/index.less';

.home-content {
  position: absolute;
  height: 100%;
  width: 100%;
  background: #f3f7fb;

  .home-list {
    margin: 12px;
    display: grid;
    -moz-column-gap: 12px;
    column-gap: 12px;
    grid-template-columns: repeat(5, auto);
  }

  .list-item {
    position: relative;
    cursor: pointer;
    margin-bottom: 12px;
    transition: transform 0.8s;

    .content {
      position: relative;
      height: 110px;
      // padding-left: 40px;
      background: #ffffff;
      display: flex;
      align-items: center;
      transition: all 1.5s;
      border-radius: 5px;
      overflow: hidden;

      .content-right {
        color: #1d252f;
        padding: 0 20px;

        .el-icon-warning-outline {
          margin-right: 5px;
        }
      }

      .name {
        transition: transform .5s;
        color: #060606;
        font-size: 16px;
        font-weight: 400;
        padding-bottom: 5px;
      }

      .data {
        font-size: 12px;
        font-family: Source Han Sans CN, sans-serif;
        color: #6f6f6f;
      }
    }

    .mouse-enter-class {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 0;
      height: 40px;
      border-bottom: 3px #0763ee solid;
      transition: 1s;
    }


  }
}

.list-item:hover {

  transform: scale(1.04);

  .content {
    background: #ecf5f9;

    .mouse-enter-class {
      width: 100%;
    }

  }
}


.home-list-content {
  margin: -12px 12px;
  background: #ffff;
  padding: 20px;
  display: flex;
  margin-bottom: 12px;
}

.contact {
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  margin-left: 24px;
  color: #8e8888;

  img {
    height: 15px;
    margin-bottom: -3px;
    margin-right: 5px;
  }
}

.item-strengthen,
.item-new,
.item-other {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 12px;
  padding: 2px 10px;
  background: #daf3ff;
  border-bottom-left-radius: 6px;
  color: #339aed;
  border-top-right-radius: 5px;
}

.item-new {
  background: #ffebe9;
  color: #f94638;
}

.item-other {
  background: #e1fae2;
  color: #2ad431;
}

.chart-line{
  height: 250px; background: white;flex: 1; position: relative;margin-right: 15px;
  background: #fff;
}
.radio-group {
  position: absolute;
    right: 50px;
    top: 0;
    z-index: 999;
    }
</style>
