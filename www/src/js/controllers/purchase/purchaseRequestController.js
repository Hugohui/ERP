'use strict';
mainStart
    .controller('purchaseRequestController', ['$scope', '$rootScope', '$localStorage', '$compile', 'toastr','$state', function ($scope, $rootScope, $localStorage, $compile, toastr,$state) {
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //消息推送
        $scope.sendMessage =JSON.parse(window.localStorage.getItem('ngStorage-sendMessage'));
        //获取角色信息
        $scope.user = $localStorage.user;
        //生成订单编号
        $('.orderNum').html(billFormat("CGSQ",new Date()));

        //获取项目号
        $.ajax({
            type: 'POST',
            url: 'http://111.204.101.170:11115',
            data: {
                action:'queryProjectNum'
            },
            dataType: 'jsonp',
            jsonp: "callback",
            success: function (data) {
                if(data.resData.result == 0){
                    $scope.projectNumArr = data.resData.projectNum;
                    $('.projectNumDiv').autocomplete({
                        hints: $scope.projectNumArr,
                        width: "100%",
                        height: 27,
                        showButton:false,
                        placeholder:'',
                        onSubmit: function(text){
                            console.log($(this));
                        }
                    });
                    $('.projectNumDiv input').attr('valType',' ');
                    $('.projectNumDiv input').attr('msg','项目号不能为空');
                    //初始化验证
                    //清除已有的验证提示信息
                    $('#purchaseReqForm [valType]').hideValidate();
                    $.fn.InitValidator('purchaseReqForm');
                }
            }
        })

        //初始化验证
        //清除已有的验证提示信息
        $('#purchaseReqForm [valType]').hideValidate();
        $.fn.InitValidator('purchaseReqForm');

        //添加物料行
        $scope.addMaterialLine = function () {
            //清除已有的验证提示信息
            $('#purchaseReqForm [valType]').hideValidate();

            //加载物料基础信息
            loadMaterial();

            $('#chsseAddMaterialModal').modal('show');
        }

        //删除物料行
        $scope.deleteMaterialLine = function ($event) {
            if ($('.materialListDiv').length > 1) {
                $($event.target).parent().remove();
            } else {
                toastr.warning('至少申请一项物料！');
            }
        }

        //审批人
        $scope.checkGroupLeader = function ($event) {
            $scope.choseCheckPeopleTitle = "选择室组经理";
            $scope.ajaxData = {
                action: "getApprover",
                params: "group_leader"
            }
            $.ajax({
                type: 'POST',
                url: 'http://111.204.101.170:11115',
                data: $scope.ajaxData,
                dataType: 'jsonp',
                jsonp: "callback",
                success: function (data) {
                    $scope.appendCheckPeopleHtmlModal(data.resData.data);
                }
            })
        }
        $scope.checkMinister = function ($event) {
            $scope.choseCheckPeopleTitle = "选择室部长";
            $scope.ajaxData = {
                action: "getApprover",
                params: "department"
            }
            $.ajax({
                type: 'POST',
                url: 'http://111.204.101.170:11115',
                data: $scope.ajaxData,
                dataType: 'jsonp',
                jsonp: "callback",
                success: function (data) {
                    $scope.appendCheckPeopleHtmlModal(data.resData.data);
                }
            })
        }
        $scope.checkManager = function ($event) {
            $scope.choseCheckPeopleTitle = "选择总经理";
            $scope.ajaxData = {
                action: "getApprover",
                params: "manager"
            }
            $.ajax({
                type: 'POST',
                url: 'http://111.204.101.170:11115',
                data: $scope.ajaxData,
                dataType: 'jsonp',
                jsonp: "callback",
                success: function (data) {
                    $scope.appendCheckPeopleHtmlModal(data.resData.data);
                }
            })
        }

        //模态框添加查询数据列
        $scope.appendCheckPeopleHtmlModal = function(data){
            var html = '';
            $.each(data,function(index,val){
                html+=
'                           <li class="selectLi" ng-click="selectPurchaseName($event)">'+
'                            【<span class="selectName">'+val.userName+'</span>】 '+val.department+
'                           </li>';
            });
            var $html = $compile(html)($scope);
            $('.selectCheckUl').empty().append($html);
            $('#choseCheckPeopleModal').modal('show');
        }

        //选中审批人
        $scope.selectPurchaseName = function($event){
            if($scope.choseCheckPeopleTitle == "选择室组经理"){
                $('.groupLeaderName').show().html($($event.currentTarget).find('.selectName').html()).siblings().remove();
                $('.groupLeaderNameInp').val($($event.currentTarget).find('.selectName').html()).siblings('.editCheckPeople').show();
            }else if($scope.choseCheckPeopleTitle == "选择室部长"){
                $('.departmentName').show().html($($event.currentTarget).find('.selectName').html()).siblings().remove();
                $('.departmentNameInp').val($($event.currentTarget).find('.selectName').html()).siblings('.editCheckPeople').show();
            }else{
                $('.managerName').html($($event.currentTarget).find('.selectName').html()).siblings().remove();
                $('.managerNameInp').val($($event.currentTarget).find('.selectName').html());
            }
            $('#choseCheckPeopleModal').modal('hide');
        }

        //提交采购申请
        $scope.submitPurchaseReq = function () {

            if ($('.materialListDiv').length == 0) {
                toastr.warning('请添加物料！');
                return;
            }

            var isValidate = beforeSubmit("purchaseReqForm");
            if(!isValidate){
                return;
            }else if($('.groupLeaderNameInp').val() == ''){
                toastr.warning('请选择室组经理！');
                return;
            }else if($('.departmentNameInp').val() == ''){
                toastr.warning('请选择部长！');
                return;
            }else if($('.managerNameInp').val() == ''){
                toastr.warning('请选择总经理！');
                return;
            }
            $scope.materialListArr = [];
            angular.forEach($('.materialListDiv'),function(data){
                $scope.materialListArr.push(
                    {
                        material_code:$(data).find('.material_code').val(),
                        material_name:$(data).find('.material_name').val(),
                        model:$(data).find('.model').val(),
                        //sn_num:$(data).find('.sn_num').val(),
                        brand:$(data).find('.brand').val(),
                        project_num:$(data).find('.projectNumDiv input').val(),
                        //project_num:$(data).find('.project_num').val(),
                        unit:$(data).find('.unit').val(),
                        number:$(data).find('.number').val(),
                        expected_date:$(data).find('.expected_date').val(),
                        remark:$(data).find('.remark').val()
                    }
                );
            });
            $scope.submitData = {
                action: "purchaseRequest",
                params: {
                    purchase_applicant_id: $('.orderNum').html(),
                    applicant: $scope.user.name,
                    approver: {
                        group_leader: $('.groupLeaderNameInp').val(),
                        department: $('.departmentNameInp').val(),
                        manager: $('.managerNameInp').val()
                    },
                    materialList:$scope.materialListArr
                }
            };
            $.ajax({
                type: 'POST',
                url: 'http://111.204.101.170:11115',
                data: $scope.submitData,
                dataType: 'jsonp',
                jsonp: "callback",
                success: function (data) {
                    if(data.resData.result == 0){
                        toastr.success('物料申请提交成功！');
                        $state.go('purchase.purchaseTrack');
                    }
                }
            });
        }

        //选择物料添加到列表
        $scope.selectMaterial = function(e){
            var flag = false;
            var material_code = $(e.target).attr('material_code'),
                material_name = $(e.target).attr('material_name'),
                model = $(e.target).attr('model'),
                manufactor = $(e.target).attr('manufactor'),
                unit = $(e.target).attr('unit'),
                description = $(e.target).attr('description');
            var lineHtml =
                '<div class="materialListDiv clearfix">'+
                '                        <span class="deleteMaterial" ng-click="deleteMaterialLine($event)">×</span>'+
                '                        <div><input type="text" class="material_code" readonly value="'+material_code+'"/></div>'+
                '                        <div><input type="text" class="material_name" readonly value="'+material_name+'"/></div>'+
                '                        <div><input type="text" class="model" readonly value="'+model+'"/></div>'+
                '                        <div class="projectNumDiv"></div>'+
                '                        <div><input type="text" class="unit" readonly value="'+unit+'"/></div>'+
                '                        <div><input type="number" class="number" valType msg="数量不能为空"/></div>'+
                '                        <div><input type="text" class="brand"/></div>'+
                '                        <div><input type="date" class="expected_date" ></div>'+
                '                        <div><input type="text" class="remark"/></div>'+
                '                    </div>';

            $.each($('.material_code'),function(index,value){
                if($(value).val() == material_code){
                    toastr.warning('已选择该物料');
                    flag = true;
                    return;
                }
            });
            if(flag){
                return;
            }
            var $lineHtml = $compile(lineHtml)($scope);
            $('.addMaterialListDiv').before($lineHtml);

            $('#chsseAddMaterialModal').modal('hide');

            $('.projectNumDiv').autocomplete({
                hints: $scope.projectNumArr,
                width: "100%",
                height: 27,
                showButton:false,
                placeholder:'',
                onSubmit: function(text){
                }
            });

            $('.projectNumDiv input').attr('valType',' ');
            $('.projectNumDiv input').attr('msg','项目号不能为空');

            //清除已有的验证提示信息
            $('#purchaseReqForm [valType]').hideValidate();
            //初始化验证
            $.fn.InitValidator('purchaseReqForm');
        }


        //物料查询
        $scope.searchMaterial = function(){
            var queryData = $('#queryInput').val();
            loadMaterial(queryData);
        }

        /**
         * 加载物料数据
         * @param queryData 搜索参数
         */
        function loadMaterial(query){
            $('.selectCheckUl').empty();
            $('.modalLoading').show();
            var queryData;
            if(query == undefined || query == ''){
                queryData = {};
            }else {
                queryData = {
                    material_name:query
                }
            }
            $.ajax({
                type: 'POST',
                url: 'http://111.204.101.170:11115',
                data: {
                    action:"loadMaterialList",
                    params:{
                        queryData:queryData
                    }
                },
                dataType: 'jsonp',
                jsonp: "callback",
                success: renderMaterialUl
            });
        }
        //渲染物料列表ul
        function renderMaterialUl(data){
            if(data.resData.result == 0){
                $('.modalLoading').hide();
                if(data.resData.data){
                    var html = '';
                    $.each(data.resData.data,function(index,value){
                        html+=
                            '<li class="selectLi" ng-click="selectMaterial($event)" material_code="'+value.material_code+'" material_name="'+value.material_name+'" model="'+value.model+'" manufactor="'+value.manufactor+'" unit="'+value.unit+'" description="'+value.description+'">'+
                            '                        【<span class="selectName">'+value.material_code+'</span>】 '+value.material_name+'--'+value.model+'--'+value.manufactor+
                            '                        </li>';
                    });
                    var $html = $compile(html)($scope);
                    $('.selectCheckUl').append($html);
                }else{
                    $('.selectCheckUl').append('<span class="noData">数据为空</span>');
                }
            }
        }

        //清空查询内容
        $('#chsseAddMaterialModal').on('hidden.bs.modal',function(){
            $('#queryInput').val('');
        })

        //敲击回车查询
        $('body').bind('keypress', function (event) {
            if (event.keyCode == "13") {
                $(".search").click();
            }
        })
    }]);
