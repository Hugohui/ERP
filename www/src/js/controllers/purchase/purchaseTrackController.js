'use strict';
mainStart
    .controller('purchaseTrackController',['$scope','$rootScope','$localStorage','toastr',function($scope,$rootScope,$localStorage,toastr){
        //获取角色权限
        $scope.roles = $localStorage.roles;
        //消息推送
        $scope.sendMessage = $localStorage.sendMessage;
        //获取角色信息
        $scope.user = $localStorage.user;

        //设置采购跟踪内容的最大高度
        var maxScrollHeight = $(window).height() - $('.queryDIv').height()-82;
        $('.purchaseTrackBody').css({height:maxScrollHeight+'px'});

        //绑定时间
        bendEvents();

        //加载初始数据
        var pageNum = 1,//滚动加载自动更新页码
            limitNum = 3,//每次加载的数量
            stopLoadFlag = false;//防止滚动到底部重复加载数据

        loadPurchaseTrack();

        //美化滚动条//页面跳转后任存在！！！
/*        $('.purchaseTrackBody').niceScroll({
            cursorcolor: "#ccc",//#CC0071 光标颜色
            cursoropacitymax: 1, //改变不透明度非常光标处于活动状态（scrollabar“可见”状态），范围从1到0
            touchbehavior: false, //使光标拖动滚动像在台式电脑触摸设备
            cursorwidth: "5px", //像素光标的宽度
            cursorborder: "0", // 游标边框css定义
            cursorborderradius: "5px",//以像素为光标边界半径
            autohidemode: false //是否隐藏滚动条
        });*/

        $('.purchaseTrackBody').scroll(function(){
            stopLoadFlag = true;
            var nScrollTop=$(this)[0].scrollTop;//滚动条距顶部的高度
            var nDivHight=$(this).height();//可见区域的高度
            var nScrollHight= $(this)[0].scrollHeight;//为整个UL的高度（包括屏幕外的高度）
            if(nScrollTop + nDivHight+20 >=nScrollHight){
                if(stopLoadFlag && $('.purchaseTrackBody>div').not('.loadingDiv').length>0){
                    stopLoadFlag = false;
                    //滚动到底部加载数据
                    loadPurchaseTrack();
                }
            }
        });

        /**
         * 请求采购跟踪数据
         */
        function loadPurchaseTrack(){

            var classObj ={//审核结果类名
                "-1":"purchaseFailure",//拒绝
                "1":"purchaseReqSuccess",//通过
                "2":"purchaseReqSuccess",//通过
                "3":"purchaseReqSuccess",//通过
                "4":"purchaseReqSuccess",//通过
                "5":"purchaseReqSuccess"//通过
                },
                resultStr ={//订单结果
                "-1":"拒绝申请",
                "0":"",
                "1":"已同意",
                "2":"待下单",
                "3":"已下单",
                "4":"已到货",
                "5":"已领料"
            };
            var queryData = $('.startDate').val() == ''&&$('.endDate').val() == ''?null:{
                startDate:$('.startDate').val() == ''?null:$('.startDate').val(),
                endDate:$('.endDate').val() == ''?null:$('.endDate').val()
            }
            $.ajax({
                type:'POST',
                url:'http://111.204.101.170:11115',
                data:{
                    action:"purchaseTrack",
                    params:{
                        applicant:$scope.user.name,
                        limit:limitNum,
                        start:(pageNum-1)*limitNum,
                        page:pageNum,
                        queryData:queryData
                    }
                },
                dataType: 'jsonp',
                jsonp : "callback",
                beforeSend:function(){
                    $('.loadingDiv').show();//加载动画
                },
                success:function(data){
                    $('.loadingDiv').hide();
                    var html = '';
                    if(data.resData.result == 0){
                        if(data.resData.data.length>0){
                            //页数加加
                            pageNum+=1;

                            //添加分割线
                            $('.purchaseTrackBody').append('<div class="splitLine"></div>');

                            //渲染数据
                            $.each(data.resData.data,function(index,value){
                                html+=
                                    '              <div class="purchaseLine">'+
                                    '                <span class="purchaseLineOrder">订单编号：'+value.purchase_applicant_id+'</span>'+
                                    '                <ul class="purchaseLineUl clearfix">'+
                                    '                    <li class="purchaseReqSuccess">'+
                                    '                        我'+
                                    '                        <span class="nextFlowSpan purchaseReqSuccess"></span>'+
                                    '                        <span class="purchaseResult">提交申请</span>'+
                                    '                        <span class="purchaseDatetime">'+value.personal.date+'</span>'+
                                    '                    </li>'+
                                    '                    <li class="'+classObj[value.group_leader.status]+'">'+
                                    '                        <p class="showReasonDiv">拒绝理由：'+value.group_leader.reason+'</p>'+
                                    '                        室组经理'+
                                    '                        <span class="preFlowSpan '+classObj[value.group_leader.status]+'"></span>'+
                                    '                        <span class="nextFlowSpan '+classObj[value.group_leader.status]+'"></span>'+
                                    '                        <span class="purchaseResult">'+resultStr[value.group_leader.status]+'</span>'+
                                    '                        <span class="purchaseDatetime">'+value.group_leader.date+'</span>'+
                                    '                    </li>'+
                                    '                    <li class="'+classObj[value.department.status]+'">'+
                                    '                        <p class="showReasonDiv">拒绝理由：'+value.department.reason+'</p>'+
                                    '                        部长'+
                                    '                        <span class="preFlowSpan '+classObj[value.department.status]+'"></span>'+
                                    '                        <span class="nextFlowSpan '+classObj[value.department.status]+'"></span>'+
                                    '                        <span class="purchaseResult">'+resultStr[value.department.status]+'</span>'+
                                    '                        <span class="purchaseDatetime">'+value.department.date+'</span>'+
                                    '                    </li>'+
                                    '                    <li class="'+classObj[value.manager.status]+'">'+
                                    '                        <p class="showReasonDiv">拒绝理由：'+value.manager.reason+'</p>'+
                                    '                        总经理'+
                                    '                        <span class="preFlowSpan '+classObj[value.manager.status]+'"></span>'+
                                    '                        <span class="nextFlowSpan '+classObj[value.manager.status]+'"></span>'+
                                    '                        <span class="purchaseResult">'+resultStr[value.manager.status]+'</span>'+
                                    '                        <span class="purchaseDatetime">'+value.manager.date+'</span>'+
                                    '                    </li>'+
                                    '                    <li class="'+classObj[value.purchase.status]+'">'+
                                    '                        采购'+
                                    '                        <span class="preFlowSpan '+classObj[value.purchase.status]+'"></span>'+
                                    '                        <span class="nextFlowSpan '+classObj[value.purchase.status]+'"></span>'+
                                    '                        <span class="purchaseResult">'+resultStr[value.purchase.status]+'</span>'+
                                    '                        <span class="purchaseDatetime">'+value.purchase.date+'</span>'+
                                    '                    </li>'+
                                    '                    <li class="'+classObj[value.warehouse.status]+'">'+
                                    '                        库管'+
                                    '                        <span class="preFlowSpan '+classObj[value.warehouse.status]+'"></span>'+
                                    '                        <span class="purchaseResult">'+resultStr[value.warehouse.status]+'</span>'+
                                    '                        <span class="purchaseDatetime">'+value.warehouse.date+'</span>'+
                                    '                    </li>'+
                                    '                </ul>'+
                                    '            </div>'+
                                    '            <div class="splitLine"></div>';
                            });
                            $('.purchaseTrackBody').append(html);
                            $('.splitLine:last-child').remove();//将最后一条数据的分割线移除
                            $('.splitLine:nth-child(2)').remove();//将第一条数据的分割线移除
                        }else{
                            //没有更多数据了
                            toastr.warning('没有更多数据了！');
                        }
                    }
                }
            })
        }

        //条件筛选
        $('.queryBody').on('change','input',function(){
            $('.purchaseTrackBody>div').not('.loadingDiv').remove();
            pageNum = 1;
            loadPurchaseTrack();
        });

        /**
         * 事件绑定
         */
        function bendEvents(){
            $('.purchaseTrackBody').on('mouseenter','li',function(){
                if($(this).hasClass('purchaseFailure')){
                    $(this).find('.showReasonDiv').show();
                }
            });

            $('.purchaseTrackBody').on('mouseleave','li',function(){
                    $(this).find('.showReasonDiv').hide();
            });
        }
    }]);
