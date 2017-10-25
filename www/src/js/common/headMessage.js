($(function(){
    //已读所有信息
    $(document).on('click','.readALlMsg',function(){
        $.ajax({
            type: 'POST',
            url: 'http://111.204.101.170:11115',
            data: {
                action:"readAllMessage",
                params:{
                    userName:$('.userName').html()
                }
            },
            dataType: 'jsonp',
            jsonp: "callback",
            success: function (data) {
                if(data.resData.result == 0){
                    window.localStorage.setItem('ngStorage-sendMessage','[]');
                    $('.badge').hide();
                    $('.sendMessageUl').hide();
                    window.location.reload();
                }
            }
        });
    });

    //已读单个信息
    $(document).on('click','.readOne',function(){
        var bill = $(this).siblings('a').attr('bill');
        $.ajax({
            type: 'POST',
            url: 'http://111.204.101.170:11115',
            data: {
                action:"readMessage",
                params:{
                    userName:$('.userName').html(),
                    bill:bill
                }
            },
            dataType: 'jsonp',
            jsonp: "callback",
            success: function (data) {
                if(data.resData.result == 0){
                    if(data.resData.sendMessage.length){
                        $('.badge').html(data.resData.sendMessage.length);
                        $('.sendMessageUl').empty();
                        var liStr = '';
                        $.each(data.resData.sendMessage,function(index,value){
                            liStr +=
                                '                <li>'+
                                '                    <a href="javascript:;" class="viewMessage" applicant="'+value.applicant+'" bill="'+value.bill+'">【'+value.applicant+'】 '+value.message+'</a>'+
                                '                    <span href="javascript:;" class="alreadyRead readOne">已读</span>'+
                                '                </li>';
                        });

                        var html =
                            '                <li>'+
                            '                    您有'+data.resData.sendMessage.length+'条未读消息'+
                            '                    <span href="javascript:;" class="alreadyRead readALlMsg">全部已读</span>'+
                            '                </li>'+
                            '                <li class="divider"></li>'+
                            '                <li>'+
                            '                    <ul class="messageUl">'+liStr+
                            '                    </ul>'+
                            '                </li>';

                        $('.sendMessageUl').append(html);
                    }else{
                        $('.badge').hide();
                        $('.sendMessageUl').hide();
                    }

                    window.localStorage.setItem('ngStorage-sendMessage',JSON.stringify(data.resData.sendMessage));
                    window.location.reload();
                }

            }
        });
    });
}))
