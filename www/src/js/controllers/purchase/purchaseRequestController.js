'use strict';
mainStart
    .controller('purchaseRequestController', ['$scope', '$rootScope', '$localStorage', '$compile', 'toastr', function ($scope, $rootScope, $localStorage, $compile, toastr) {
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //获取角色信息
        $scope.user = $localStorage.user;

        //添加物料行
        $scope.addMaterialLine = function () {
            var lineHtml =
                '<div class="materialListDiv clearfix">'+
                '                        <span class="deleteMaterial" ng-click="deleteMaterialLine($event)">×</span>'+
                '                        <div><input type="text" class="material_name"/></div>'+
                '                        <div><input type="text" class="model"/></div>'+
                '                        <div><input type="text" class="sn_num"/></div>'+
                '                        <div><input type="text" class="project_num"/></div>'+
                '                        <div><input type="text" class="unit"/></div>'+
                '                        <div><input type="text" class="number"/></div>'+
                '                        <div><input type="date" class="expected_date" ></div>'+
                '                        <div><input type="text" class="remark"/></div>'+
                '                    </div>';
            var $lineHtml = $compile(lineHtml)($scope);
            $('.addMaterialListDiv').before($lineHtml);
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
                jsonpCallback: "success_jsonpCallback",
                success: function (data) {
                    console.log(data)
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
                jsonpCallback: "success_jsonpCallback",
                success: function (data) {
                    console.log(data)
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
                jsonpCallback: "success_jsonpCallback",
                success: function (data) {
                    console.log(data)
                }
            })
        }

        //提交采购申请
        $scope.submitPurchaseReq = function () {
            $scope.materialListArr = [];
            angular.forEach($('.materialListDiv'),function(data){
                $scope.materialListArr.push(
                    {
                        material_name:$(data).find('.material_name').val(),
                        model:$(data).find('.model').val(),
                        sn_num:$(data).find('.sn_num').val(),
                        project_num:$(data).find('.project_num').val(),
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
                    purchase_applicant_id: "CGSQ20170912001",
                    applicant: "张三",
                    approver: {
                        group_leader: "张三",
                        department: "李四",
                        manager: "王五"
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
                jsonpCallback: "success_jsonpCallback",
                success: function (data) {
                    console.log(data)
                }
            });
        }

    }])
;
