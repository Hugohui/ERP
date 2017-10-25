$(function () {
    $.fn.InitValidator = function (id) {
        //拦截form,在form提交前进行验证
        $("#" + id + " form").bind('submit', beforeSubmit);

        //为带有valType属性的元素初始化提示信息并注册onblur事件
        $.each($("#" + id + " [valType]"), function (i, n) {
            //$(n).after("<span style='display:none;'><img src='" + shareScriptSrc + "/css/validate/images/error.png' title='' /></span>");
            $(n).poshytip({
                className: 'tip-yellowsimple',
                //content: $(n).attr('msg'),
                showOn: 'none',
                alignTo: 'target',
                alignX: 'bottom',
                alignY: 'bottom',
                offsetX: 0,
                offsetY: -3
            });
            $(n).bind('blur', function () { validateBefore(n); });
            $(n).bind('focus', function () { $(this).hideValidate(); });
        });

        //定义一个验证器
        $.Validator = function (para) {
        };

        $.Validator.ajaxValidate = function (divid) {
            beforeSubmit(divid);
        };

        //验证的方法
        $.Validator.match = function (para) {
            //定义默认的验证规则
            var defaultVal = {
                "*6-15": "^.{6,15}$",
                "n": "^[0-9]*$",
                "n6-15": "^\[0-9]{6,15}$",
                "sp": "^(?!_)(?!.*?_$)[a-zA-Z0-9 _\.\u4e00-\u9fa5（）]+$",
                "s": "^(?!_)(?!.*?_$)[a-zA-Z0-9 -_\.\u4e00-\u9fa5]+$",
                "s6-18": "^(?!_)(?!.*?_$)[a-zA-Z0-9 _\.\u4e00-\u9fa5]{6,18}$",
                "zFN": "^([0-9]+)(\.[0-9]+)?$", //"([1-9][0-9]*|0)(\.[0-9]+)?$","^([0-9][0-9]*|0)(\.[0-9]+)?$", //正数(正整数 & 正小数)
                "zNum": "^[0-9]*$", //正整数
                "NumP": "^(\-)?[0-9]+(\.[0-9]+)?$", //^(\-|\+)?\d+(\.\d+)?$
                NUMBER: "^[0-9]*$",
                SZ: "^[0-9a-zA-Z]+$",
                TEL: "^0(10|2[0-5789]|\\d{3})-?\\d{7,8}$",
                IP: "^((\\d|[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5]|[*])\\.){3}(\\d|[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5]|[*])$",
                //                MOBILE: "^1(3[0-9]|5[0-35-9]|8[0-9])\\d{8}$",
                MOBILE: "^((1[3-8]\\d{9})|(\\d{8}))$",
                TELMOBILE: "(^0(10|2[0-5789]|\\d{3})-?\\d{7,8}$)|(^((1[3-8]\\d{9})|(\\d{8}))$)",
                //MAIL: "^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$",
                //MAIL: "^([a-zA-Z0-9_\.-])+@([a-zA-Z0-9_-]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$",
                MAIL: "^[a-zA-Z0-9]+([-_.][a-zA-Z0-9]+)*@([a-zA-Z0-9]+[-.])+[a-zA-Z0-9]{2,5}$",
                IDENTITY: "(^((11|12|13|14|15|21|22|23|31|32|33|34|35|36|37|41|42|43|44|45|46|50|51|52|53|54|61|62|63|64|65|71|81|82|91)\\d{4})((((19|20)(([02468][048])|([13579][26]))0229))|((20[0-9][0-9])|(19[0-9][0-9]))((((0[1-9])|(1[0-2]))((0[1-9])|(1\\d)|(2[0-8])))|((((0[1,3-9])|(1[0-2]))(29|30))|(((0[13578])|(1[02]))31))))((\\d{3}(x|X))|(\\d{4}))$)|(^[A-Z][0-9]{6}\\([0-9A-Z]\\)$)",
                CHINESE: "^([\u4E00-\uFA29]|[\uE7C7-\uE7F3])*$",
                URL: "^http[s]?://[\\w\\.\\-]+$",
                "e-n": "^[A-Za-z0-9]+$",
                "Fax": "^(([0\+]\\d{2,3}-)?(0\\d{2,3})-)(\\d{7,8})(-(\\d{3,}))?$",
                "pCode": "^[1-9][0-9]{5}$",
                "carNo": "^[\u4e00-\u9fa5]{1}[A-Z]{1}[A-Z_0-9]{5}$",
                "useName": "^[A-Za-z0-9-_]+$",
                "*0-20": "^.{0,20}$",
            };
            var flag = false;
            if (para.rule == 'OTHER') {//自定义的验证规则匹配
                flag = new RegExp(para.regString).test(para.data);
            }
            else {
                if (para.rule in defaultVal) {//默认的验证规则匹配
                    flag = new RegExp(defaultVal[para.rule]).test(para.data);
                }
            }

            return flag;
        };



        //为jquery扩展一个doValidate方法，对所有带有valType的元素进行表单验证，可用于ajax提交前自动对表单进行验证
        $.extend({
            doValidate: function (id) {
                return $.Validator.ajaxValidate(id);
            }
        });
    }
    $.fn.hideValidate = function () {
        //先清除原来的tips
        //$(this).next("span").hide();
        $(this).poshytip("hide");
        $(this).removeClass("wrong-msg");
    };
    $.fn.hideValidateTipsOnly = function () {
        //先清除原来的tips
        $(this).poshytip("hide");
    };
});
var validataMsg = {
    "*6-15": "请填写6到15位任意字符！",
    "n": "请填写数字！",
    "n6-15": "请填写6到15位数字！",
    "sp": "不能输入特殊字符(空格/点/下划线除外)！",
    "s": "不能输入特殊字符(空格/点/横杠/下划线/括号除外)！",
    "s6-18": "请填写6到18位字符(空格/点/下划线/括号除外)！",
    "zFN": "请填写正数", //正数(正整数 & 正小数)
    "zNum": "请填写非负整数", //正整数
    NUMBER: "请填写数字",
    TEL: "电话号码不正确(029-88888888)",
    IP: "IP地址不正确",
    SZ: "只可输入数字和字母",
    MOBILE: "手机号码不正确",
    TELMOBILE: "请填写手机和固定电话（加区号）",
    MAIL: "邮箱地址不正确",
    IDENTITY: "身份证号不正确",
    CHINESE: "请填写中文",
    URL: "请填写网址",
    "e-n": "请输入英文或数字",
    "Fax": "传真号不正确（国家代码-区号-电话号码-分机号）",
    "pCode": "邮编号不正确",
    "carNo": "车牌格式不正确",
    "useName": "账号名格式不正确",
    "NumP": "请输入正确的数字",
    "*0-20": "不多于20个字符！",

};
function showError(obj, msg) {
    if (msg) {
        $(obj).poshytip("update", msg);
    }
    else {
        if ($(obj).attr('msg') != "") {
            $(obj).poshytip("update", $(obj).attr('msg'));
        }
        else {
            $(obj).poshytip("update", validataMsg[$(obj).attr('valType')]);
        }
    }
    //if (obj.tagName == "INPUT") {
    $(obj).addClass("wrong-msg");
    //}
    var objTop = $(obj).offset().top;
    var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
    if (scrollTop + 30 < objTop) {
        $(obj).poshytip("show");
    }
};
var subIndex = 0;
function showError_Sub(obj, msg) {
    if (subIndex > 1) { $(obj).addClass("wrong-msg"); return; }
    var objTop = $(obj).offset().top;
    var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
    if (scrollTop + 90 > objTop) {
        $('html,body').animate({ scrollTop: (objTop - 90) + 'px' }, 0);
    }
    /*else if ((objTop - scrollTop) > (GetPageSize()[3] - 90 - 70)) {
        $('html,body').animate({ scrollTop: (objTop - GetPageSize()[3] - scrollTop + 90 + 30) + 'px' }, 0);
    }*/
    if (msg) {
        $(obj).poshytip("update", msg);
    }
    else {
        if ($(obj).attr('msg') != "") {
            $(obj).poshytip("update", $(obj).attr('msg'));
        }
        else {
            $(obj).poshytip("update", validataMsg[$(obj).attr('valType')]);
        }
    }
    subIndex++;
    $(obj).addClass("wrong-msg");
    $(obj).poshytip("show");
};

//输入框焦点离开后对文本框的内容进行格式验证
function validateBefore(obj) {
    if ($(obj).attr('noblur')) { return; }
    //验证通过标识
    var flag = true;
    //获取验证类型
    var valType = $(obj).attr('valType');
    //获取验证不通过时的提示信息
    var msg = $(obj).attr('msg');
    //自定义的验证字符串
    var regString;

    //先清除原来的tips
    $(obj).hideValidate();

    ////////控制属性判断
    if (typeof $(obj).attr("emptyChk") != "undefined") {
        if ($(obj).attr("emptyChk") == 0 && $.trim($(obj).val()) == "") {
            return;
        }
    }
    if (valType == 'OTHER') {//如果类型是自定义，则获取自定义的验证字符串
        regString = $(obj).attr('regString');
        flag = $.trim($(obj).val()) != '' && $.Validator.match({ data: $.trim($(obj).val()), rule: $(obj).attr('valType'), regString: $(obj).attr('regString') });
    }
    else {//如果类型不是自定义，则匹配默认的验证规则进行验证
        //if($(obj).attr('valType')=='required') {//不能为空的判断
        if ($(obj).children("option").length != 0) {                                    //判断目标元素为select的情况
            if ($(obj).val() == "0") {                                                  //默认"0"为 请选择
                flag = false;
            }
        } else if ($(obj).parent("[name^='select-down']").length != 0) {
            if ($(obj).children("span").attr("value") == "0") {                                                  //默认"0"
                flag = false;
            }
        }
        else if ($.trim($(obj).val()) == '') {
            flag = false;
        }
        else {
            if ($(obj).attr(valType)) {
                flag = $.trim($(obj).val()) != '' && $.Validator.match({ data: $.trim($(obj).val()), rule: $(obj).attr(valType) });
                if (!flag) {
                    showError(obj, validataMsg[$(obj).attr(valType)]);
                    return;
                }
            }
            if ($(obj).attr("recheck")) {
                flag = $.trim($(obj).val()) == $("#" + $(obj).attr("recheck")).val();
                if (!flag) {
                    showError(obj, $(obj).attr("recMsg"));
                    return;
                }
            }
            if ($(obj).attr("ajaxurl")) {
                $.ajax({
                    url: $(obj).attr("ajaxurl"), async: false, type: 'post', dataType: "text", headers: { token: checkToken }, data: { value: $.trim($(obj).val()) },
                    success: function (data) {
                        if (data != "") {
                            flag = false;
                            showError(obj, data);
                            return;
                        }
                    }
                });
            }
            if ($(obj).attr("function")) {
                var rtMsg = eval($(obj).attr("function"))(obj);
                if (rtMsg != "") {
                    flag = false;
                    showError(obj, rtMsg);
                    return;
                }
            }
        }
        //		}
        //		else {//已定义规则的判断
        //		    flag = $.trim($(obj).val()) != '' && $.Validator.match({ data: $.trim($(obj).val()), rule: $(obj).attr('valType') });
        //		}
    }

    //如果验证没有通过，显示tips
    if (!flag) {
        showError(obj);
    }

};


//submit之前对所有表单进行验证
function beforeSubmit(id) {
    var flag = true;
    subIndex = 0;
    //alert($("[valType]").length);
    $.each($("#" + id + " [valType]:visible"), function (i, n) {
        //清除可能已有的提示信息
        $(n).hideValidate();
        if ($(n).children("option").length != 0) {                                //判断目标元素为select的情况
            if ($(n).val() == "0") {                                              //默认"0"为 请选择
                showError_Sub(n);
                flag = false;
                return false;
            }
        } else if ($(n).parent("[name^='select-down']").length != 0) {
            if ($(n).children("span").attr("value") == "0") {                                                  //默认"0"
                showError_Sub(n);
                flag = false;
                return false;
            }
        }
        var tValue = $.trim($(n).val());
        if (tValue.indexOf("已选择") < 0 && (tValue.indexOf("选择所属部门") >= 0 || tValue.indexOf("选择") >= 0)) {
            tValue = "";
        }
        var valType = $(n).attr("valType");

        if (typeof $(this).attr("emptyChk") != "undefined") {
            if ($(this).attr("emptyChk") == 0 && tValue == "") {
                return flag;
            }
        }
        //if ($(n).attr("valType") == 'required') {//对不能为空的文本框进行验证
        if ($(n).parent("[name^='select-down']").length == 0 && tValue == '') {
            //显示tips		
            showError_Sub(n);
            flag = false;
        }
            //}
        else if ($(n).attr("valType") == 'OTHER') {//对自定义的文本框进行验证
            if (!(tValue != '' && $.Validator.match({ data: tValue, rule: $(this).attr('valType'), regString: $(this).attr('regString') }))) {
                showError_Sub(n);
                flag = false;
            }
        }
        else {//对使用已定义规则的文本框进行验证			
            //if (tValue == '') {
            //    flag = false;
            //}
            //else {
            if ($(this).attr(valType)) {
                flag = tValue != '' && $.Validator.match({ data: tValue, rule: $(this).attr(valType) });
                if (!flag) {
                    showError_Sub(this, validataMsg[$(this).attr(valType)]);
                    return flag;
                }
            }
            if ($(this).attr("recheck")) {
                flag = tValue == $("#" + $(this).attr("recheck")).val();
                if (!flag) {
                    showError_Sub(this, $(this).attr("recMsg"));
                    return flag;
                }
            }
            if ($(this).attr("ajaxurl")) {
                $.ajax({
                    url: $(this).attr("ajaxurl"), async: false, type: 'post', dataType: "text", headers: { token: checkToken }, data: { value: tValue },
                    success: function (data) {
                        if (data != "") {
                            flag = false;
                            showError_Sub(this, data);
                            return flag;
                        }
                    }
                });
            }
            if ($(this).attr("function")) {
                var rtMsg = eval($(this).attr("function"))(this);
                if (rtMsg != "") {
                    flag = false;
                    showError_Sub(this, rtMsg);
                    return flag;
                }
            }
            //}
        }
        if (!flag) {
            return flag;
        }
    });
    return flag;
};


//下面是测试代码，不属于验证器的功能代码之内
//用原型的方式来模拟js的类
function Validators() {

};

Validators.prototype.subByJs = function (id) {
    if (beforeSubmit(id)) {
        subIndex = 0;
        return true;
        //todo
    }
    else {
        return false;
    }
};