'use strict';
mainStart
    .controller('depotInputController', ['$scope', '$rootScope', '$localStorage','toastr','$compile', function ($scope, $rootScope, $localStorage,toastr,$compile) {
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //消息推送
        $scope.sendMessage =JSON.parse(window.localStorage.getItem('ngStorage-sendMessage'));
        //获取角色信息
        $scope.user = $localStorage.user;

        //获取采购入库列表
        initDepotInputTable();

        $.fn.InitValidator('depotInputTableDiv');

        /**
         * 采购入库列表
         */
        var depotInputTable;

        function initDepotInputTable() {
            var scrollY = $('.mainView').height() - $('.queryDIv').height() - 120;

            //初始化表格
            depotInputTable = $("#depotInputTable").dataTable({
                language: lang,  //提示信息
                autoWidth: true,  //禁用自动调整列宽
                scrollY: scrollY,
                lengthMenu: [20, 40, 60], //更改显示记录数选项
                stripeClasses: ["odd", "even"],  //为奇偶行加上样式，兼容不支持CSS伪类的场合
                processing: true,  //隐藏加载提示,自行处理
                serverSide: true,  //启用服务器端分页
                searching: false,  //禁用原生搜索
                orderMulti: false,  //启用多列排序
                order: [],  //取消默认排序查询,否则复选框一列会出现小箭头
                renderer: "Bootstrap",  //渲染样式：Bootstrap和jquery-ui
                pagingType: "full_numbers",  //分页样式：simple,simple_numbers,full,full_numbers
                columnDefs: [
                    {
                        "targets": [0, 1, 2, 3, 4],
                        "orderable": false
                    }
                ],
                ajax: function (data, callback, settings) {
                    //封装请求参数
                    var queryData = $('.placeholderOrderNum').val() == ''&&$('.selectCss').val()==-1?null:{
                        queryInput:$('.placeholderOrderNum').val()==''?null:$('.placeholderOrderNum').val(),
                        status:$('.selectCss').val()==-1?null:$('.selectCss').val()
                    }
                    var param = {};
                    param.limit = data.length;//页面显示记录条数，在页面显示每页显示多少项的时候
                    param.start = data.start;//开始的记录序号
                    param.page = (data.start / data.length) + 1;//当前页码
                    param.applicant = $scope.user.name;
                    param.queryData = queryData;
                    //ajax请求数据
                    $.ajax({
                        type: 'POST',
                        //url:'data/users.txt',
                        url: 'http://111.204.101.170:11115',
                        data: {
                            action: "depotInputList",
                            params: param
                        },
                        //dataType:'json',
                        dataType: 'jsonp',
                        jsonp: "callback",
                        success: function (result) {
                            //封装返回数据
                            var returnData = {};
                            returnData.draw = data.draw;//这里直接自行返回了draw计数器,应该由后台返回
                            returnData.recordsTotal = result.resData.total;//返回数据全部记录
                            returnData.recordsFiltered = result.resData.total;//后台不实现过滤功能，每次查询均视作全部结果
                            returnData.data = result.resData.data;//返回的数据列表
                            callback(returnData);
                        }
                    });
                },
                //列表表头字段
                columns: [
                    {
                        "data": null,
                        "sClass": "text-center",
                        "render": function (data) {
                            //未收料和部分收料的显示选择框
                            var inputStr = data.orderStatus == 0 ||  data.orderStatus == 2?'<input class="topCheckInput" type="checkbox"/>':'';
                            var html = '<s class="fa fa-plus-square details-control" materialList = "' + data.materialList + '"></s>'+inputStr;
                            return html;
                        },
                "width": 50
            },
            {
                "data": "purchase_applicant_id",
                "sClass": "text-center"
            },
            {
                "data": "purchase_order_id",
                "sClass": "text-center"
            },
            {
                "data": "contract_num",
                "sClass": "text-center"
            },
            {
                "data": "applicant",
                "sClass": "text-center"
            }
            ]
        }).api();



        var btnStr = '<div class="handleDepotDiv">'+
            '                    <button class="btn btn-warning btn-sm" ng-click="commitDepotInput()">确认收料</button>'+
            '                    <button class="btn btn-warning btn-sm"><s class="fa fa-print"></s> 打印收料单</button>'+
            '                </div>';
        var $btnStr = $compile(btnStr)($scope);
        $('.dataTables_wrapper').append($btnStr);
    }

        //条件查询
        $scope.conditionQuery = function(){
            depotInputTable.ajax.reload();
        }

        $('#depotInputTable tbody').on('click', '.details-control', function () {
            var tr = $(this).closest('tr');
            var row = depotInputTable.row(tr);
            var sonTrs = tr.next().find('.sonTable tr:not(:first-child)');
            if (row.child.isShown()) {
                //保存库存位置
                var stockPositionArr = [];
                $.each(sonTrs,function(index,value){
                    stockPositionArr.push($(value).find('.stock_position').val());
                })
                tr.data('stockPositionArr',stockPositionArr);

                row.child.hide();
                $(this).removeClass('fa-minus-square  red').addClass('fa-plus-square');//按钮变化
                tr.removeClass('shown');
            } else {
                row.child(format(row.data(),tr.data('stockPositionArr'),tr.data('inputCheckedArr'))).show();
                tr.addClass('shown');
                $(this).removeClass('fa-plus-square').addClass('fa-minus-square red');

                //设置库存位置
                $.each(sonTrs,function(index,value){

                });
            }
            //当前行input所对应的状态
            if ($(this).siblings('input').is(':checked')) {
                //子表格的状态
                tr.next().find('input.checkMaterial').prop('checked', true);
            }

            //验证
            $.fn.InitValidator('depotInputTableDiv');
            $('#depotInputTableDiv [valType]').hideValidate();

        })

        function format(d,positionArr,inputCheckedArr) {
            var positionArr = positionArr == undefined?[]:positionArr;
            var inputCheckedArr = inputCheckedArr == undefined?[]:inputCheckedArr;
            var trStr = '';
            $.each(d.materialList, function (index, value) {
                var positionStr = positionArr.length == 0?"":positionArr[index];
                var inputStr,stock_position;
                value.status == 0?(inputStr = inputCheckedArr.length != 0 && inputCheckedArr[index]?'<input type="checkbox" class="checkMaterial"  checked/>':'<input type="checkbox" class="checkMaterial"/>'):inputStr='';
                value.stock_position?stock_position=value.stock_position:stock_position='<input class="stock_position" type="text" msg="库存位置不能为空" value="'+positionStr+'">';
                trStr += '<tr>' +
                    '<td>'+inputStr+'</td>' +
                    '<td class="material_code">' + value.material_code + '</td>' +
                    '<td>' + value.material_name + '</td>' +
                    '<td>' + value.model + '</td>' +
                    '<td>' + value.sn_num + '</td>' +
                    '<td>' + value.supplier_num + '</td>' +
                    '<td>' + value.supplier + '</td>' +
                    '<td>' + value.project_num + '</td>' +
                    '<td>' + value.unit + '</td>' +
                    '<td>' + value.number + '</td>' +
                    '<td>' + value.batch + '</td>' +
                    '<td>' + value.brand + '</td>' +
                    '<td>' + value.manufactor + '</td>' +
                    '<td>' + value.unit_price + '</td>'+
                    '<td>'+stock_position+'</td>'+
                    '<td>' + value.remark + '</td>' +
                    '</tr>';
            });
            return '<table cellpadding="5" cellspacing="0" border="0" width="100%" class="display table-bordered sonTable">' +
                '<tr class="trHead">' +
                '<td width="50"></td>' +
                '<td>物料编码</td>' +
                '<td>名称</td>' +
                '<td>型号</td>' +
                '<td>sn号</td>' +
                '<td>供应商编号</td>' +
                '<td>供应商名称</td>' +
                '<td>项目号</td>' +
                '<td>单位</td>' +
                '<td>数量</td>' +
                '<td>批次</td>' +
                '<td>品牌</td>' +
                '<td>厂家</td>' +
                '<td>单价</td>' +
                '<td><s class="fa fa-asterisk redText"></s>库存位置</td>' +
                '<td>备注</td>' +
                '</tr>' + trStr +
                '</table>';
        }

        //给后台的收料数据数组
        var depotArr = [];
        //父表格中的选择
        $('#depotInputTable tbody').on('change', '.topCheckInput', function () {
            var tr = $(this).closest('tr');
            var row = depotInputTable.row(tr);
            if ($(this).is(':checked')) {
                if (!row.child.isShown()) {
                    row.child(format(row.data(),tr.data('stockPositionArr'))).show();
                    tr.addClass('shown');
                    $(this).siblings('s').removeClass('fa-plus-square').addClass('fa-minus-square red');
                }
                //全选子行
                tr.next().find('.checkMaterial').prop('checked', true);
                tr.next().find('.stock_position').attr('valType',' ');
                $(this).siblings('s').hide();

                //将子表格中的数据暂存到数组中
                var stockArr  = tr.data('stockPositionArr') == undefined?[]:tr.data('stockPositionArr');
                $.each(row.data().materialList,function(index,value){
                    var obj = stockArr.length == 0?{material_code: value.material_code, stock_position:""}:{material_code: value.material_code, stock_position: stockArr[index]};
                    if(objinArrar(depotArr,obj,'material_code')  == -1){
                        depotArr.push(obj);
                    }
                });
            } else {
                //子行取消全选
                tr.next().find('.checkMaterial').prop('checked', false);
                tr.next().find('.stock_position').removeAttr('valType',' ');
                $(this).siblings('s').show();

                //更新选中状态
                var inputCheckedArr = [];
                $.each(tr.next().find('.checkMaterial'),function(){
                    inputCheckedArr.push(false);
                })
                tr.data('inputCheckedArr',inputCheckedArr);

                //将子表格中的数据从数组中删除
                $.each(row.data().materialList,function(index,value){
                    var stockArr  = tr.data('stockPositionArr') == undefined?[]:tr.data('stockPositionArr');
                    var obj = stockArr.length == 0?{material_code: value.material_code, stock_position:""}:{material_code: value.material_code, stock_position: stockArr[index]};
                    if(objinArrar(depotArr,obj,'material_code')  != -1){
                        depotArr.splice(objinArrar(depotArr,obj,'material_code'),1);
                    }
                });
            }

            //验证
            $.fn.InitValidator('depotInputTableDiv');
            $('#depotInputTableDiv [valType]').hideValidate();
        })
        //子表格中的选择
        $(document).on('change', 'table.sonTable tbody .checkMaterial', function () {
            var tr = $(this).closest('table').closest('tr');
            var sonTrs = $(this).closest('table').find('tr:not(:first-child)');
            var material_code = $(this).closest('tr').find('.material_code').html();//物料编码
            var stock_position = $(this).closest('tr').find('.stock_position').val();//库存位置
            if ($(this).is(':checked')) {
                $(this).closest('tr').find('.stock_position').attr('valType',' ');
                //判断子表格未选中项的个数，个数为0，则全选的按钮被选中
                if ($(this).closest('table').find('.checkMaterial:not(:checked)').length == 0) {
                    //选中全选按钮
                    tr.prev().find('.topCheckInput').prop('checked', true);
                    tr.prev().find('.topCheckInput').siblings('s').hide();
                    //保存当前数据到数组中
                    depotArr.push({material_code: material_code, stock_position: $(this).closest('tr').find('.stock_position').val()});
                }
            } else {
                $(this).closest('tr').find('.stock_position').removeAttr('valType',' ');
                //取消全选按钮
                tr.prev().find('.topCheckInput').prop('checked', false);
                if($(this).closest('table').find('.checkMaterial:checked').length == 0){
                    tr.prev().find('.topCheckInput').siblings('s').show();
                }
                //从数组中删除当前数据
                depotArr.splice(objinArrar(depotArr,{material_code: material_code, stock_position: ""},'material_code'),1);
            }
            //给父级表格保存选中情况
            var inputCheckedArr = [];
            $.each(sonTrs,function(index,value){
                inputCheckedArr.push($(value).find('input.checkMaterial').prop("checked"));
            });
            tr.prev().data('inputCheckedArr',inputCheckedArr);

            //验证
            $.fn.InitValidator('depotInputTableDiv');
            $('#depotInputTableDiv [valType]').hideValidate();
        })

        //确认收料
        $scope.commitDepotInput = function () {
            var commitDataArr = [];
            $.each($('.sonTable tr:not(".trHead")'),function(index,value){
                if($(this).find('.checkMaterial').is(':checked')){
                    commitDataArr.push({material_code: $(this).find('.material_code').html(), stock_position: $(this).find('.stock_position').val()})
                }
            });

            //判断是否选择物料
            if(commitDataArr.length == 0){
                toastr.warning('请选择物料！');
                return;
            }

            //验证
            var isValidate = beforeSubmit("depotInputTableDiv");
            if(!isValidate){
                return;
            }

            //提交数据
            $.ajax({
                type: 'POST',
                url: 'http://111.204.101.170:11115',
                data:{
                    action:"commitDepotInput",
                    params:{
                        userName:$scope.user.name,
                        materialList:commitDataArr
                    }
                },
                dataType: 'jsonp',
                jsonp: "callback",
                success: function (data) {
                    if(data.resData.result == 0){
                        //重新加载数据表
                        depotInputTable.ajax.reload();
                        toastr.success(data.resData.msg);
                    }else{
                        toastr.warning(data.resData.msg);
                    }

                }
            })

        }

        /**
         * 判断对象是否在数组中
         * @param arr 数组
         * @param check 对象
         * @param keyOne
         * @returns {number}    返回-1，不存在
         */
        function objinArrar(arr,check,keyOne){
            var isExisted = false;
            var index = -1;
            for(var i=0;i<arr.length;i++){
                if (arr[i][keyOne] == check[keyOne]) {
                    isExisted = true;
                    index = i;
                    return i;
                }
            }
            if (!isExisted) {
                return -1;
            }else{
                return index;
            }
        }

    }]);
