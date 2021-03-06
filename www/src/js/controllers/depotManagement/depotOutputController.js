'use strict';
mainStart
    .controller('depotOutputController', ['$scope', '$rootScope', '$localStorage', 'toastr', '$compile',function ($scope, $rootScope, $localStorage, toastr,$compile) {
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //消息推送
        $scope.sendMessage =JSON.parse(window.localStorage.getItem('ngStorage-sendMessage'));
        //获取角色信息
        $scope.user = $localStorage.user;

        //获取采购入库列表
        initDepoOutputTable();

        $.fn.InitValidator('depotOutputTableDiv');

        /**
         * 领料出库列表
         */
        var depotOutputTable;

        function initDepoOutputTable() {
            var scrollY = $('.mainView').height() - $('.queryDIv').height() - 120;
            //初始化表格
            depotOutputTable = $("#depotOutputTable").dataTable({
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
                        "targets": [0, 1, 2],
                        "orderable": false
                    }
                ],
                ajax: function (data, callback, settings) {
                    //封装请求参数
                    var param = {};
                    param.limit = data.length;//页面显示记录条数，在页面显示每页显示多少项的时候
                    param.start = data.start;//开始的记录序号
                    param.page = (data.start / data.length) + 1;//当前页码
                    param.applicant = $scope.user.name;
                    //ajax请求数据
                    $.ajax({
                        type: 'POST',
                        url: 'http://111.204.101.170:11115',
                        data: {
                            action: "depotOutputList",
                            params: param
                        },
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
                            //未领料和部分领料的显示选择框
                            var inputStr = data.status == 0 || data.status == 2 ? '<input class="topCheckInput" type="checkbox"/>' : '';
                            var html = '<s class="fa fa-plus-square details-control" materialList = "' + data.materialList + '"></s>' + inputStr;
                            return html;
                        },
                        "width": 50
                    },
                    {
                        "data": "material_requisition_id",
                        "sClass": "text-center",
                        "render":function(data){
                            return '<span class="material_requisition_id">'+data+'</span>'
                        }
                    },
                     /*{
                        "data": "purchase_order_id",
                        "sClass": "text-center"
                    },
                    {
                        "data": "contract_num",
                        "sClass": "text-center"
                    },*/
                    {
                        "data": "applicant",
                        "sClass": "text-center"
                    },
                    {
                        "data": "status",
                        "sClass": "text-center",
                        "render":function(data){
                            var statusStr = {
                                0:"未领料",
                                1:"已领料"
                            };
                            return statusStr[data];
                        }
                    }
                ]
            }).api();
            var btnStr = '<div class="handleDepotDiv">'+
                '                    <button class="btn btn-primary btn-sm" ng-click="commitDepotOutput()">完成领料</button>'+
                '                </div>';
            var $btnStr = $compile(btnStr)($scope);
            $('.dataTables_wrapper').append($btnStr);
        }

        $('#depotOutputTable tbody').on('click', '.details-control', function () {
            var tr = $(this).closest('tr');
            var row = depotOutputTable.row(tr);
            var sonTrs = tr.next().find('.sonTable tr:not(:first-child)');
            if (row.child.isShown()) {
                //保存数量
                var stockPositionArr = [];
                $.each(sonTrs, function (index, value) {
                    stockPositionArr.push($(value).find('.stock_position').val());
                })
                tr.data('stockPositionArr', stockPositionArr);

                row.child.hide();
                $(this).removeClass('fa-minus-square  red').addClass('fa-plus-square');//按钮变化
                tr.removeClass('shown');
            } else {
                row.child(format(row.data(),tr.data('inputCheckedArr'))).show();
                tr.addClass('shown');
                $(this).removeClass('fa-plus-square').addClass('fa-minus-square red');
            }
            //当前行input所对应的状态
            if ($(this).siblings('input').is(':checked')) {
                //子表格的状态
                tr.next().find('input.checkMaterial').prop('checked', true);
            }

            //验证
            $.fn.InitValidator('depotOutputTableDiv');
            $('#depotOutputTableDiv [valType]').hideValidate();

        })

        function format(d, inputCheckedArr) {
            var positionArr = positionArr == undefined ? [] : positionArr;
            var inputCheckedArr = inputCheckedArr == undefined ? [] : inputCheckedArr;
            var trStr = '';
            $.each(d.materialList, function (index, value) {
                var positionStr = positionArr.length == 0 ? "" : positionArr[index];
                var inputStr, stock_position;
                value.status == 0 ? (inputStr = inputCheckedArr.length != 0 && inputCheckedArr[index] ? '<input type="checkbox" class="checkMaterial"  checked/>' : '<input type="checkbox" class="checkMaterial"/>') : inputStr = '';
                value.stock_position ? stock_position = value.stock_position : stock_position = '<input class="stock_position" type="text" msg="库存位置不能为空" value="' + positionStr + '">';
                var snTdStr = value.status==0?(value.sn_num == ''||value.sn_num == '无'?'<td>无</td>':'<td><a href="javascript:;" class="btn btn-default btn-xs selectSnNum" selectedSn="'+value.selectedSn+'" snNumStr="'+value.sn_num+'">选择sn号</a></td>'):(value.selectedSn == ''||value.selectedSn=='无'?'<td>无</td>':'<td><a href="javascript:;" class="btn btn-default btn-xs selectSnNum" selectedSn="'+value.selectedSn+'" snNumStr="'+value.selectedSn+'">查看</a></td>');
                trStr += '<tr>' +
                    '<td>' + inputStr + '</td>' +
                    '<td class="material_code">' + value.material_code + '</td>' +
                    '<td>' + value.material_name + '</td>' +
                    '<td>' + value.model + '</td>' +snTdStr+
                    '<td>' + value.project_num + '</td>' +
                    '<td>' + value.unit + '</td>' +
                    '<td class="number">' + value.number + '</td>' +
                    //'<td><input class="number" min="1" max="' + value.number + '" value="' + value.number + '"/></td>' +
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
                '<td>项目号</td>' +
                '<td>单位</td>' +
                '<td>数量</td>' +
                //'<td><s class="fa fa-asterisk redText"></s>数量</td>' +
                '<td>备注</td>' +
                '</tr>' + trStr +
                '</table>';
        }

        //给后台的收料数据数组
        //父表格中的选择
        $('#depotOutputTable tbody').on('change', '.topCheckInput', function () {
            var tr = $(this).closest('tr');
            var row = depotOutputTable.row(tr);
            if ($(this).is(':checked')) {
                if (!row.child.isShown()) {
                    row.child(format(row.data())).show();
                    tr.addClass('shown');
                    $(this).siblings('s').removeClass('fa-plus-square').addClass('fa-minus-square red');
                }
                //全选子行
                tr.next().find('.checkMaterial').prop('checked', true);
                tr.next().find('.stock_position').attr('valType', 'zNum');
                $(this).siblings('s').hide();
            } else {
                //子行取消全选
                tr.next().find('.checkMaterial').prop('checked', false);
                tr.next().find('.stock_position').removeAttr('valType', 'zNum');
                $(this).siblings('s').show();

                //更新选中状态
                var inputCheckedArr = [];
                $.each(tr.next().find('.checkMaterial'), function () {
                    inputCheckedArr.push(false);
                })
                tr.data('inputCheckedArr', inputCheckedArr);
            }
        })
        //子表格中的选择
        $(document).on('change', 'table.sonTable tbody .checkMaterial', function () {
            var tr = $(this).closest('table').closest('tr');
            var sonTrs = $(this).closest('table').find('tr:not(:first-child)');
            var material_code = $(this).closest('tr').find('.material_code').html();//物料编码
            var stock_position = $(this).closest('tr').find('.stock_position').val();//库存位置
            if ($(this).is(':checked')) {
                $(this).closest('tr').find('.stock_position').attr('valType', 'zNum');
                //判断子表格未选中项的个数，个数为0，则全选的按钮被选中
                if ($(this).closest('table').find('.checkMaterial:not(:checked)').length == 0) {
                    //选中全选按钮
                    tr.prev().find('.topCheckInput').prop('checked', true);
                    tr.prev().find('.topCheckInput').siblings('s').hide();
                    //保存当前数据到数组中
                }
            } else {
                $(this).closest('tr').find('.stock_position').removeAttr('valType', 'zNum');
                //取消全选按钮
                tr.prev().find('.topCheckInput').prop('checked', false);
                if ($(this).closest('table').find('.checkMaterial:checked').length == 0) {
                    tr.prev().find('.topCheckInput').siblings('s').show();
                }
            }
            //给父级表格保存选中情况
            var inputCheckedArr = [];
            $.each(sonTrs, function (index, value) {
                inputCheckedArr.push($(value).find('input.checkMaterial').prop("checked"));
            });
            tr.prev().data('inputCheckedArr', inputCheckedArr);
        })

        //选择sn号模态框
        var selectSnArr = [];
        var currentSelectBtn;
        $(document).on('click','.selectSnNum',function(){
            currentSelectBtn = this;
            var selectMaxNum = $(this).closest('tr').find('.number').html();
            $('#selectMaxNum').val(selectMaxNum);//可选的最多数量
            $('.remainSelectNum').html(selectMaxNum);//初始化选择的数量

            var selectedSnArr = $(this).attr('selectedSn').split(',');

            //清除label
            $('#selectSnNumModal .snCheckbox').empty();

            //追加选择框
            var snNumAttr = $(this).attr('snNumStr').split(',');
            var labelStr = '';
            $.each(snNumAttr,function(index,value){
                labelStr+='<label><input type="checkbox"/> <span>'+value+'</span></label>';
            });

            //添加到div
            $('#selectSnNumModal .snCheckbox').append(labelStr);

            //显示已选中的sn号（修改时）
            $.each($('.snCheckbox label'),function(index,value){
                var spanStr = $(value).find('span').html();
                var _value = value;
                $.each(selectedSnArr,function(index,value){
                    if(spanStr == value){
                        $(_value).find('input').attr('checked',true);
                    }
                });
            });

            if($(this).html() == '修改选择'){
                $('#selectSnNumModalLabel').html('修改选择');
                $('.snCheckbox input').not(':checked').attr('disabled',true);
                $('.remainSelectNum').html('0');
            }

            if($(this).html() == '查看'){
                $('#selectSnNumModalLabel').html('查看sn号');
                $('#selectSnNumModal .modal-footer').hide();
                $('.snCheckbox input:checked').remove();
                $('.snCheckbox input').not(':checked').closest('label').remove();
            }else{
                $('#selectSnNumModal .modal-footer').show();
            }

            $('#selectSnNumModal').modal('show');
        });

        //选择sn号事件
        $(document).on('change','#selectSnNumModal label>input',function(){
            if($(this).is(':checked')){//选中时
                if(selectSnArr.length<$('#selectMaxNum').val()){
                    selectSnArr.push($(this).next().html());//存入选中数组
                    $('.remainSelectNum').html($('#selectMaxNum').val()-selectSnArr.length);//更新显示数量
                    if(selectSnArr.length==$('#selectMaxNum').val()){//当选中数量和申请数量相等时，将剩余选择框禁用
                        $('#selectSnNumModal label>input:not(:checked)').attr('disabled',true);
                    }
                }
            }else{//取消选中时
                $('#selectSnNumModal label>input:not(:checked)').removeAttr('disabled');//移除禁用的选择框
                selectSnArr.splice(selectSnArr.indexOf($(this).next().html()),1);//从选中的数组中删除
                $('.remainSelectNum').html($('#selectMaxNum').val()-selectSnArr.length);//更新显示数量
            }
        });

        //确定选择sn号
        $scope.selectSnNumOk = function(){
            if(selectSnArr.length == 0){
                toastr.warning('请选择sn号');
            }else if(selectSnArr.length<$('#selectMaxNum').val()){
                toastr.warning('sn号量与申请数量不符');
            }else{
                $(currentSelectBtn).attr('selectedSn',selectSnArr.join(','));
                $(currentSelectBtn).html('修改选择');
                $('#selectSnNumModal').modal('hide');
            }
        }

        //完成领料
        $scope.commitDepotOutput = function () {
            var flag = false;
            var commitDataArr = [];
            $.each($('#depotOutputTable>tbody>tr').find('.material_requisition_id'),function(){
                var materialListArr = [];

                //订单行（父行）
                var tr = $(this).closest('tr');

                //子航是否展开
                if(tr.next().find('.sonTable')){

                    //是否选中物料
                    if(tr.next().find('.sonTable tr:not(".trHead")').find('.checkMaterial:checked').length){

                        //获取订单号
                        var material_requisition_id = $(this).html();

                        //该订单下的物料数据
                        $.each(tr.next().find('.sonTable tr:not(".trHead")').find('.checkMaterial:checked'),function(i,v){
                            if($(v).closest('tr').find('.selectSnNum').attr('selectedSn')!=undefined&&$(v).closest('tr').find('.selectSnNum').attr('snNumStr')!=''&&$(v).closest('tr').find('.selectSnNum').attr('selectedSn')==''){
                                toastr.warning('请选择sn号');
                                flag=true;
                            }
                            materialListArr.push({
                                material_code:$(v).closest('tr').find('.material_code').html(),
                                selectedSn:$(v).closest('tr').find('.selectSnNum').attr('selectedSn')?$(v).closest('tr').find('.selectSnNum').attr('selectedSn'):''
                            });
                        })

                        //组合数据
                        commitDataArr.push({
                            material_requisition_id:material_requisition_id,//订单号
                            materialList:materialListArr//物料编码数组
                        })
                    }
                }
            });

            if(flag){
                return;
            }

            //判断是否选择物料
            if (commitDataArr.length == 0) {
                toastr.warning('请选择物料！');
                return;
            }

            //提交数据
            $.ajax({
                type: 'POST',
                url: 'http://111.204.101.170:11115',
                data: {
                    action: "commitDepotOutput",
                    userName: $scope.user.name,
                    params: commitDataArr
                },
                dataType: 'jsonp',
                jsonp: "callback",
                success: function (data) {
                    if (data.resData.result == 0) {
                        //重新加载数据表
                        depotOutputTable.ajax.reload();
                        toastr.success('领料完成');
                    } else {
                        toastr.warning(data.resData.msg);
                    }

                }
            })

        }
    }]);
