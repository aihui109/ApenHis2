<template>
	<view class="vol-table" :class="className">
		<!--     自定义显示 -->
		<view v-if="custom">
			<u-list :upperThreshold="-999" v-if="tableHeight" :height="tableHeight" @scrolltolower="scrolltolower">
				<!-- 小程序不支持标签里面调用方法。manifest.json并且要配置	"scopedSlotsCompiler":"legacy",属性 -->
				<!-- 	<view v-for="(row,dataIndex) in rowsData" :key="dataIndex">
					<slot name="row" :row="row" :column="inColumns" :index="dataIndex" :page="page"></slot>
				</view> -->
				<slot name="data" :rows="rowsData" :column="inColumns" :page="page"></slot>
			</u-list>
		</view>
		<!-- 		水平显示 -->
		<view v-else-if="direction=='horizontal'">
			<view class="vol-table-head">
				<view class="cell-index" v-if="index">
					#
				</view>
				<view class="cell-ck vol-table-head-cell" v-if="ck">
					<u-checkbox-group @change="checkAll">
						<u-checkbox :checked="checked" :size="16"></u-checkbox>
					</u-checkbox-group>
					<!-- <u-checkbox v-model="checked" :size="16"></u-checkbox> -->
				</view>
				<view @click="headerClick(column)" class="vol-table-head-cell"
					:class="['vol-table-cell-'+(column.align||'center')]"
					:style="{width:column.width+'px',flex:column.width?'unset':1}" v-if="!column.hidden" :key="index"
					v-for="(column,index) in inColumns">
					{{$ts(column.title)}}
					<text v-if="column.sort" class="cell-order"
						:class="{'acitved-sort':sort==column.field,'acitved-order':order=='asc'}">↑</text>
					<text v-if="column.sort" class="cell-order"
						:class="{'acitved-sort':sort==column.field,'acitved-order':order=='desc'}">↓</text>
				</view>
			</view>
			<view class="vol-table-body">
				<u-empty mode="list" v-if="!rowsData.length&&page>0" text="No data"
					icon="http://cdn.uviewui.com/uview/empty/list.png"></u-empty>
				<u-list :upperThreshold="-999" v-if="tableHeight" :height="tableHeight" @scrolltolower="scrolltolower">
					<view @click="tableRowClick(rowindex,columns)" :key="rowindex" class="vol-table-body-rows"
						v-for="(row,rowindex) in rowsData">
						<view class="cell-index" v-if="index">
							{{rowindex+1}}
						</view>
						<view class="cell-ck vol-table-body-cell" v-if="ck">
							<!-- <u-checkbox v-model="row.ck" :size="16"></u-checkbox> -->

							<u-checkbox-group @change="()=>{ rowItemCheckClick(row,rowindex)}">
								<u-checkbox :checked="row.ck" :size="16"></u-checkbox>
							</u-checkbox-group>
						</view>
						<view :style="{width:column.width+'px',flex:column.width?'unset':1}" :key="cindex"
							class="vol-table-body-cell"
							:class="[textInline?'text-inline':'','vol-table-cell-'+(column.align||'center')]"
							v-if="!column.hidden" v-for="(column,cindex) in columns">
							<view class="vol-cell" @click.stop="cellClick(rowindex,row,column)" v-if="column.click">
								<view :style="column.style" v-if="column.formatter">
									<rich-text :nodes="rowFormatter(row,column,rowindex)+''"></rich-text>
								</view>
								<view :style="column.style" v-else>{{row[column.field]}}</view>
							</view>
							<view class="vol-cell" v-else-if="column.formatter">
								<rich-text :nodes="rowFormatter(row,column,rowindex)+''"></rich-text>
							</view>
							<view class="vol-cell" v-else-if="column.type=='img'">
								<u--image @click="previewImage(row[column.field],index)"
									style="float:left;margin-left:5px;" width="40px" height="40px" radius="4px"
									:src="src" v-for="(src,index) in getImgSrc(row[column.field])" :key="index">
								</u--image>
							</view>
							<view class="vol-cell" v-else-if="column.bind">
								{{rowFormatterValue(row,column)}}
							</view>
							<view v-else-if="column.type=='editor'">
								<u-parse :content="row[column.field]"></u-parse>
							</view>
							<view class="vol-cell" v-else-if="column.type=='date'">
								{{(row[column.field]||'').substr(0,10)}}
							</view>
							<view class="vol-cell" v-else> {{row[column.field]===null?'':row[column.field]}}</view>
						</view>
					</view>
					<slot></slot>
				</u-list>
				<!-- 	显示合计 -->
				<view v-if="hasSummary" :key="rowindex" class="vol-table-body-rows vol-table-summary"
					v-for="(row,rowindex) in summary">

					<view class="cell-index" v-if="index">{{$ts('合计')}}</view>
					<view :style="{width:column.width+'px',flex:column.width?'unset':1}"
						:class="{'text-inline':textInline}" :key="cindex" class="vol-table-body-cell"
						v-if="!column.hidden" v-for="(column,cindex) in columns">
						<view class="vol-cell"> {{base.isEmpty(row[column.field])?'':row[column.field]}}</view>
					</view>
				</view>
			</view>
		</view>
		<!-- 		列表显示 -->
		<view v-else class="vol-table-list">
			<!-- 		{{JSON.stringify(columns)}} -->
			<u-list :upperThreshold="-999" v-if="tableHeight" :height="tableHeight" @scrolltolower="scrolltolower">
				<u-empty mode="list" v-if="!rowsData.length&&page>0" text="No data"
					icon="http://cdn.uviewui.com/uview/empty/list.png">
				</u-empty>
				<view :key="rowindex" v-for="(row,rowindex) in rowsData">
					<view v-if="titleField" class="vol-table-list-item-title">
						<text class="vol-table-list-item-title-border"></text>
						<view class="vol-table-list-item-title-left">
							<rich-text :nodes="getListTitleValue(row,index)+''"></rich-text>
						</view>
						<!-- 	<slot :data="row" name="title"></slot> -->
					</view>
					<view @click="tableRowClick(rowindex,columns)" class="vol-table-list-item">
						<view :key="cindex" class="vol-table-list-item-cell"
							v-if="!column.hidden&&column.field!=titleField&&showColumn(row,column)"
							v-for="(column,cindex) in columns">
							<view class="cell-left" :style="{width:(column.width||90)+'px'}"> {{$ts(column.title)}}
							</view>
							<view class="cell-right">
								<view @click.stop="cellClick(rowindex,row,column)" v-if="column.click">
									<view :style="column.style" v-if="column.formatter">
										<rich-text :nodes="rowFormatter(row,column,rowindex)+''"></rich-text>
									</view>
									<view :style="column.style" v-else>{{row[column.field]}}</view>
								</view>
								<view v-else-if="column.formatter">
									<rich-text :nodes="rowFormatter(row,column)+''"></rich-text>
								</view>
								<view v-else-if="column.type=='editor'">
									<u-parse :content="row[column.field]"></u-parse>
								</view>
								<view v-else-if="column.bind">
									{{rowFormatterValue(row,column)}}
								</view>
								<view style="display: flex;justify-content: flex-end;" v-else-if="column.type=='img'">
									<view @click.stop="previewImage(row[column.field],index)" style="margin-left:10px;"
										width="50px" height="50px" v-for="(src,index) in getImgSrc(row[column.field])">
										<view>
											<u--image width="50px" height="50px" radius="4px" :src="src" :key="index">
											</u--image>
										</view>
									</view>
								</view>
								<view v-else-if="column.type=='date'">
									{{(row[column.field]||'').substr(0,10)}}
								</view>
								<view v-else> {{row[column.field]==null?'':row[column.field]}}</view>
							</view>
						</view>
					</view>
					<view class="extent-button-item" @click.stop>
						<view :key="btnIndex" class="extent-button" v-for="(btn,btnIndex) in rowButtons(rowindex,row)">
							<u-button :icon="btn.icon" :hairline="true" :shape="btn.shape" :disabled="btn.disabled"
								:plain="btn.plain" :type="btn.type" style="height:60rpx;" size="small"
								@click="rowBtnClick(btn,rowindex,row)" :text="btn.text">
							</u-button>
						</view>
					</view>
				</view>
				<slot></slot>
			</u-list>

		</view>

		<u-overlay :opacity="0" :show="showOverlay" @click="showOverlay = false">
			<view class="loading-warp">
				<u-loading-icon text="loading..." textSize="16"></u-loading-icon>

				<!-- 		<view class="loading-warp-msg" @tap.stop>正在加载</view> -->
			</view>
		</u-overlay>
	</view>
</template>

<script>
	export default {
		name: "vol-table",
		props: {
			custom: { //自定义显示table
				type: Boolean,
				default: false
			},
			size: {
				type: Number,
				default: 30 //分页大小
			},
			loadKey: {
				type: Boolean,
				default: true
			},
			direction: {
				type: String,
				default: "list" //"horizontal"//list
			},
			titleField: { //如果direction是以list显示，可以指定第一个标题
				type: String,
				default: ""
			},
			height: {
				type: Number,
				default: 0
			},
			autoHeight: {
				type: Boolean,
				default: true
			},
			textInline: { //超出是否显示省略号
				type: Boolean,
				default: false
			},
			index: { //是否显示行号
				type: Boolean,
				default: false
			},
			ck: { //设置显示checkbox，只有水平(table)显示类型时才生效
				type: Boolean,
				default: false
			},
			columns: {
				type: Array,
				default: () => {
					return []
				}
			},
			url: {
				type: String,
				default: ""
			},
			defaultLoadPage: {
				// 传入了url，是否默认加载表格数据
				type: Boolean,
				default: true,
			},
			tableData: {
				type: Array,
				default: () => {
					return []
				}
			},
			rowClick: null
		},
		data() {
			return {
				checked: false,
				showOverlay: false,
				className: 'vol-table-' + (~~(Math.random() * 1000000)),
				rowsData: [],
				sort: '',
				order: "",
				tableHeight: 0,
				inColumns: [],
				page: 1,
				loaded: false,
				hasSummary: false,
				lastHeight: 0,
				summary: [],
				//extent-button
			};
		},
		methods: {
			scrolltolower() {
				if (!this.url) {
					this.$emit('scrolltolower');
				}
				if (this.loaded) {
					return;
				}
				this.page = this.page + 1;
				this.load()
			},
			load(params, reset) {
				if (!this.url) {
					return
				}
				let status = true;
				if (reset) {
					//this.rowsData.splice(0);
					this.page = 1;
					this.loaded = false;
				}
				let param = {
					page: this.page,
					rows: this.size,
					sort: this.sort,
					order: this.order || "desc",
					wheres: [], // 查询条件，格式为[{ name: "字段", value: "xx" }]
				};
				this.$emit("loadBefore", param, (result) => {
					status = result;
				});

				if (!status) return;
				param.wheres = JSON.stringify(param.wheres);
				this.showOverlay = true;
				this.http.post(this.url, param, false).then(data => {
					this.showOverlay = false;
					this.$emit("loadAfter", data, (result) => {
						status = result;
					});
					if (!status) return;
					if (!data.rows.length || data.rows.length < param.rows) {
						this.loaded = true;
					}
					// for (var i = 0; i < 4; i++) {
					// 	data.rows.push(...JSON.parse(JSON.stringify(data.rows)))
					// }
					//显示合计
					if (data.summary) {
						if (!this.summary.length) {
							let summary = []
							for (let key in data.summary) {
								let obj = {};
								obj[key] = data.summary[key];
								summary.push(obj);
							}
							this.summary = summary;
						} else {
							this.summary.forEach(x => {
								for (let key in data.summary) {
									x[key] = data.summary[key];
								}
							})
						}
					}
					console.log(this.summary)
					if (reset) {
						this.rowsData.splice(0);
					}
					this.rowsData.push(...data.rows);
				})
			},
			tableRowClick(index, columns) {
				if (this.rowClick) {
					this.rowClick(index, this.rowsData[index], columns);
					return;
				}
				this.$emit('rowClick', index, this.rowsData[index], columns);
			},
			rowFormatter(row, column, index) {
				let _val;
				this.$emit('formatter', row, column, index, (val) => {
					_val = val;
				})
				return _val;
			},
			rowFormatterValueList(val, column) {

				let valArr = val.split(",").filter((x) => {
					return x !== "" && x !== undefined;
				});
				for (let index = 0; index < valArr.length; index++) {
					column.bind.data.forEach((x) => {
						if (x.key + "" == valArr[index] + "") {
							valArr[index] = this.$ts(x.value);
						}
					});
				}
				return valArr.join(",");
			},
			rowFormatterValue(row, column) {
				if (this.base.isEmpty(row[column.field])) {
					return '';
				}
				let _val = row[column.field] + '';

				if (!column.bind.data.length) {
					return _val;
				}
				if (column.type == "selectList" || column.type == 'checkbox') {
					return this.rowFormatterValueList(_val, column)
				}
				let _obj = column.bind.data.find(x => {
					return x.key + '' == _val
				});
				if (_obj) {
					return this.$ts(_obj.value);
				}
				return this.$ts(_val);
			},
			getListTitleValue(row, index) {

				let column = this.inColumns.find(x => {
					return x.field == this.titleField
				});
				if (column.formatter) {
					return this.rowFormatter(row, column, index)
				}

				if (column.bind) {
					return this.rowFormatterValue(row, column)
				}
				if (column.type == 'date') {
					return (row[this.titleField] || '--').substr(0, 10);
				}
				return row[this.titleField] || '--'
			},
			headerClick(column) {
				if (this.sort == column.field) {
					this.order = this.order == 'desc' ? 'asc' : 'desc'
				} else {
					this.sort = column.field;
					this.order = 'desc'
				}

			},
			getData() {
				if (!this.url) {
					//this.rowsData.push(...this.tableData)
					return
				}
				if (!this.defaultLoadPage) {
					return
				};
				this.load();
			},
			getImgSrc(imgs) {
				if (this.base.isEmpty(imgs)) {
					return []
				}
				if (imgs.indexOf('base64,') != -1) {
					return [imgs];
				}
				if (Array.isArray(imgs)) {
					if (!imgs.length) {
						return []
					}
					if (imgs[0].orginUrl) {
						return [this.http.ipAddress + imgs[0].orginUrl]
					}
					return [imgs[0].url];
				}
				let _imgs = imgs.split(',').map(x => {
					if (x.startsWith('http')) {
						return x;
					}
					return this.http.ipAddress + x
				});
				return _imgs;
			},
			loadSource() {
				let dicKeys = this.inColumns.filter(x => {
					return x.bind && x.bind.key && !x.bind.data.length
				}).map(m => {
					return m.bind.key
				});
				if (!dicKeys.length) {
					return
				}
				this.http.post('api/Sys_Dictionary/GetVueDictionary', dicKeys, true).then(result => {
					result.forEach(item => {
						this.inColumns.forEach(x => {
							if (x.bind && x.bind.key && !x.bind.data.length && x.bind.key == item
								.dicNo) {
								x.bind.data = item.data;
							}
						})
					})

				})
			},
			cellClick(rowIndex, row, column) {
				this.$emit('cellClick', rowIndex, row, column)
			},
			rowButtons(index, row) {
				let _buttons = [];
				this.$emit('rowButtons', index, row, (buttons) => {
					_buttons = buttons;
				})
				console.log(_buttons)
				return (_buttons || []) //.reverse();
			},
			rowBtnClick(btn, rowindex, row) {
				this.$emit('rowButtonClick', btn, rowindex, row);
			},
			previewImage(urls, index) {
				uni.previewImage({
					current: index,
					urls: this.getImgSrc(urls),
					longPressActions: {}
				});
			},
			initSummary() {
				if (this.summary.length) {
					this.hasSummary = true;
					return;
				}
				this.summary = this.columns.filter(x => {
					return x.summary
				}).map(x => {
					let obj = {};
					obj[x.field] = 0;
					return obj;
				})
				this.hasSummary = this.summary.length > 0
			},
			caclHeaderHeight() {
				if (this.direction == 'list') {
					return;
				}
				console.log('555')
				var view = uni.createSelectorQuery().in(this).select(".vol-table-head");
				view.boundingClientRect().exec(res => {
					if (this.lastHeight > 0 && this.lastHeight == this.tableHeight) {
						return;
					}
					this.tableHeight = this.tableHeight - (res[0] || {
						height: 0
					}).height;
					this.lastHeight = this.tableHeight;
				})
			},
			checkAll() {
				this.checked = !this.checked;
				this.rowsData.forEach(x => {
					this.$set(x, 'ck', this.checked);
				})
			},
			getSelectRows() {
				return this.rowsData.filter(x => {
					return x.ck
				});
			},
			rowItemCheckClick(row, index) {
				console.log('rowItemCheckClick')
				// #ifdef MP-WEIXIN
				this.tableData[index].ck = !row.ck;
				// #endif
				this.$set(row, 'ck', !row.ck);
			},
			showColumn(row, column) {
				if (!column.showColumn) {
					return true;
				}
				return column.showColumn(row, column);
			}
		},
		created() {
			this.initSummary();
			this.getData();
			this.inColumns = this.columns;
			if (this.loadKey) {
				this.loadSource();
			}
			this.tableHeight = this.height;

		},
		mounted() {
			if (this.autoHeight && this.height <= 0) {
				uni.getSystemInfo({
					success: (resu) => {
						var view = uni.createSelectorQuery().in(this).select(".vol-table");
						view.boundingClientRect().exec(res => {
							this.tableHeight = resu.windowHeight - res[0].top;
							if (this.hasSummary) {
								this.tableHeight = this.tableHeight - 49;
							}
							this.caclHeaderHeight()
						})
					}
				})
			} else {
				this.caclHeaderHeight()
			}
		},
		watch: {
			height(newVal) {
				console.log(newVal)
				if (newVal <= 0) {
					return;
				}
				this.tableHeight = newVal;
				this.caclHeaderHeight();
			},
			// #ifdef MP-WEIXIN
			inColumns: {
				handler(newValue, oldValue) {
					if (newValue && newValue.length) {
						this.$emit('update:columns', newValue)
						this.initSummary();
					}
				},
				immediate: true,
				deep: true
			},
			columns: {
				handler(newValue, oldValue) {
					this.inColumns = newValue;
				},
				immediate: true,
				deep: true
			},
			// #endif
			tableData: {
				handler(newValue, oldValue) {
					this.rowsData = newValue;
				},
				immediate: true,
				deep: true
			}
		},

	}
</script>

<style lang="less" scoped>
	.vol-table-head {
		padding: 0 8rpx;
		display: flex;
		background: #f3f3f3;
		align-items: center;
		text-align: center;
		font-weight: bold;

		.vol-table-head-cell {
			padding: 18rpx 6rpx;
			flex: 1;
			width: 0;
			font-size: 26rpx;

			.cell-order {
				color: #abadb1;
			}

			.acitved-sort.acitved-order {
				color: #4097f8;
			}
		}
	}

	.cell-ck {
		width: 52rpx !important;
		flex: none !important;
		padding: 0 8rpx;
		min-height: 55rpx;
		display: flex;
		justify-content: center;
	}


	.vol-table-body-rows {
		display: flex;
		padding: 0 8rpx;
		align-items: center;

		.vol-table-body-cell {
			word-break: break-all;
			padding: 0 6rpx;
			text-align: center;
			flex: 1;
			width: 0;
			font-size: 24rpx;
			color: #484848;

			.vol-cell {
				padding: 30rpx 0rpx;
			}
		}

		.text-inline {
			.vol-cell {
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}
	}

	.vol-table-cell-left {
		text-align: left !important;
	}

	.vol-table-summary {
		bottom: 0;
		width: 100%;
		background: #f3f3f3 !important;
		z-index: 999;
		position: absolute;
		font-weight: bold;
	}

	.vol-table-body-rows:nth-child(even) {
		background: #f9f9f9;
		border-top: 1px solid #f3f3f3;
		border-bottom: 1px solid #f3f3f3;
	}

	.cell-index {
		width: 30px;
		padding: 28rpx 6rpx;
		font-size: 26rpx;
		text-align: center;
		color: #6a6a6a;
	}
</style>

<style scoped lang="less">
	.vol-table-list {
		padding: 14rpx 0;
		background: #f9f9f9;
	}

	.vol-table-list-item-title {
		text-align: left;
		margin: 18rpx 0 14rpx 22rpx;
		font-size: 28rpx;
		line-height: 30rpx;
		padding-left: 10rpx;
		display: flex;
		justify-content: center;
		align-items: center;

		.vol-table-list-item-title-left {
			flex: 1;
			font-size: 28rpx;
			// font-weight: bold;
		}

		.vol-table-list-item-title-border {
			display: inline-block;
			background: #818181;
			padding: 7px 2px;
			border-radius: 4px;
			margin-right: 5px;
		}

	}

	.vol-table-list-item {
		margin: 8rpx 16rpx;
		background: #FFFFFF;
		box-shadow: 1px 1px 14px rgb(224 224 224);
		border: 1px solid #f3f3f3;
		border-radius: 10rpx;

		.vol-table-list-item-cell {
			display: flex;
			padding: 20rpx 28rpx;
			border-bottom: 1px solid #f9f9f9ee;
			font-size: 26rpx;

			.cell-left {
				border-radius: 5px;
				width: 180rpx;
				color: #5c5c5c;
			}

			.cell-right {
				flex: 1;
				width: 0;
				text-align: right;
			}
		}
	}

	.extent-button-item {
		display: flex;
		justify-content: flex-end;
		margin: 0rpx 16rpx;
		// padding: 10rpx;
		top: -10rpx;
		position: relative;
		background: #ffff;
	}

	.extent-button {
		padding: 10rpx 10rpx;
		// display: inline-block;
		// float: right;
		// min-width: 20%;
		// margin-right: 20rpx;
		// margin-bottom: 20rpx;
	}

	.loading-warp {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;

		.loading-warp-msg {
			min-width: 120px;
			height: 40px;
			justify-content: center;
			background-color: #414141;
			align-items: center;
			text-align: center;
			line-height: 40px;
			border-radius: 5px;
			color: #fff;
		}
	}
</style>