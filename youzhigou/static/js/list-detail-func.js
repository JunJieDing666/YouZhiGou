$(function () {
    /* *
     * 初始化页面
     * */
    //获得订单编号和状态
    var params = window.location.href.split("?")[1];
    var orderId = params.split("&")[0].split("=")[1];
    var orderState = decodeURI(decodeURI(params.split("&")[1].split("=")[1]));
    var userIdentification = decodeURI(decodeURI(params.split("&")[2].split("=")[1]));
    //根据订单状态显示不同按键（客服——关闭，管理员——取消订单、关闭，采购——接单、发货、关闭）
    if (userIdentification == '采购') {
        if (orderState == "未接单") {
            $("#refuse-order").css("display", "block");
            $("#accept-order").css("display", "block");
        } else if (orderState.search("已接单") != -1) {
            $("#send-goods").css("display", "block");
        } else if (orderState == "已完成") {
            $("#query-express").css("display", "block");
        }
    } else if (userIdentification == '管理员' || userIdentification == '客服') {
        if (orderState == "已完成") {
            $("#query-express").css("display", "block");
        } else {
            $("#cancel-order").css("display", "block");
        }
    }
    //获得该订单详细信息
    var detail = JSON.parse(sessionStorage.listDetail);
    //将信息填写入页面中
    $("#goods_name_cn").text(detail.goodsNameCN);
    $("#goods_name_en").text(detail.goodsNameEN);
    $("#goods_specifications").text(detail.specifications);
    $("#goods_num").text(detail.goodsNum);
    $("#buyer_msg").text(detail.msg);
    $("#ref_url").text(detail.refUrl);
    $("#user_name").text(detail.deliveryName);
    $("#user_phone").text(detail.deliveryPhone);
    $("#user_addr").text(detail.deliveryAddr);
    $("#pickup_mode").text(detail.deliveryMode);
    $("#order_state").text(orderState);
    //将图片加入显示框内
    if (detail.imgPathList) {
        //图片集合非空才进行遍历显示
        for (var i = 0; i < detail.imgPathList.split(",").length; i++) {
            $(".weui-uploader__files").append('<img class="weui-uploader__file" src="' + detail.imgPathList.split(",")[i] + '"\n' +
                'style="border:#e5e5e5 solid 1px;width: 70px;height: 70px"/>');
        }
    }
    //缩略图预览
    document.querySelector('#uploaderFiles').addEventListener('click', function (e) {
        var target = e.target;

        while (!target.classList.contains('weui-uploader__file') && target) {
            target = target.parentNode;
        }
        if (!target) return;

        var url = target.getAttribute('src');

        var gallery = weui.gallery(url, {
            className: 'custom-name',
            onDelete: function () {
            }
        });
    });

    /* *
     * 接单报价
     * */
    $("#accept-order").on("click", function () {
        $.prompt({
            text: "请输入您可提供的最低价格",
            title: "报价",
            onOK: function (text) {
                //获得报价
                text = $(this).find("#weui-prompt-input").val();
                //判断输入是否为正数
                if (/^(\-|\+)?\d+(\.\d+)?$/.test(text)) {
                    //报价成功后记录入数据库
                    var success = $.alert("您报出的价格是:" + parseFloat(text) + "元", "报价成功");
                    $(success).find(".weui-dialog__btn.primary").on("click", function () {
                        offerState(orderId, localStorage.userId, '接单', parseFloat(text));
                        window.history.back();
                    });
                } else {
                    $.alert("请输入正确报价", "错误");
                }
            },
            onCancel: function () {
                //取消后返回订单列表
            }
        });
    });

    /* *
     * 拒接
     * */
    $("#refuse-order").on("click", function () {
        $.confirm("您确定要拒接此订单吗?", "注意", function () {
            //确认,记录入数据库
            offerState(orderId, localStorage.userId, '拒接', 0);
            window.history.back();
        }, function () {
            //取消并返回
        });
    });

    /* *
     * 发货
     * */
    $("#send-goods").on("click", function () {
        //打开物流填写页面
        $.modal({
            title: "发货",
            text: '<p class="weui-prompt-text">' + '请输入快递单号'
            + '</p><input type="text" class="weui-input weui-prompt-input" id="express-code"/>',
            buttons: [
                {text: "取消", className: "default"},
                {
                    text: "确定",
                    onClick: function () {
                        var expressCode = $(this).find('#express-code').val();
                        var express = {};
                        express.orderId = orderId;
                        express.expressCode = expressCode;
                        var res;
                        $.ajax({
                            url: "order-api/get-express",
                            type: "post",
                            contentType: "application/json;charset=UTF-8",
                            dataType: "json",
                            data: JSON.stringify(express),
                            success: function (msg) {
                                res = msg;
                                console.log(msg);
                            },
                            error: function (xhr, textstatus, thrown) {

                            },
                            async: false
                        });
                        //正确抓取到物流后则改变订单状态为已完成，同时记录快递单号和快递公司
                        if (res.Shipper && res.ShipperCode) {
                            updateOrderState(orderId, "已完成");
                            window.history.back();
                        }
                    }
                }
            ]
        });
    });

    /* *
     * 取消订单
     * */
    $("#cancel-order").on("click", function () {
        //在数据库中修改订单状态为已取消
        updateOrderState(orderId, "已取消");
        window.history.back();
    });

    /* *
     * 查看物流
     * */
    $("#query-express").on("click", function () {
        window.location.href = "order-api/subscribe-express?orderId=" + orderId;
    });
});

/* *
 * @brief 把接单情况记录入数据库
 * @param
 * @return
 * */
function offerState(order_id, user_id, is_receive, price_offer) {
    var params = {};
    params.orderId = order_id;
    params.userId = user_id;
    params.isReceive = is_receive;
    params.priceOffer = price_offer;
    $.ajax({
        url: "order-api/offer_state",
        type: "post",
        contentType: "application/json;charset=UTF-8",
        dataType: "json",
        data: JSON.stringify(params),
        success: function (msg) {
            console.log(msg);
        },
        error: function (xhr, textstatus, thrown) {

        }
    });
}

/* *
 * @brief 更新订单的状态
 * @param {number} order_id 订单编号
 *        {string} order_state 订单状态
 * @return null
 * */
function updateOrderState(order_id, order_state) {
    var params = {};
    params.orderId = order_id;
    params.orderState = order_state;
    $.ajax({
        url: "order-api/update_order_state",
        type: "post",
        contentType: "application/json;charset=UTF-8",
        dataType: "json",
        data: JSON.stringify(params),
        success: function (msg) {
            console.log(msg);
        },
        error: function (xhr, textstatus, thrown) {

        }
    });
}
