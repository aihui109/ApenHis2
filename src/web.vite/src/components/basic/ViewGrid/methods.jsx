import detailMethods from './detailMethods.js'
//业务处理方法,全部可以由开发覆盖
import serviceFilter from './serviceFilter.js'
import debounce from '../VolDebounce/index.js'
let methods = {
  //当添加扩展组件gridHeader/gridBody/gridFooter及明细modelHeader/modelBody/modelFooter时，
  //如果要获取父级Vue对象,请使用此方法进行回调
  parentCall(fun) {
    if (typeof fun != 'function') {
      return console.log('扩展组件需要传入一个回调方法才能获取父级Vue对象')
    }
    fun(this)
  },
  getCurrentAction() {
    if (this.currentReadonly) {
      return ''
    }
    return '(' + this.$ts(this.currentAction == this.const.ADD ? '新增' : '编辑') + ')'
  },
  quickSearchKeyPress($event) {
    //查询字段为input时，按回车查询
    if ($event.keyCode == 13) {
      //if (this.searchFormFields[this.singleSearch.field] != '') {
      this.search()
      //}
    }
  },
  getButtons() {
    //生成ViewGrid界面的操作按钮及更多选项
    let searchIndex = this.buttons.findIndex((x) => {
      return x.value == 'Search'
    })
    //添加高级查询
    let hasOneFormItem = this.searchFormOptions.length == 1 && this.searchFormOptions[0].length == 1
    if (searchIndex != -1 && !hasOneFormItem) {
      this.buttons.splice(searchIndex + 1, 0, {
        icon: this.fiexdSearchForm ? 'el-icon-refresh-left' : 'el-icon-search',
        name: this.fiexdSearchForm ? '重置' : '高级查询',
        plain: true,
        type: this.buttons[searchIndex].type,
        onClick: () => {
          if (this.fiexdSearchForm) {
            return this.resetSearch()
          }
          this.searchBoxShow = !this.searchBoxShow
        }
      })
    }
    if (hasOneFormItem) {
      this.fiexdSearchForm = false
    }
    this.maxBtnLength += searchIndex == -1 ? 0 : 1
    // if (this.buttons.length <= this.maxBtnLength) {
    //   return this.buttons;
    // }
    // let btns = this.buttons.slice(0, this.maxBtnLength);
    // btns[this.maxBtnLength - 1].last = true;
    // return btns;
  },
  extendBtn(btns, source) {
    //btns权限按钮，source为扩展按钮
    if (!btns || !(source && source instanceof Array)) {
      return
    }
    //source通过在表的扩展js文件中buttons对应按钮的属性index决定按钮所放位置
    source.forEach((x) => {
      //通过按钮的Index属性，放到指定的位置
      btns.splice(x.index == undefined ? btns.length : x.index, 0, x)
    })
    // if (this.extend.buttons.view) {
    //     this.extend.buttons.view.forEach((x) => {
    //         //通过按钮的Index属性，放到指定的位置
    //         this.buttons.splice(x.index == undefined ? this.buttons.length : x.index, 0, x);
    //     })
    // }
  },
  initDetailAuthFields() {
    try {
      if (!this.detail.columns || !this.detail.columns.length) {
        return
      }
      let _auth = (this.$store.getters.data().authFields || []).find((c) => {
        return c.name == this.detail.table
      })
      if (!_auth || !_auth.fields.length) {
        return
      }
      this.detail.columns.forEach((col) => {
        if (!col.hidden) {
          col.hidden = _auth.fields.indexOf(col.field) == -1
        }
      })
    } catch (error) {
      console.log(error)
    }
  },
  initAuthFields() {
    let arr = this.table.name.split('/')
    let tableName = arr[arr.length - 1]
    let _auth = (this.$store.getters.data().authFields || []).find((c) => {
      return c.name == tableName
    })
    this.initDetailAuthFields()
    if (!_auth || !_auth.fields.length) {
      return
    }
    if (!this.hiddenFields) {
      this.hiddenFields = []
    }
    this.columns.forEach((col) => {
      if (!col.hidden) {
        col.hidden = _auth.fields.indexOf(col.field) == -1
      }
    })

    this.editFormOptions.forEach((options) => {
      options.forEach((op) => {
        op.hidden = _auth.fields.indexOf(op.field) == -1
        if (op.hidden) {
          this.hiddenFields.push(op.field)
        }
      })
    })

    this.searchFormOptions.forEach((options) => {
      options.forEach((op) => {
        op.hidden = _auth.fields.indexOf(op.field) == -1
      })
    })
  },
  initImportOptions() {
    this.upload.url = this.getUrl(this.const.IMPORT)
    //定义下载模板的文件名
    this.upload.template.fileName = this.table.cnName
    //定义下载模板的Url路径
    this.upload.template.url = this.http.ipAddress + this.getUrl(this.const.DOWNLOADTEMPLATE, true)
  },
  initBoxButtons() {
    this.initAuthFields()
    //初始化ViewGird与弹出框/明细表按钮
    let path = this.$route.path
    //通过菜单获取用户所对应菜单需要显示的按钮
    let permissionButtons = this.permission.getButtons(
      path,
      null,
      this.extend.tableAction,
      this.table.name
    )
    if (permissionButtons) {
      //2020.03.31添加深拷贝按钮组
      permissionButtons.forEach((p) => {
        let _obj = {}
        for (const key in p) {
          _obj[key] = p[key]
        }
        this.buttons.push(_obj)
      })
      // this.buttons.push(...permissionButtons);
    }
    if (!this.extend) {
      this.extend = {}
    }
    if (!this.extend.buttons) {
      this.extend.buttons = {}
    }
    //查询界面扩展按钮(扩展按钮可自行通过设置按钮的Index属性显示到具体位置)
    if (this.extend.buttons.view) {
      this.extendBtn(this.buttons, this.extend.buttons.view)
    }

    //弹出框按钮
    let boxButtons = []

    let saveBtn = this.buttons.some((x) => {
      if (
        x.value &&
        (x.value.toLowerCase() == this.const.ADD.toLowerCase() ||
          x.value.toLowerCase() == this.const.EDIT.toLowerCase())
      )
        return true
    })
    this.currentReadonly = !saveBtn
    //从表表格操作按钮
    let detailGridButtons = {
      name: '刷新',
      type: 'info',
      icon: 'el-icon-refresh',
      onClick() {
        //如果明细表当前的状态为新建时，禁止刷新
        if (this.currentAction == this.const.ADD) {
          return
        }
        this.refreshRow()
      }
    }

    if (this.details) {
      this.isMultiple = this.details.length > 0
      if (this.isMultiple) {
        this.details.forEach((item) => {
          if (item.columnIndex === undefined) {
            item.columnIndex = false
            item.columns.forEach((col) => {
              if (col.link) {
                col.link = false
              }
            })
          }
        })
      }
    }

    let importExcel = this.buttons.some((x) => {
      if (x.value == this.const.IMPORT) return true
    })
    //如果有导入权限,则需要初始化导入组件
    if (importExcel) {
      this.initImportOptions()
    }

    // disabled
    //如果当前角色没有编辑或新建功能，查看明细时字段设置全部只读
    //只有明细表，将明细表也设置为不可能编辑，并且不显示添加行、删除行
    if (!saveBtn) {
      this.editFormOptions.forEach((row) => {
        row.forEach((x) => {
          x.disabled = true
        })
      })
      //没有新增编辑权限的，弹出框都设置为只读
      if (this.detail.columns) {
        this.detail.columns.forEach((column) => {
          if (column.hasOwnProperty('edit')) {
            column.readonly = true
            // row['edit'] = false;
          }
        })
      }
      //弹出框扩展按钮
      this.extendBtn(boxButtons, this.extend.buttons.box)
      //弹出弹框按钮(2020.04.21),没有编辑或新建权限时，也可以通过buttons属性添加自定义弹出框按钮
      this.boxButtons.push(...boxButtons)
      this.detailOptions.buttons.push(detailGridButtons)
      this.detailOptions.buttons.forEach((button) => {
        if (!button.hasOwnProperty('hidden')) {
          button.hidden = false
        }
      })

      //弹出框扩展明细表按钮
      this.extendBtn(this.detailOptions.buttons, this.extend.buttons.detail)
      this.initMultipleTables(false)
      return boxButtons
    }

    this.detailOptions.edit = true
    boxButtons.push(
      ...[
        {
          name: '保存',
          icon: 'el-icon-check',
          type: 'danger',
          disabled: false,
          value: 'save',
          onClick() {
            this.save()
          }
        }
        // {
        //   name: '重 置',
        //   icon: 'el-icon-refresh-right',
        //   type: 'primary',
        //   disabled: false,
        //   onClick() {
        //     this.resetEdit();
        //   }
        // }
      ]
    )

    //从表表格操作按钮
    this.detailOptions.buttons.push(
      ...[
        {
          name: '添加行',
          icon: 'el-icon-plus',
          type: 'primary',
          hidden: false,
          plain: true,
          onClick() {
            this.addRow()
          }
        },
        {
          type: 'danger',
          plain: true,
          name: '删除行',
          hidden: false,
          icon: 'el-icon-delete',
          onClick() {
            this.delRow()
          }
        },
        //2022.01.08增加明细表导入导出功能
        //注意需要重写后台明细表接口的导入与下载模板、导出的权限,Sys_DictionaryListController.cs/SellOrderListController.cs
        {
          type: 'danger',
          plain: true,
          name: '导入',
          value: 'import',
          hidden: false,
          icon: 'el-icon-upload2',
          onClick() {
            this.upload.url = `${this.http.ipAddress}api/${this.detail.table}/${this.const.IMPORT}?table=1`
            this.upload.template.url = `${this.http.ipAddress}api/${this.detail.table}/${this.const.DOWNLOADTEMPLATE}`
            //定义下载模板的文件名
            this.upload.template.fileName = this.detail.cnName
            this.upload.excel = true
          }
        },
        {
          type: 'danger',
          plain: true,
          name: '导出',
          value: 'export',
          icon: 'el-icon-download',
          hidden: false,
          onClick() {
            this.export(true)
          }
        }
      ]
    )
    this.detailOptions.buttons.forEach((button) => {
      if (button.hasOwnProperty('hidden')) {
        button.hidden = false
      }
    })
    //弹出框扩展按钮
    this.extendBtn(boxButtons, this.extend.buttons.box)

    //弹出框扩展明细表按钮
    this.detailOptions.buttons.push(detailGridButtons)
    this.extendBtn(this.detailOptions.buttons, this.extend.buttons.detail)

    //弹出弹框按钮
    this.boxButtons.push(...boxButtons)

    this.initMultipleTables(true)
  },
  initMultipleTables(hasBtn) {
    if (this.isMultiple) {
      this.initMultipleButtons(hasBtn)
      this.initSubDetailButtons(hasBtn)
    }
  },
  //二级明细按钮
  initMultipleButtons(hasBtn) {
    this.details.forEach((item) => {
      if (item.columns) {
        item.pagination = { total: 0, size: 100, sortName: item.sortName }
        if (hasBtn) {
          item.buttons.push(
            {
              name: '添加行',
              icon: 'el-icon-plus',
              type: 'primary',
              hidden: false,
              plain: true,
              onClick: (table, item, index) => {
                this.addSecondRow(table, item, index)
              }
            },
            {
              type: 'danger',
              plain: true,
              name: '删除行',
              hidden: false,
              icon: 'el-icon-delete',
              onClick: (table, item, index) => {
                this.delRow(table, item, index)
              }
            }
          )
        } else {
          item.columns.forEach((x) => {
            x.readonly = true
          })
        }
      }
    })
  },
  //三级明细按钮
  initSubDetailButtons(hasBtn) {
    //2023.09.17
    //有三级明细时，设置二级明细只能单选,固定明细表高度为200px

    this.details.forEach((item) => {
      if (item.detail) {
        //固定明细表高度
        this.detailOptions.height = 200
        item.detail.height = 200
        this.detailHeight = 220
        item.single = true
        item.detail.columnIndex = false
        this.subDetails.push(item.detail)
      }
    })

    this.subDetails.forEach((item) => {
      if (item.columns) {
        item.pagination = { total: 0, size: 100, sortName: '' }
        if (hasBtn) {
          item.buttons.push(
            {
              name: '添加行',
              icon: 'el-icon-plus',
              type: 'primary',
              hidden: false,
              plain: true,
              onClick: (table, item, index) => {
                this.addSubRow(table, item, index)
              }
            },
            {
              type: 'danger',
              plain: true,
              name: '删除行',
              hidden: false,
              icon: 'el-icon-delete',
              onClick: (table, item, index) => {
                this.delSubRow(table, item, index)
              }
            }
          )
        } else {
          item.columns.forEach((x) => {
            x.readonly = true
          })
        }
      }
    })
  },
  onClick(click) {
    debounce(() => {
      click.apply(this)
    }, 300)
  },
  changeDropdown(btnName, v1) {
    let button = this.buttons.filter((x) => {
      return x.name == btnName
    })
    if (button && button.length > 0) {
      button[0].onClick.apply(this)
    }
  },
  emptyValue(value) {
    if (typeof value == 'string' && value.trim() === '') {
      return true
    }
    if (value instanceof Array && !value.length) {
      return true
    }
    return value === null || value === undefined || value === ''
  },
  getSearchParameters() {
    //获取查询参数
    // 2020.09.11增加固定查询表单,如果设置固定了查询表单，点击查询时，不再关闭
    if (!this.fiexdSearchForm) {
      this.searchBoxShow = false
    }

    let query = { wheres: [] }
    for (const key in this.searchFormFields) {
      let value = this.searchFormFields[key]
      if (this.emptyValue(value)) continue

      if (typeof value == 'number') {
        value = value + ''
      }
      let displayType = this.getSearchItem(key)

      //联级只保留选中节点的最后一个值
      if (displayType == 'cascader') {
        //查询下面所有的子节点，如：选中的是父节点，应该查询下面所有的节点数据--待完
        value = value.length ? value[value.length - 1] + '' : ''
      } else if (displayType == 'treeSelect' && Array.isArray(value)) {
        displayType = 'selectList'
        value = (value || []).join(',')
      }
      //2021.05.02增加区间查询
      if (
        typeof value == 'string' ||
        ['date', 'datetime', 'month', 'range'].indexOf(displayType) == -1
      ) {
        query.wheres.push({
          name: key,
          value: typeof value == 'string' ? (value + '').trim() : value.join(','),
          displayType: displayType
        })
        continue
      }
      for (let index = 0; index < value.length; index++) {
        if (!this.emptyValue(value[index])) {
          query.wheres.push({
            name: key,
            value: (value[index] + '').trim(),
            displayType: (() => {
              if (['date', 'datetime', 'month', 'range'].indexOf(displayType) != -1) {
                return index ? 'lessorequal' : 'thanorequal'
              }
              return displayType
            })()
          })
        }
      }
    }
    return query
  },
  search() {
    //查询
    // let query = this.getSearchParameters();
    // this.$refs.table.load(query, true);
    this.$refs.table.load(null, true)
  },
  loadTableBefore(param, callBack) {
    //查询前设置查询条件及分页信息
    let query = this.getSearchParameters()
    if (query) {
      param = Object.assign(param, query)
    }

    if (this.$route.query.viewflow && this.$route.query.id) {
      param.wheres.push({
        name: this.table.key,
        value: this.$route.query.id
      })
    }
    // if (this.isViewFlow() && data && data.length) {
    //   let query = JSON.parse(JSON.stringify(this.$route.query));
    //   query.viewflow = 0;
    //   this.$router.replace({ path: this.$route.path, query: query });
    //   this.$nextTick(() => {
    //     this.getWorkFlowSteps(data[0]);
    //   });
    // }
    let status = this.searchBefore(param)
    callBack(status)
  },

  loadTableAfter(data, callBack, result) {
    //查询后
    //2020.10.30增加查询后返回所有的查询信息
    let status = this.searchAfter(data, result)
    callBack(status)
    //自动弹出框审批详情
  },

  getSearchItem(field) {
    //获取查询的参数
    let data
    for (let index = 0; index < this.searchFormOptions.length; index++) {
      if (data) return data.type
      const item = this.searchFormOptions[index]
      data = item.find((x) => {
        return x.field == field
      })
    }

    return (data || {}).type
  },
  resetSearch() {
    //重置查询对象
    this.resetSearchForm()
    //2020.10.17增加重置后方法
    this.resetSearchFormAfter && this.resetSearchFormAfter()
  },
  resetEdit() {
    //重置编辑的数据
    let isEdit = this.currentAction != this.const.ADD
    //重置之前
    if (!this[isEdit ? 'resetUpdateFormBefore' : 'resetAddFormBefore']()) {
      return
    }
    let objKey = {}
    //编辑状态下,不需要重置主键,创建时间创建人
    if (isEdit) {
      objKey[this.table.key] = this.editFormFields[this.table.key]
    }
    this.resetEditForm(objKey)
    //重置之后

    if (!this[isEdit ? 'resetUpdateFormAfter' : 'resetAddFormAfter']()) {
      return
    }
  },
  resetSearchForm(sourceObj) {
    //重置查询表
    this.resetForm('searchForm', sourceObj)
  },
  resetEditForm(sourceObj) {
    if (this.hasDetail && this.$refs.detail) {
      // this.$refs.detail.rowData.splice(0);
      this.$refs.detail.reset()
    }
    this.resetForm('form', sourceObj)
    if (this.$refs.form && this.$refs.form.$refs.volform) {
      setTimeout(() => {
        this.$refs.form.$refs.volform.clearValidate()
      }, 100)
    }
  },
  getKeyValueType(formData, isEditForm) {
    try {
      let keyLeft = (isEditForm ? 'e' : 's') + '_b_'
      formData.forEach((item) => {
        item.forEach((x) => {
          if (this.keyValueType.hasOwnProperty(keyLeft + x.field)) {
            return true
          }
          let data
          if (x.type == 'switch') {
            this.keyValueType[x.field] = 1
          } else if (x.bind && x.bind.data) {
            data = x.bind.data
          } else if (x.data) {
            if (x.data instanceof Array) {
              data = x.data
            } else if (x.data.data && x.data.data instanceof Array) {
              data = x.data.data
            }
          }
          if (data && data.length > 0 && !this.keyValueType.hasOwnProperty(x.field)) {
            this.keyValueType[x.field] = data[0].key
            this.keyValueType[keyLeft + x.field] = x.type
          }
        })
      })
    } catch (error) {
      console.log(error.message)
    }
  },
  resetForm(formName, sourceObj) {
    //   return;
    //重置表单数据
    if (this.$refs[formName]) {
      this.$refs[formName].reset()
    }

    if (!sourceObj) return
    let form, keyLeft
    if (formName == 'searchForm') {
      form = this.searchFormFields
      keyLeft = 's' + '_b_'
    } else {
      form = this.editFormFields
      keyLeft = 'e' + '_b_'
    }
    //获取数据源的data类型，否则如果数据源data的key是数字，重置的值是字符串就无法绑定值
    if (!this.keyValueType._dinit) {
      this.getKeyValueType(this.editFormOptions, true)
      this.getKeyValueType(this.searchFormOptions, false)
      this.keyValueType._dinit = true
    }
    var _cascaderParentTree
    for (const key in form) {
      if (sourceObj.hasOwnProperty(key)) {
        let newVal = sourceObj[key]
        let kv_type = this.keyValueType[keyLeft + key]

        if (
          kv_type == 'selectList' ||
          kv_type == 'checkbox' ||
          kv_type == 'cascader' ||
          kv_type == 'treeSelect'
        ) {
          // 2020.05.31增加iview组件Cascader
          // 2020.11.01增加iview组件Cascader表单重置时查询所有的父节点
          if (kv_type == 'cascader' || kv_type == 'treeSelect') {
            var treeDic = this.dicKeys.find((dic) => {
              return dic.fileds && dic.fileds.indexOf(key) != -1
            })

            if (treeDic && treeDic.orginData && treeDic.orginData.length) {
              let keyIsNum = typeof treeDic.orginData[0].id == 'number'

              if (kv_type == 'cascader') {
                newVal = keyIsNum ? newVal * 1 || 0 : newVal + ''
                if (kv_type == 'cascader') {
                  _cascaderParentTree = this.base.getTreeAllParent(newVal, treeDic.orginData)
                  if (_cascaderParentTree) {
                    newVal = _cascaderParentTree.map((x) => {
                      return x.id
                    })
                  }
                }
              } else {
                if (newVal === null || newVal === undefined) {
                  newVal = []
                } else if (typeof newVal == 'string') {
                  newVal = newVal.split(',')
                }
                if (keyIsNum) {
                  if (Array.isArray(newVal)) {
                    newVal = newVal.map((x) => {
                      return x * 1 || 0
                    })
                  } else {
                    newVal = [newVal]
                  }
                } else if (typeof newVal == 'number') {
                  newVal = [newVal + '']
                }
                if (!this.getFormOption(key).multiple) {
                  if (newVal.length) {
                    newVal = newVal[0]
                  } else {
                    newVal = null
                  }
                }
              }
            } else {
              newVal = [newVal]
            }
          } else if (typeof newVal == 'number') {
            newVal = [newVal + '']
            this.$message.error(`多选时数据库字段[${key}]必须是字符串类型`)
          } else if (newVal != '' && newVal != undefined && typeof newVal == 'string') {
            newVal = newVal.split(',')
          } else {
            //if (kv_type == 'checkbox') {
            newVal = []
          }
        } else if (
          this.keyValueType.hasOwnProperty(key) &&
          typeof this.keyValueType[key] == 'number' &&
          newVal * 1 == newVal
        ) {
          newVal = newVal * 1
        } else {
          if (newVal == null || newVal == undefined) {
            newVal = ''
          } else if (this.numberFields.indexOf(key) != -1) {
            newVal = newVal * 1 || 0
          } else {
            newVal += ''
          }
        }
        if (newVal instanceof Array) {
          if (form[key]) {
            form[key] = []
          }
          form[key] = newVal
        } else {
          form[key] = newVal
        }
      } else {
        form[key] = form[key] instanceof Array ? [] : ''
      }
    }
  },
  onBtnClick(param) {
    this[param.method](param.data)
  },
  refresh() {
    //刷新
    this.search()
    // this.$refs.table.load();
  },
  saveBefore(formData) {
    return true
  },
  saveAfter(formData, result) {
    return true
  },
  save() {
    //新增或编辑时保存
    // if (!this.$refs.form.validate()) return;
    this.$refs.form.validate((result) => {
      if (result) {
        this.saveExecute()
      }
    })
  },
  convertDetailSubmitData(detailData, columns) {
    // formData.detailData = this.$refs.detail.rowData;
    const types = ['selectList', 'cascader', 'treeSelect']
    let _fields = columns
      .filter((c) => {
        return types.indexOf(c.type) != -1 || types.indexOf(c.edit && c.edit.type) != -1
      })
      .map((c) => {
        return c.field
      })
    //2022.06.20增加保存时对明细表下拉框多选的判断
    if (_fields.length) {
      detailData = JSON.parse(JSON.stringify(detailData))
      detailData.forEach((row) => {
        for (let index = 0; index < _fields.length; index++) {
          const _field = _fields[index]
          if (Array.isArray(row[_field])) {
            row[_field] = row[_field].join(',')
          }
        }
      })
    }
    return detailData
  },
  async saveExecute() {
    let editFormFields = {}

    //上传文件以逗号隔开
    for (const key in this.editFormFields) {
      if (
        this.uploadfiled &&
        this.uploadfiled.length > 0 &&
        this.uploadfiled.indexOf(key) != -1 &&
        this.editFormFields[key] instanceof Array
      ) {
        let allPath = this.editFormFields[key].map((x) => {
          return x.path
        })
        editFormFields[key] = allPath.join(',')
      } else if (typeof this.editFormFields[key] == 'function') {
        try {
          editFormFields[key] = this.editFormFields[key]()
        } catch (error) {}
      } else {
        //2021.05.30修复下拉框清除数据后后台不能保存的问题
        if (
          this.editFormFields[key] === undefined &&
          this.dicKeys.some((x) => {
            return x.fileds && x.fileds.indexOf(key) != -1
          })
        ) {
          editFormFields[key] = null
        } else {
          editFormFields[key] = this.editFormFields[key]
        }
      }
    }
    //将数组转换成string
    //2020.11.01增加级联处理
    for (const key in editFormFields) {
      if (editFormFields[key] instanceof Array) {
        var iscascader = this.dicKeys.some((x) => {
          return (
            x.type == 'cascader' &&
            x.e_type != 'treeSelect' &&
            x.fileds &&
            x.fileds.indexOf(key) != -1
          )
        })
        if (iscascader && editFormFields[key].length) {
          editFormFields[key] = editFormFields[key][editFormFields[key].length - 1]
        } else {
          editFormFields[key] = editFormFields[key].join(',')
        }
      }
    }
    //屏蔽没有权限的字段
    if (this.currentAction != 'Add' && this.hiddenFields && this.hiddenFields.length) {
      for (const key in editFormFields) {
        if (this.hiddenFields.indexOf(key) != -1) {
          editFormFields[key] = undefined
        }
      }
    }

    let formData = {
      mainData: editFormFields,
      detailData: null,
      delKeys: null
    }

    //获取明细数据(前台数据明细未做校验，待完.后台已经校验)
    let details
    if (this.hasDetail) {
      formData.detailData = this.$refs.detail.rowData
      formData.detailData = this.convertDetailSubmitData(formData.detailData, this.detail.columns)
    } else if (this.isMultiple) {
      //一对多明细
      details = this.details.map((c) => {
        if (c.columns) {
          let itemDetail = {
            table: c.table,
            delKeys: c.delKeys,
            data: this.convertDetailSubmitData(this.getTable(c.table).rowData, c.columns)
          }

          itemDetail.data = this.$refs.details.getDiffRows(
            c.table,
            c.key,
            itemDetail.data,
            c.detail
          )
          return itemDetail
        }
        return {
          table: c.table,
          delKeys: c.delKeys,
          data: []
        }
      })
      formData.details = details
    }

    if (this.detailOptions.delKeys.length > 0) {
      formData.delKeys = this.detailOptions.delKeys
    }

    //记录三级明细删除信息
    if (this.subDetails && this.subDetails.length) {
      formData.subDelInfo = this.subDetails.map((x) => {
        return { table: x.table, delKeys: x.delKeys }
      })
    }

    //保存前拦截
    let _currentIsAdd = this.currentAction == this.const.ADD
    if (_currentIsAdd) {
      //2020.12.06增加新建前异步处理方法
      //2021.08.16修复异步语法写错的问题
      if (!this.addBefore(formData) || !(await this.addBeforeAsync(formData))) return
    } else {
      //2020.12.06增加修改前异步处理方法
      if (!this.updateBefore(formData) || !(await this.updateBeforeAsync(formData))) return
    }
    let url = this.getUrl(this.currentAction)

    // console.log(JSON.stringify(formData))
    // return;

    this.http.post(url, formData, true).then((x) => {
      //保存后
      if (_currentIsAdd) {
        if (!this.addAfter(x)) return
        //连续添加
        if (this.continueAdd && x.status) {
          this.$success(x.message)
          //新建
          this.currentAction = this.const.ADD
          //2023.07.23增加连续添加后方法
          let _formFields
          if (this.continueAddAfter) {
            _formFields = JSON.parse(JSON.stringify(this.editFormFields))
          }
          this.currentRow = {}
          this.resetAdd()
          this.refresh()
          //2023.07.23增加连续添加后方法
          this.continueAddAfter && this.continueAddAfter(_formFields, formData, x)
          return
        }
      } else {
        if (!this.updateAfter(x)) return
      }
      if (!x.status) return this.$error(x.message)
      this.$success(x.message || '操作成功')
      //如果保存成功后需要关闭编辑框，直接返回不处理后面
      if (this.boxOptions.saveClose) {
        this.boxModel = false
        //2020.12.27如果是编辑保存后不重置分页页数，刷新页面时还是显示当前页的数据
        // if (this.isMultiple) {
        //   this.resetDetailTable(resultRow.data)
        // }else{
        this.$refs.table.load(null, _currentIsAdd)
        // }

        //this.refresh();
        return
      }
      let resultRow
      if (typeof x.data == 'string' && x.data != '') {
        resultRow = JSON.parse(x.data)
      } else {
        resultRow = x.data
      }

      if (this.currentAction == this.const.ADD) {
        //  this.currentRow=x.data;
        this.editFormFields[this.table.key] = ''
        this.currentAction = this.const.EDIT
        this.currentRow = resultRow.data
      }
      this.resetEditForm(resultRow.data)
      // console.log(resultRow);
      if (this.hasDetail) {
        this.detailOptions.delKeys = []
        if (resultRow.list) {
          this.$refs.detail.rowData.push(...resultRow.list)
        }
      }
      this.$refs.table.load(null, _currentIsAdd)
      // this.refresh();
    })
  },
  del(rows) {
    if (rows) {
      if (!(rows instanceof Array)) {
        rows = [rows]
      }
    } else {
      rows = this.$refs.table.getSelected()
    }
    //删除数据

    if (!rows || rows.length == 0) return this.$error(this.$ts('请选择要删除的行!'))
    let delKeys = rows.map((x) => {
      return x[this.table.key]
    })
    if (!delKeys || delKeys.length == 0) return this.$error(this.$ts('没有获取要删除的行数据!'))
    //删除前
    if (!this.delBefore(delKeys, rows)) {
      return
    }
    let tigger = false
    this.$confirm(this.$ts('确认要删除选择的数据吗?'), this.$ts('警告'), {
      confirmButtonText: this.$ts('确定'),
      cancelButtonText: this.$ts('取消'),
      type: 'warning',
      center: true
    }).then(() => {
      if (tigger) return
      tigger = true
      let url = this.getUrl(this.const.DEL)
      this.http.post(url, delKeys, this.$ts('正在删除数据') + '....').then((x) => {
        if (!x.status) return this.$error(x.message)
        this.$success(x.message)
        //删除后
        if (!this.delAfter(x)) {
          return
        }
        this.refresh()
      })
    })
  },
  async modelOpenBeforeAsync(row) {
    return true
  },
  async initBox() {
    let value = (this.currentRow || {})[this.table.key] || ''
    if (this.newTabEdit) {
      this.$tabs.open({
        text:
          this.$ts(this.table.cnName) + '(' + (value ? this.$ts('编辑') : this.$ts('新建')) + ')',
        path: `${this.table.url}edit`,
        query: { id: value } //, audit: isAudit ? 1 : '' }
      })
      return
    }

    //2022.01.08增加新建时隐藏明细表导出功能
    this.detailOptions.buttons.forEach((x) => {
      if (x.value == 'export') {
        x.hidden = this.currentAction == 'Add'
      }
    })
    //初始化新建、编辑的弹出框
    if (!(await this.modelOpenBeforeAsync(this.currentRow))) return false
    this.modelOpenBefore(this.currentRow)
    if (!this.boxInit) {
      this.boxInit = true
      this.boxModel = true
      // this.detailUrl = this.url;
    }
    return true
  },
  setEditForm(row) {
    // if (this.remoteColumns.length == 0 || !rows || rows.length == 0) return;
    let remoteColumns = this.$refs.table.remoteColumns
    remoteColumns.forEach((column) => {
      this.editFormOptions.forEach((option) => {
        option.forEach((x) => {
          if (x.field == column.field) {
            x.data.data = Object.assign([], x.data, column.bind.data)
          }
        })
      })
    })
    this.editFormFields
    //重置编辑表单数据
    this.editFormFields[this.table.key] = row[this.table.key]

    this.resetEditForm(row)
    this.currentAction = this.const.EDIT
    this.boxModel = true
  },
  async linkData(row, column) {
    this.boxOptions.title = this.$ts(this.table.cnName) + '(' + this.$ts('编辑') + ')'
    //点击table单元格快捷链接显示编辑数据
    this.currentAction = this.const.EDIT
    this.currentRow = row
    if (!(await this.initBox())) return
    this.resetDetailTable(row)
    this.setEditForm(row)
    this.setContinueAdd(false)
    //设置远程查询表单的默认key/value
    this.getRemoteFormDefaultKeyValue()
    //点击编辑按钮弹出框后，可以在此处写逻辑，如，从后台获取数据
    this.modelOpenProcess(row)
  },
  setContinueAdd(isAdd) {
    if (!this.continueAdd) return
    var _button = this.boxButtons.find((x) => {
      return x.value == 'save'
    })
    if (_button) {
      _button.name = isAdd ? this.continueAddName : '保存'
    }
  },
  resetAdd() {
    if (this.hasDetail) {
      this.$refs.detail &&
        //  this.$refs.detail.rowData &&
        this.$refs.detail.reset()
    }
    if (this.isMultiple) {
      //重置一对多
      this.resetDetailTable(null, true)
    }
    //如果有switch标签，默认都设置为否
    this.resetEditForm({})
    this.editFormOptions.forEach((x) => {
      x.forEach((item) => {
        if (item.type == 'switch') {
          this.editFormFields[item.field] = 0
        } else if (item.type == 'decimal' || item.type == 'number') {
          this.editFormFields[item.field] = null
        }
      })
    })
  },
  async add() {
    if (this.table.editTable) {
      this.editTableAddRow(-1)
      return
    }
    this.boxOptions.title = this.$ts(this.table.cnName) + '(' + this.$ts('新建') + ')'
    //新建
    this.currentAction = this.const.ADD
    this.currentRow = {}
    if (!(await this.initBox())) return

    this.resetAdd()
    this.setContinueAdd(true)
    //  this.resetEditForm();
    this.boxModel = true
    //点击新建按钮弹出框后，可以在此处写逻辑，如，从后台获取数据
    this.modelOpenProcess()
    // this.modelOpenAfter();
  },
  async edit(rows) {
    this.boxOptions.title = this.$ts('编辑')
    //编辑
    this.currentAction = this.const.EDIT
    if (rows) {
      if (!(rows instanceof Array)) {
        rows = [rows]
      }
    } else {
      rows = this.$refs.table.getSelected()
    }
    if (rows.length == 0) {
      return this.$error(this.$ts('请选择要编辑的行!'))
    }
    if (rows.length != 1) {
      return this.$error(this.$ts('只能选择一行数据进行编辑!'))
    }
    //记录当前编辑的行
    this.currentRow = rows[0]
    //初始化弹出框
    if (!(await this.initBox())) return
    this.setContinueAdd(false)
    //重置表单
    this.resetDetailTable()

    //设置当前的数据到表单上
    this.setEditForm(rows[0])
    //设置远程查询表单的默认key/value
    this.getRemoteFormDefaultKeyValue()
    //点击编辑按钮弹出框后，可以在此处写逻辑，如，从后台获取数据
    this.modelOpenProcess(rows[0])
    // this.modelOpenAfter(rows[0]);
  },
  getRemoteFormDefaultKeyValue() {
    //设置表单远程数据源的默认key.value
    if (this.currentAction != this.const.EDIT || this.remoteKeys.length == 0) return
    this.editFormOptions.forEach((x, xIndex) => {
      x.forEach((item, yIndex) => {
        if (item.remote) {
          let column = this.columns.find((x) => {
            return x.bind && x.bind.key == item.dataKey
          })
          if (!column) return
          let key = this.currentRow[item.field]
          let obj = column.bind.data.find((x) => {
            return x.key == key
          })
          // obj ? obj.value : key如果没有查到数据源，直接使用原数据
          item.data = [{ key: key, value: obj ? obj.value : key }]
          this.editFormOptions[xIndex].splice(yIndex, 1, item)
          // this.$set(item, 'data', [{ key: key + '', value: obj.value }])
          //  item.data = [{ key: key + '', value: obj.value }];
        }
      })
    })
  },
  modelOpenProcess(row) {
    this.$nextTick(() => {
      this.modelOpenAfter(row)
    })
    return
    // if (!this.$refs.form) {
    //     let timeOut = setTimeout(x => {
    //         this.modelOpenAfter(row);
    //     }, 500)
    //     return;
    // }
    // this.modelOpenAfter(row);
  },
  import() {
    //导入(上传excel),弹出导入组件UploadExcel.vue
    if (!this.upload.url) {
      this.initImportOptions()
    }

    this.upload.excel = true
    this.$refs.upload_excel && this.$refs.upload_excel.reset()
  },
  download(url, fileName) {
    //下载导出的文件
    let xmlResquest = new XMLHttpRequest()
    xmlResquest.open('GET', url, true)
    xmlResquest.setRequestHeader('Content-type', 'application/json')
    xmlResquest.setRequestHeader('Authorization', this.$store.getters.getToken())
    let elink = this.$refs.export
    xmlResquest.responseType = 'blob'
    xmlResquest.onload = function (oEvent) {
      if (xmlResquest.status != 200) {
        this.$error('下载文件出错了..')
        return
      }
      let content = xmlResquest.response
      //  let elink = this.$refs.export;//document.createElement("a");
      elink.download = fileName //+".xlsx";
      // elink.style.display = "none";
      let blob = new Blob([content])
      elink.href = URL.createObjectURL(blob)
      //  document.body.appendChild(elink);
      elink.click()
      //  document.body.removeChild(elink);
    }
    xmlResquest.send()
  },
  getFileName(isDetail) {
    if (isDetail) {
      return this.$ts(this.detail.cnName) + '.xlsx'
    }
    return this.$ts(this.table.cnName) + '.xlsx'
  },
  export(isDetail) {
    //导出
    let url, query, param
    if (isDetail) {
      //明细表导出时如果是新建状态，禁止导出
      if (this.currentAction == 'Add') {
        return
      }
      url = `api/${this.detail.table}/${this.const.EXPORT}`
      param = {
        wheres: [{ name: this.table.key, value: this.editFormFields[this.table.key] }]
      }
    } else {
      //主表导出
      url = this.getUrl(this.const.EXPORT)
      query = this.getSearchParameters()
      param = {
        order: this.$refs.table.paginations.order,
        sort: this.$refs.table.paginations.sort,
        wheres: query.wheres || []
      }
      if (
        !param.wheres.some((x) => {
          return x.name == this.table.key
        })
      ) {
        let ids = this.getSelectRows()
          .map((x) => {
            return x[this.table.key]
          })
          .join(',')
        //2024.01.13增加默认导出勾选的数据
        if (ids) {
          param.wheres.push({
            name: this.table.key,
            value: ids,
            displayType: 'selectList'
          })
        }
      }
      //2024.02.03增加导出列表与界面显示字段一致
      let _columns = []
      this.columns.forEach((col) => {
        if (!col.hidden && !col.render) {
          if (col.children) {
            _columns.push(
              ...col.children
                .filter((c) => {
                  return !c.hidden
                })
                .map((m) => {
                  return m.field
                })
            )
          } else {
            _columns.push(col.field)
          }
        }
      })
      if (_columns.length) {
        param.columns = _columns
      }
    }
    //2020.06.25增加导出前处理
    if (!isDetail && !this.exportBefore(param)) {
      return
    }

    if (param.wheres && typeof param.wheres == 'object') {
      param.wheres = JSON.stringify(param.wheres)
    }

    //2022.09.26增加自定义导出文件名
    let fileName = this.downloadFileName || this.getFileName(isDetail)
    //2021.01.08优化导出功能
    this.http.post(url, param, 'loading....', { responseType: 'blob' }).then((content) => {
      if (this.exportAfter && !this.exportAfter(content)) {
        return
      }
      const blob = new Blob([content])
      if ('download' in document.createElement('a')) {
        // 非IE下载
        const elink = document.createElement('a')
        elink.download = fileName
        elink.style.display = 'none'
        elink.href = URL.createObjectURL(blob)
        document.body.appendChild(elink)
        elink.click()
        URL.revokeObjectURL(elink.href)
        document.body.removeChild(elink)
      } else {
        // IE10+下载
        navigator.msSaveBlob(blob, fileName)
      }
    })
  },
  getSelectRows() {
    //获取选中的行
    return this.$refs.table.getSelected()
  },
  getDetailSelectRows() {
    //或获取明细选中的行
    if (!this.$refs.detail) {
      return []
    }
    return this.$refs.detail.getSelected()
  },
  async auditModelOpenBefore(rows) {
    return true
  },
  async audit(rows, isAnti, view) {
    if (rows) {
      if (!Array.isArray(rows)) {
        rows = [rows]
      }
    } else {
      //审核弹出框
      rows = this.$refs.table.getSelected()
    }
    if (rows.length == 0) return this.$error(this.$ts('请选择要审核的行!'))
    let auditStatus = Object.keys(rows[0]).find((x) => {
      return x.toLowerCase() === 'auditstatus'
    })

    if (!auditStatus) {
      return this.$message.error(this.$ts(`表必须包括审核字段【AuditStatus】,并且是int类型`))
    }

    if (!(await this.auditModelOpenBefore(rows))) {
      return;
    }

    if (isAnti) {
      if (rows.length > 1) {
        return this.$error(this.$ts('只能选择一行数据反审!'))
      }
      let status = rows[0][auditStatus]
      if (!status || status == 90 || status == 100) {
        return this.$error(this.$ts('只能选择已审核数据!'))
      }
    }
    // let checkStatus = rows.every((x) => {
    //   return this.$global.audit.status.some(c => { return c === x[auditStatus] || !x[auditStatus] })
    // });
    // if (!checkStatus) return this.$error('只能选择待审批或审核中的数据!');
    this.$refs.audit.open(rows, null, this.getAuditTable(), isAnti, view)
  },
  antiAudit(rows) {
    //反审
    this.audit(rows, true)
  },
  getAuditTable() {
    //2023.11.10增加获取指定审批流程的表名
    return ''
  },
  saveAudit(params, rows, callback) {
    //保存审核
    let keys = rows.map((x) => {
      return x[this.table.key]
    })
    if (!this.auditBefore(keys, rows)) {
      return
    }
    let url = `${this.getUrl(this.const.AUDIT)}?auditReason=${params.reason}&auditStatus=${
      params.value
    }`
    this.http.post(url, keys, 'loading....').then((x) => {
      if (!this.auditAfter(x, keys)) {
        return
      }
      if (!x.status) return this.$error(x.message)

      callback && callback(x)
      this.$success(x.message)
      this.refresh()
    })
  },
  viewModelCancel() {
    //查看表结构
    this.viewModel = false
  },
  initFormOptions(formOptions, keys, formFields, isEdit) {
    //初始化查询、编辑对象的下拉框数据源、图片上传链接地址
    //let defaultOption = { key: "", value: "请选择" };
    //有上传的字段
    //2020.05.03新增
    //编辑数据源的类型
    formOptions.forEach((item) => {
      item.forEach((d) => {
        if (d.type == 'number') {
          //2022.08.22优化表单类型为number时的默认值
          if (formFields[d.field] === '') {
            formFields[d.field] = undefined
          }
          this.numberFields.push(d.field)
        }
        if (d.type == 'img' || d.type == 'excel' || d.type == 'file' || d.columnType == 'img') {
          d.url = this.http.ipAddress + 'api' + this.table.url + 'Upload'
          this.uploadfiled.push(d.field)
        }
        if (!d.dataKey) return true
        //2022.02.20强制开启联级可以选择某个节点
        if (d.type == 'cascader' && !d.hasOwnProperty('changeOnSelect')) {
          //强制开启联级可以选择某个节点
          d.changeOnSelect = true
        }
        //开启远程搜索
        if (d.remote) {
          this.remoteKeys.push(d.dataKey)
          d.data = [] //{ dicNo: d.dataKey, data: [] };
          return true
        }
        //2020.05.03增加编辑表单对checkbox的支持
        if (d.type == 'checkbox' && !(formFields[d.field] instanceof Array)) {
          formFields[d.field] = []
        }
        if (keys.indexOf(d.dataKey) == -1) {
          //2020.05.03增加记录编辑字段的数据源类型

          keys.push(d.dataKey)
          //2020.05.03修复查询表单与编辑表单type类型变成强一致性的问题
          //this.dicKeys.push({ dicNo: d.dataKey, data: [], type: d.type });
          //  2020.11.01增加iview组件Cascader数据源存储
          let _dic = {
            dicNo: d.dataKey,
            data: [],
            fileds: [d.field],
            orginData: [],
            type:d.type
          }
          if (d.type == 'cascader') {
            _dic.type = 'cascader'
          }
          if (isEdit) {
            _dic['e_type'] = d.type
          }
          this.dicKeys.push(_dic)
        } else if (d.type == 'cascader') {
          this.dicKeys.forEach((x) => {
            if (x.dicNo == d.dataKey) {
              x.type = 'cascader'
              x.fileds.push(d.field)
            }
          })
        }
        if (d.type != 'cascader') {
          //2020.01.30移除内部表单formOptions数据源配置格式data.data，所有参数改为与组件api格式相同
          Object.assign(
            d,
            this.dicKeys.filter((f) => {
              return f.dicNo == d.dataKey
            })[0],
            { type: d.type }
          )
        }
      })
    })
  },
  //初始table与明细表的数据源指向dicKeys对象，再去后台加载数据源
  initColumns(scoure, dicKeys, keys) {
    if (!scoure || !(scoure instanceof Array)) return
    scoure.forEach((item) => {
      if (!item.bind || (item.bind.data && item.bind.data.length > 0)) return true
      let key = item.bind.key || item.bind.dicNo
      if (this.remoteKeys.indexOf(key) != -1) {
        item.bind.remote = true
        return true
      }
      if (this.hasKeyField.indexOf(item.field) == -1) {
        this.hasKeyField.push(item.field)
      }
      var dic = dicKeys.filter((x) => {
        return x.dicNo == key
      })
      if (!dic || dic.length == 0) {
        dicKeys.push({ dicNo: key, data: [] })
        dic = [dicKeys[dicKeys.length - 1]]
        keys.push(key)
      }
      //2020.11.01增加级联处理
      if (dic[0].type == 'cascader' || dic[0].type == 'treeSelect') {
        item.bind = { data: dic[0].orginData, type: 'select', key: key }
      } else {
        item.bind = dic[0]
      }
      //2020.05.03优化table数据源checkbox与select类型从编辑列中选取
      item.bind.type = item.bind.e_type || 'string'
    })
  },
  bindOptions(dic) {
    //绑定下拉框的数据源
    //绑定后台的字典数据
    dic.forEach((d) => {
      if (d.data.length >= (this.select2Count || 500)) {
        if (
          !this.dicKeys.some((x) => {
            return x.dicNo == d.dicNo && (x.type == 'cascader' || x.type == 'treeSelect')
          })
        ) {
          d.data.forEach((item) => {
            item.label = item.value
            item.value = item.key
          })
        }
      }
      this.dicKeys.forEach((x) => {
        if (x.dicNo != d.dicNo) return true;
        
        //2020.10.26增加级联数据源绑定处理
        if (x.type == 'cascader' || x.type == 'treeSelect') {
          // x.data=d.data;
          //生成tree结构
          let _data = JSON.parse(JSON.stringify(d.data))
          //2022.04.04增加级联字典数据源刷新后table没有变化的问题
          this.columns.forEach((column) => {
            if (column.bind && column.bind.key == d.dicNo) {
              column.bind.data = d.data
            }
          })
          let arr = this.base.convertTree(_data, (node, data, isRoot) => {
            if (!node.inited) {
              node.inited = true
              node.label = node.value
              node.value = node.key
            }
          })
          x.data.push(...arr)
          x.orginData.push(...d.data)
          //2021.10.17修复查询级联不能绑定数据源的问题
          this.searchFormOptions.forEach((searhcOption) => {
            searhcOption.forEach((_option) => {
              if (_option.type == 'cascader' && _option.dataKey == x.dicNo) {
                _option.data = arr
                _option.orginData = d.data
              }
            })
          })
          //2021.10.17修复级联不能二级刷新的问题
          this.editFormOptions.forEach((editOption) => {
            editOption.forEach((_option) => {
              if (
                (_option.type == 'cascader' || _option.type == 'treeSelect') &&
                _option.dataKey == x.dicNo
              ) {
                _option.data = arr
                _option.orginData = d.data
              }
            })
          })
        } else if (d.data.length > 0 && !d.data[0].hasOwnProperty('key')) {
          let source = d.data,
            newSource = new Array(source.length)
          for (let index = 0; index < source.length; index++) {
            newSource[index] = {
              //默认从字典数据读出来的key都是string类型,但如果数据从sql中查询的可能为非string,否是async-validator需要重置设置格式
              key: source['key'] + '', //source[index][x.config.valueField] + "",
              value: source['value'] //source[index][x.config.textField]
            }
          }

          x.data.push(...newSource)
        } else {
          //2020.06.06，如果是selectList数据源使用的自定义sql并且key是数字，强制转换成字符串
          if (x.e_type == 'selectList' && d.data.length > 0 && typeof d.data[0].key == 'number') {
            d.data.forEach((c) => {
              c.key = c.key + ''
            })
          }
          x.data.push(...d.data)
        }
        if (
          this.singleSearch &&
          this.singleSearch.dataKey &&
          this.singleSearch.dataKey == x.dicNo
        ) {
          this.singleSearch.data.splice(0, 1, ...x.data)
        }
      })
    })
  },
  getUrl(action, ingorPrefix) {
    //是否忽略前缀/  获取操作的url
    return (!ingorPrefix ? '/' : '') + 'api' + this.table.url + action
  },
  initDicKeys() {
    //初始化字典数据
    let keys = []
    //2022.04.17优化重新加载数据源
    this.dicKeys.forEach((item) => {
      item.data.splice(0)
      item.orginData && item.orginData.splice(0)
    })
    //this.dicKeys.splice(0);
    //初始化编辑数据源,默认为一个空数组，如果要求必填设置type=number/decimal的最小值
    this.initFormOptions(this.editFormOptions, keys, this.editFormFields, true)
    //初始化查询数据源,默认为一个空数组
    this.initFormOptions(this.searchFormOptions, keys, this.searchFormFields, false)
    //查询日期设置为可选开始与结果日期
    this.searchFormOptions.forEach((item) => {
      item.forEach((x) => {
        if (x.type == 'date' || x.type == 'datetime' || x.type == 'month') x.range = true
      })
    })
    //初始化datatable表数据源,默认为一个空数组,dicKeys为界面所有的数据字典编号
    this.initColumns(this.columns, this.dicKeys, keys)
    //2021.05.23默认开启查询页面所有字段排序,如果不需要排序，在onInited遍历columns设置sort=false
    //2021.09.25移除强制排序功能
    // this.columns.forEach(x => {
    //   x.sort = x.render ? false : true;
    // })
    if (this.detailOptions && this.detailOptions.columns) {
      // this.initColumns(this.detailOptions.columns, this.dicKeys, keys);
    }
    //初始化快速查询字段,默认使用代码生成器配置的第一个查询字段
    if (this.searchFormOptions.length > 0) {
      this.singleSearch = {
        dataKey: this.searchFormOptions[0][0].dataKey,
        dicNo: this.searchFormOptions[0][0].dicNo,
        field: this.searchFormOptions[0][0].field,
        title: this.searchFormOptions[0][0].title,
        type: this.searchFormOptions[0][0].type,
        data: []
      }
      // this.singleSearch = this.searchFormOptions[0][0];
    }
    if (keys.length == 0) return
    let $this = this
    this.http.post('/api/Sys_Dictionary/GetVueDictionary', keys).then((dic) => {
      $this.bindOptions(dic)
      //2022.04.04增加字典加载完成方法
      $this.dicInited && $this.dicInited(dic)
    })
  },
  setFiexdColumn(columns, containerWidth) {
    //计算整个table的宽度，根据宽度决定是否启用第一行显示的列为固定列
    //2021.09.21移除强制固定第一列
    // let columnsWidth = 0;
    // columns.forEach(x => {
    //   if (!x.hidden && x.width) {
    //     columnsWidth += x.width;
    //   }
    // });
    // //启用第一列为固定列
    // if (columnsWidth > containerWidth) {
    //   let firstColumn = columns.find(x => !x.hidden);
    //   if (firstColumn) {
    //     firstColumn.fixed = true;
    //   }
    // }
  },
  initBoxHeightWidth() {
    //初始化弹出框的高度与宽度
    let clientHeight = document.documentElement.clientHeight
    //弹出框高度至少250px
    clientHeight = clientHeight < 250 ? 250 : clientHeight
    let clientWidth = document.documentElement.clientWidth
    if (clientWidth > 2000) {
      clientWidth = 2000
    }

    if (
      this.editFormOptions.some((x) => {
        return x.some((item) => {
          return item.type == 'editor'
        })
      })
    ) {
      this.editor.uploadImgUrl = this.getUrl('upload')
      this.boxOptions.height = clientHeight * 0.8
      this.boxOptions.width = clientWidth * 0.8
    } else {
      if (this.boxOptions.height) {
        //如果高度与宽度超过了获取到的可见高宽度，则设为默认的90%高宽
        if (this.boxOptions.height > clientHeight * 0.8) {
          this.boxOptions.height = clientHeight * 0.8
        }
      }
      if (this.boxOptions.width) {
        //如果高度与宽度超过了获取到的可见高宽度，则设为默认的90%高宽
        if (this.boxOptions.width > clientWidth * 0.8) {
          this.boxOptions.width = clientWidth * 0.8
        }
      }
    }
    //计算整个table的宽度，根据宽度决定是否启用第一行显示的列为固定列
    let maxTableWidth = clientWidth - 270
    this.setFiexdColumn(this.columns, maxTableWidth)

    this.height = this.tableHeight || clientHeight - 206
    this.url = this.getUrl(this.const.PAGE)
    //计算弹出框的高与宽度
    //如果有明细表，高度与宽带设置为0.9/0.82
    if (this.detail.columns && this.detail.columns.length > 0) {
      this.hasDetail = true
      clientWidth = clientWidth * 0.8
      clientHeight = clientHeight * 0.85
      if (!this.detailOptions.height) {
        this.detailOptions.height = clientHeight - this.editFormOptions.length * 36 - 234
        this.detailOptions.height =
          this.detailOptions.height < 240 ? 240 : this.detailOptions.height
      }

      this.detailOptions.columns = this.detail.columns
      this.detailOptions.pagination.sortName = this.detail.sortName
      this.detailOptions.cnName = this.detail.cnName
      this.detailOptions.key = this.detail.key
      this.detailOptions.url = this.getUrl('getDetailPage')
      //计算弹出框整个table的宽度，根据宽度决定是否启用第一行显示的列为固定列
      this.setFiexdColumn(this.detail.columns, clientWidth)
    } else {
      let maxColumns = 1 //最大列数，根据列计算弹框的宽度
      this.editFormOptions.forEach((x) => {
        if (x.length > maxColumns) maxColumns = x.length
      })
      let maxHeightRate = 0.7,
        maxWidthRate = 0.5
      maxWidthRate = maxColumns / 10 + 0.3
      maxHeightRate = (this.editFormOptions.length || 1) * 0.1 + 0.03
      maxHeightRate = maxHeightRate > 0.9 ? 0.9 : maxHeightRate
      clientWidth = clientWidth * maxWidthRate
      clientHeight = clientHeight * maxHeightRate
      // this.boxOptions.width = clientWidth * maxWidthRate;
      // this.boxOptions.height = clientHeight * maxHeightRate;
    }
    if (!this.boxOptions.height) {
      this.boxOptions.height = clientHeight + 10
    }

    let hasSubDetails
    if (!this.boxOptions.width) {
      if (this.details && this.details.length) {
        hasSubDetails = true
        this.boxOptions.width = clientWidth + clientWidth * 0.25
      } else {
        this.boxOptions.width = clientWidth + 30
      }
    }
    if (this.paginationHide) {
      this.height = this.height + 37
    }
  },
  rowOnChange(row) {
    this.rowChange(row)
  },
  rowChange(row) {
    //选中行checkbox行事件
  },
  selectionOnChange(rows) {
    this.selectionChange(rows)
  },
  selectionChange(rows) {
    //选中行checkbox行事件
  },
  rowOnClick({ row, column, event }) {
    this.rowClick({ row, column, event })
  },
  rowClick({ row, column, event }) {
    // 点击行事件(2020.11.07)
  },
  rowOnDbClick({ row, column, event }) {
    this.rowDbClick({ row, column, event })
  },
  rowDbClick({ row, column, event }) {
    // 双击击行事件(2021.05.23)
  },
  $error(message) {
    this.$message.error(message)
    // this.$message({
    //   type: 'error',
    //   content: message,
    //   duration: 5
    // });
  },
  $success(message) {
    this.$message.success(message)
  },
  setFiexdSearchForm(visiable) {
    //2020.09.011增加固定查询表单功能,visiable=true默认将查询表单展开
    this.fiexdSearchForm = true
    let refreshBtn = this.buttons.find((x) => x.name == '刷新')
    if (visiable) {
      this.searchBoxShow = true
    }
    if (refreshBtn) {
      refreshBtn.name = '重置'
      refreshBtn.onClick = function () {
        this.resetSearch()
      }
    }
  },
  tableBeginEdit(row, column, index) {
    //2021.03.19是否开启查询界面表格双击编辑结束方法,返回false不会结束编辑
    return this.beginEdit(row, column, index)
  },
  beginEdit(row, column, index) {
    //2021.03.19是否开启查询界面表格双击编辑结束方法,返回false不会结束编辑
    return true
  },
  tableEndEditBefore(row, column, index) {
    return this.endEditBefore(row, column, index)
  },
  endEditBefore(row, column, index) {
    //2021.03.19是否开启查询界面表格双击编辑结束方法,返回false不会结束编辑
    return true
  },
  filterPermission(tableName, permission) {
    //2021.03.19判断是否有某个表的按钮权限
    //:["Search","Add","Delete","Update","Import","Export","Upload","Audit"]
    const _result = (this.$store.state.permission || []).find((x) => {
      return x.url == '/' + tableName
    })
    return _result && _result.permission.some((x) => x == permission)
  },
  destroyed() {
    //2021.04.11增加vue页面销毁方法,路由必须设置keepLive:false，设置方法见：前端开发文档-》[禁用页面缓存keepAlive]
  },
  loadTreeTableChildren(tree, treeNode, resolve) {
    this.loadTreeChildren.call(this, tree, treeNode, resolve)
  },
  loadTreeChildren(tree, treeNode, resolve) {
    //树形结构加载子节点(2021.05.02),在onInit中设置了rowKey主键字段后才会生效
    return resolve([])
  },
  importDetailAfter(data) {
    //2022.01.08增加明细表导入后处理
  },
  importExcelAfter(data) {
    //2022.01.08增加明细表导入后方法判断

    if (!data.status) {
      return // this.$message.error(data.message);
    }
    if (data.data && typeof data.data == 'string') {
      data.data = JSON.parse(data.data)
    }
    let b = this.importAfter(data)
    if (b === false) {
      return
    }
    //明细表导入
    if (this.boxModel) {
      if (data.data) {
        data.data = JSON.parse(data.data)
      } else {
        data.data = []
      }
      data.data.forEach((x) => {
        x[this.detail.key] = undefined
        x[this.table.key] = undefined
      })
      this.importDetailAfter(data) //增加明细表导入后处理
      this.$refs.detail.rowData.unshift(...data.data)
      this.upload.excel = false
      return
    }
  },
  onGridModelClose(iconClick) {
    if (this.isBoxAudit) {
      this.initFormOptionType(false)
    }
    this.isBoxAudit = false
    this.onModelClose(iconClick)
  },
  initAuditColumn() {
    if (
      !this.columns.some((x) => {
        return x.field.toLowerCase() === 'auditstatus'
      })
    ) {
      return
    }
    //2024.04.19
    let hasAduit = this.buttons.some((x) => {
      return x.value == 'Audit'
    })
    this.columns.push({
      title: '流程', //按钮名称
      field: 'audit_view',
      fixed: 'right',
      width: 90,
      align: 'center',
      render: (h, { row, column, index }) => {
        return (
          <div>
            <el-button
              onClick={($e) => {
                $e.stopPropagation()
                this.audit([row], false, true)
              }}
              text
              size="small"
              type="primary"
              plain
            >
              {this.$ts('查看流程')}
              {/* icon={hasAduit?'Check':'Document'} */}
              {/* {this.$ts(hasAduit ? '流程审批' : '查看流程')} */}
            </el-button>
          </div>
        )
      }
    })
  },
  getWorkFlowSteps(row) {
    let table = this.table.url.replaceAll('/', '')
    let url = `api/Sys_WorkFlow/getSteps?tableName=${table}&id=${row[this.table.key]}`
    this.http.get(url, {}, true).then((result) => {
      this.workFlowSteps.splice(0)
      //有可能没有配置审批流程
      if (!result.list || !result.list.length) {
        result.list = []
        this.auditParam.showAction = true
        this.auditParam.height = 240
        this.auditParam.showViewButton = row.AuditStatus == 0
      } else {
        this.auditParam.showAction = result.list.some((c) => {
          return c.isCurrentUser
        })
        this.auditParam.height = 511
        this.auditParam.showViewButton = true
      }
      this.auditParam.reason = ''
      this.auditParam.status = -1
      this.auditParam.value = -1
      if (result.his) {
        result.his.forEach((item) => {
          item.auditStatus = this.getAuditStatus(item.auditStatus)
        })
      }

      this.auditParam.auditHis = result.his
      this.workFlowSteps.push(...result.list)
      this.isBoxAudit = true
      this.initFormOptionType(true)
      this.edit(row)
      this.boxOptions.title = this.$ts('审核')
    })
  },
  initFormOptionType(isReadonly) {
    this.editFormOptions.forEach((options) => {
      options.forEach((option) => {
        if (isReadonly) {
          if (!option.readonly) {
            this.formFieldsType.push(option.field)
            option.readonly = true
          }
        } else {
          if (this.formFieldsType.indexOf(option.field) != -1) {
            option.readonly = false
          }
        }
      })
    })
  },
  getAuditStatus(status) {
    let data = this.auditParam.data.find((x) => {
      return x.value == status
    })
    if (!data) {
      return '-'
      //   return `审核值不正确:${status}`
    }
    return data.text
  },
  initFlowQuery() {
    let _key = 'wk:add'

    if (sessionStorage.getItem(_key) == this.table.url.replaceAll('/', '')) {
      sessionStorage.setItem(_key, '')
      this.add()
      return
    }
    if (this.$route.query.viewflow) {
      this.$refs.table && this.search()
    }
  },
  fullscreen(full) {
    //弹出框全屏方法
  },
  getFormOption(field) {
    if (!field) {
      return null
    }
    for (let index = 0; index < this.editFormOptions.length; index++) {
      const _options = this.editFormOptions[index]
      const obj = _options.find((c) => {
        return c.field == field
      })
      if (obj) {
        return obj
      }
    }
  },
  setFormReadonly(readonly) {
    this.editFormOptions.forEach((x) => {
      x.forEach((ops) => {
        ops.readonly = !!readonly
      })
    })
  },
  editTableAddRow(index) {
    if (!this.tableAddRowBefore()) {
      return
    }
    this.$refs.table.rowData.splice(index + 1, 0, this.getDefaultRow())
    setTimeout(() => {
      this.$refs.table.edit.rowIndex = index + 1
    }, 50)
  },
  tableAddRowBefore() {
    return true
  },
  getDefaultRow(index) {
    //2024.03.01增加行内编辑添加行默认方法
    return {}
  },
  editTableDelRow(row, index) {
    if (!row[this.table.key]) {
      this.$refs.table.rowData.splice(index, 1)
      this.$refs.table.edit.rowIndex = -1
      return
    }
    this.del(row)
  },
  async editTableSave(row) {
    let mainData = {}
    Object.keys(row).forEach((key) => {
      let _val = row[key]
      if (Array.isArray(_val)) {
        if (_val.some((c) => c.path)) {
          _val = _val.map((c) => c.path).join(',')
        } else {
          _val = _val.join(',')
        }
      }
      mainData[key] = _val
    })
    const params = {
      mainData: mainData
    }
    const isUpdate = !!row[this.table.key]
    let url = this.getUrl(isUpdate ? 'update' : 'add')
    if (!isUpdate) {
      if (!this.addBefore(params, row) || !(await this.addBeforeAsync(params, row))) {
        return
      }
    } else {
      //2020.12.06增加修改前异步处理方法
      if (!this.updateBefore(params, row) || !(await this.updateBeforeAsync(params, row))) {
        return
      }
    }

    let tigger = false
    this.$confirm(this.$ts('确认要保存数据吗?'), this.$ts('提示'), {
      confirmButtonText: this.$ts('确定'),
      cancelButtonText: this.$ts('取消'),
      type: 'warning',
      center: true
    }).then(async () => {
      if (tigger) return
      tigger = true

      this.http.post(url, params, this.$ts('正在处理') + '....').then((x) => {
        if (!x.status) return this.$error(x.message)
        if (isUpdate) {
          if (!this.updateAfter(x, params, row)) {
            return
          }
        } else {
          if (!this.addAfter(x, params, row)) {
            return
          }
        }

        this.$success(x.message)
        this.$refs.table.edit.rowIndex = -1
        this.search()
      })
    })
  },
  initEditTable() {
    if (!this.table.editTable) {
      return
    }
    let w = 40
    let hasAdd, hasEdit, hasDel
    this.buttons.forEach((c) => {
      if (c.value == 'Add') {
        // c.hidden = true;
        hasAdd = true
        w += 40
      } else if (c.value == 'Update') {
        c.hidden = true
        hasEdit = true
        // w += 20;
      } else if (c.value === 'Delete') {
        hasDel = true
        w += 40
      }
    })
    if (!hasAdd && !hasEdit && !hasDel) {
      return
    }
    this.doubleEdit = true
    this.columns.push({
      title: '操作',
      field: '操作',
      width: w,
      fixed: 'right',
      align: 'center',
      render: (h, { row, column, index }) => {
        return (
          <div>
            {hasAdd ? (
              <el-button
                onClick={($e) => {
                  $e.stopPropagation()
                  this.editTableAddRow(index)
                }}
                type="primary"
                link
                icon="Plus"
              ></el-button>
            ) : null}
            {hasEdit || hasAdd ? (
              <el-button
                onClick={($e) => {
                  $e.stopPropagation()
                  this.editTableSave(row)
                }}
                type="success"
                link
                icon="Check"
              ></el-button>
            ) : null}
            {hasDel ? (
              <el-button
                link
                onClick={($e) => {
                  $e.stopPropagation()
                  this.editTableDelRow(row, index)
                }}
                v-show={hasDel}
                type="danger"
                icon="Delete"
              ></el-button>
            ) : null}
          </div>
        )
      }
    })
  },
  printBefore(rows) {
    return true
  },
  printClick(rows) {
    if (rows) {
      if (!(rows instanceof Array)) {
        rows = [rows]
      }
    } else {
      rows = this.$refs.table.getSelected()
    }
    if (!rows || rows.length == 0) return this.$error(this.$ts('请选择要打印的行!'))
    let ids = rows.map((x) => {
      return x[this.table.key]
    })

    if (!this.printBefore(rows)) {
      return
    }
    const table = this.table.url.replaceAll('/', '')
    this.$refs.print.open({ ids, table, rows })
  }, //查询页面表格合并行或列，见https://element-plus.gitee.io/zh-CN/component/table.html#%E5%90%88%E5%B9%B6%E8%A1%8C%E6%88%96%E5%88%97
  spanMethod({ row, column, rowIndex, columnIndex }) {},
  //查询页面表格合并行或列，见https://element-plus.gitee.io/zh-CN/component/table.html#%E5%90%88%E5%B9%B6%E8%A1%8C%E6%88%96%E5%88%97
  detailSpanMethod({ row, column, rowIndex, columnIndex }) {}
}
import customColumns from './ViewGridCustomColumn.js'

//合并扩展方法
methods = Object.assign(methods, detailMethods, serviceFilter, customColumns)
export default methods
