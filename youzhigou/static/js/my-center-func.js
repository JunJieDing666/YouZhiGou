$(function () {
    /* *
     * 个人信息登录操作(VM)
     * */
    if (localStorage.userAccount && localStorage.userPsd) {
        //载入登录信息
        $("#my_center_name").text(localStorage.userName);
        $("#my_center_phone").text(localStorage.userPhone);
        $("#my_center_id").text(localStorage.userIdentification);
        //设置标志位
        isLogin = true;
    } else {
        //设置标志位
        isLogin = false;
    }
    //绑定点击事件
    $('#login').on('click', function () {
        loginFunc(isLogin);
    });

});

/* *
 * @brief 弹出登录对话框
 * @param null
 * @return null
 * */
function loginDialog() {
    $.login({
        title: '登录',
        text: '请输入用户名和密码',
        onOK: function (username, password) {
            var param = {};
            param.username = username;
            param.password = password;
            $.ajax({
                url: "mycenter-api/login",
                type: "post",
                contentType: "application/json;charset=UTF-8",
                dataType: "json",
                data: JSON.stringify(param),
                success: function (data) {
                    if (data.msg) {
                        $.toast('登录成功!');
                        //载入登录信息
                        $("#my_center_name").text(data.userName);
                        $("#my_center_phone").text(data.userPhone);
                        $("#my_center_id").text(data.userIdentification);
                        //保存账号密码
                        localStorage.userAccount = username;
                        localStorage.userPsd = password;
                        //保存登录信息
                        localStorage.userId = data.userId;
                        localStorage.userName = data.userName;
                        localStorage.userPhone = data.userPhone;
                        localStorage.userIdentification = data.userIdentification;
                        //首次登录不需要缓存
                        localStorage.needCache = false;
                        isLogin = true;
                        //刷新页面
                        location.reload();
                    } else {
                        $.toast('账号密码错误!', 'cancel');
                    }
                },
                error: function (xhr, textstatus, thrown) {

                }
            });
        },
        onCancel: function () {
        }
    });
}

/* *
 * @brief 弹出登出对话框
 * @param null
 * @return null
 * */
function logoutDialog() {
    $.confirm("您确定要退出当前账号密码吗?", "退出登录", function () {
        //删除对应账号的缓存
        localStorage.removeItem('userAccount');
        localStorage.removeItem('userPsd');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userPhone');
        localStorage.removeItem('userIdentification');
        sessionStorage.removeItem('index');
        sessionStorage.removeItem('order-manage');
        //清除登录信息
        $("#my_center_name").text("");
        $("#my_center_phone").text("");
        $("#my_center_id").text("");
        isLogin = false;
        $.toast("退出成功");
        //刷新页面
        location.reload();
    }, function () {
        //取消操作
    });
}

/* *
 * @brief 根据登录状态，弹出相应的对话框
 * @param {boolean} state 登录状态标志位
 * @return null
 * */
function loginFunc(state) {
    switch (state) {
        case false:
            loginDialog();
            break;
        case true:
            logoutDialog();
            break;
    }
}