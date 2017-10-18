($(function(){
    $(document).on('click','.viewMessage',function(){
        console.log($(this).attr('applicant'));
        window.location.href = '#/purchase/purchaseRequest';
    });
}))
