$(function () {
    if (localStorage.userId) {
        //如果登录了，根据身份分发内容
        identificationView(localStorage.userId, localStorage.userIdentification);
        //滚动加载(V)
        scollLoadMore();
        //点击加载更多条目(V)
        clickLoadMore();
    }
});


/* *
 * @brief 不同身份可看见的订单列表
 * @param {number} userId 员工的编号
 *        {string} userIdentification 员工身份
 * @return null
 * */
function identificationView(userId, userIdentification) {
    /* *
     * 将所有未接订单显示在列表中
     * */
    $.ajax({
        url: "order-api/get_orders/" + userIdentification + "/" + userId + "/wait",
        type: "get",
        success: function (msg) {
            waitOrders = msg;
            waitOrdersNum = waitOrders.length;
            //角标
            if (waitOrdersNum == 0) {
                $(".weui-badge").css("display", "none");
            } else {
                $(".weui-badge").text(waitOrdersNum);
            }
            var self = $(".weui-panel.weui-panel_access");
            var panel = $(self).find("#wait-orders");
            //判断是否缓存，决定加载的条目
            if (cache) {
                panel.empty();
                addItem(self, panel, waitOrders, waitOrderPosition, cache.waitOrderPosition);
                waitOrderPosition = cache.waitOrderPosition;
            } else {
                //加入条目（先加入5条）
                addItem(self, panel, waitOrders, waitOrderPosition, 5);
                localStorage.needCache = true;
            }
            //绑定条目点击事件
            itemOnclik(panel, 'wait');
            //绑定滑动事件
            createSlideItem();
        },
        error: function (xhr, textstatus, thrown) {
            console.log(xhr);
        }
    });
    /* *
     * 将所有正在进行的订单显示在列表中
     * */
    $.ajax({
        url: "order-api/get_orders/" + userIdentification + "/" + userId + "/underway",
        type: "get",
        success: function (msg) {
            underwayOrders = msg;
            //加入条目
            var self = $(".weui-panel.weui-panel_access");
            var panel = $(self).find("#underway-orders");
            if (cache && cacheId == 'order-manage') {
                panel.empty();
                addItem(self, panel, underwayOrders, underwayOrderPosition, cache.underwayOrderPosition);
                underwayOrderPosition = cache.underwayOrderPosition;
            } else if (!cache) {
                addItem(self, panel, underwayOrders, underwayOrderPosition, 2);
            }
            //绑定条目点击事件
            itemOnclik(panel, 'underway');
        },
        error: function (xhr, textstatus, thrown) {
            console.log(xhr);
        }
    });
    /* *
     * 将所有已完成的订单显示在列表中
     * */
    $.ajax({
        url: "order-api/get_orders/" + userIdentification + "/" + userId + "/completed",
        type: "get",
        success: function (msg) {
            completedOrders = msg;
            //加入条目
            var self = $(".weui-panel.weui-panel_access");
            var panel = $(self).find("#completed-orders");
            if (cache && cacheId == 'order-manage') {
                panel.empty();
                addItem(self, panel, completedOrders, completedOrderPosition, cache.completedOrderPosition);
                completedOrderPosition = cache.completedOrderPosition;
            } else if (!cache) {
                addItem(self, panel, completedOrders, completedOrderPosition, 2);
            }
            //绑定条目点击事件
            itemOnclik(panel, 'completed');
        },
        error: function (xhr, textstatus, thrown) {
            console.log(xhr);
        }
    });
}

/* *
 * @brief 一次性添加多个条目
 * @param {object} self  要加载条目的页面样式名
 *        {object} panel 要加载条目的面板容器样式名
 *        {array} diffOrders 特定类型的订单
 *        {number} itemCnt 一次性加载订单的条数
 * @return null
 * */
function addItem(self, panel, diffOrders, diffOrderPosition, itemCnt) {
    var tempPosition = diffOrderPosition[0];
    for (var i = diffOrderPosition[0]; i < tempPosition + itemCnt; i++) {
        if (diffOrders[i]) {
            //缩略图显示
            var thumbnail;
            if (diffOrders[i][15]) {
                //有图
                thumbnail = diffOrders[i][15].split(",")[0];
            } else {
                //无图使用默认图片
                thumbnail = "../static/img/thumbnail.png";
            }
            $(self).find(panel).append('<a href="#" class="weui-media-box weui-media-box_appmsg swipte_item">\n' +
                '                        <div class="weui-media-box__hd">\n' +
                '                            <img class="weui-media-box__thumb" src="' + thumbnail + '">\n' +
                '                        </div>\n' +
                '                        <div class="weui-media-box__bd">\n' +
                '                            <h4 class="weui-media-box__title">' + diffOrders[i][2] + '</h4>\n' +
                '                            <p class="weui-media-box__desc" name="' + diffOrders[i][14] + '">' + diffOrders[i][0] + '</p>\n' +
                '                        </div>\n' +
                '                        <li class="weui-swiped-btn weui-swiped-btn_warn swipe_btn">拒接</li>\n' +
                '                        <li class="weui-swiped-btn accept_btn">接单</li>\n' +
                '                    </a>');
        } else {
            //到达底部
            return;
        }
        diffOrderPosition[0] = i + 1;
    }
}

/* *
 * @brief 滚动加载
 * @param null
 * @return null
 * */
function scollLoadMore() {
    $(".infinite").infinite().on("infinite", function () {
        var self = this;
        var panel = $(self).find(".weui-panel__bd");
        var diffOrders, diffOrderPosition;
        if (panel.attr("id") == "wait-orders") {
            diffOrders = waitOrders;
            diffOrderPosition = waitOrderPosition;
        } else if (panel.attr("id") == "underway-orders") {
            diffOrders = underwayOrders;
            diffOrderPosition = underwayOrderPosition;
        } else if (panel.attr("id") == "completed-orders") {
            diffOrders = completedOrders;
            diffOrderPosition = completedOrderPosition;
        }
        loadMore(self, panel, diffOrders, diffOrderPosition);
    });
}

/* *
 * @brief 点击加载更多条目
 * @param null
 * @return null
 * */
function clickLoadMore() {
    $(".weui-loadmore").on("click", function () {
        var self = $(".infinite");
        var panel = $(this).siblings(".weui-panel__bd");
        var diffOrders, diffOrderPosition, state;
        if (panel.attr("id") == "wait-orders") {
            diffOrders = waitOrders;
            diffOrderPosition = waitOrderPosition;
            state = 'wait';
        } else if (panel.attr("id") == "underway-orders") {
            diffOrders = underwayOrders;
            diffOrderPosition = underwayOrderPosition;
            state = 'underway';
        } else if (panel.attr("id") == "completed-orders") {
            diffOrders = completedOrders;
            diffOrderPosition = completedOrderPosition;
            state = 'completed';
        }
        loadMore(self, panel, diffOrders, diffOrderPosition, state);
    });
}

/* *
 * @brief 加载更多条目
 * @param {object} self 要加载条目的页面样式名
 * 		  {object} panel 要加载条目的面板容器样式名
 * 		  {array} diffOrders 特定类型的订单
 * @return null
 * */
function loadMore(self, panel, diffOrders, diffOrderPosition, state) {
    if (self.loading) return;
    self.loading = true;
    setTimeout(function () {
        //加入条目
        addItem(self, panel, diffOrders, diffOrderPosition, 5);
        //绑定条目点击事件
        itemOnclik(self, state);
        //绑定滑动事件
        createSlideItem();
        self.loading = false;
    }, 500); //模拟延迟
}

/* *
 * @brief 列表项左滑右滑功能创建
 * 		  使用方法：$('.itemWipe').touchWipe({itemBtn: '.item-button'});
 * @param itemWipe	条目样式名
 * 		  itemBtn	滑动后出现的按钮样式名(左右按钮大小应一致，传入任一个即可)
 * @return 带滑动效果的列表项
 * */
function createSlideItem() {
    $('.weui-media-box.weui-media-box_appmsg.swipte_item').touchWipe({
        itemBtn: '.weui-swiped-btn.weui-swiped-btn_warn.swipe_btn'
    });
    /*绑定按钮点击事件*/
    //拒绝按钮
    $(".weui-swiped-btn.weui-swiped-btn_warn.swipe_btn").click(function () {
        if (localStorage.userIdentification == '采购') {
            var self = this;
            $.confirm("您确定要拒接此订单吗?", "注意", function () {
                //确认后记录入数据库
                offerState($(self).parent().find(".weui-media-box__desc").text(), localStorage.userId, '拒接', 0);
                self.parentElement.remove();
                if (--waitOrdersNum == 0) {
                    $(".weui-badge").css("display", "none");
                } else {
                    $(".weui-badge").text(waitOrdersNum);
                }
            }, function () {
                //取消并返回
            });
        } else {
            //客服和管理员可以取消订单
            var self = this;
            $.confirm("您确定要取消此订单吗?", "注意", function () {
                //确认后更改订单状态为已取消
                updateOrderState($(self).parent().find(".weui-media-box__desc").text(), "已取消");
                self.parentElement.remove();
                if (--waitOrdersNum == 0) {
                    $(".weui-badge").css("display", "none");
                } else {
                    $(".weui-badge").text(waitOrdersNum);
                }
            }, function () {
                //取消并返回
            });
        }

    });
    //接受按钮
    $(document).on("click", ".weui-swiped-btn.accept_btn", function () {
        if (localStorage.userIdentification == '采购') {
            var self = this;
            $.prompt({
                text: "请输入您可提供的最低价格",
                title: "报价",
                onOK: function (text) {
                    //获得报价
                    text = $(this).find("#weui-prompt-input").val();
                    //判断输入是否为正数
                    if (/^(\-|\+)?\d+(\.\d+)?$/.test(text)) {
                        //报价成功后记录入数据库
                        $.alert("您报出的价格是:" + parseFloat(text) + "元", "报价成功");
                        offerState($(self).parent().find(".weui-media-box__desc").text(), localStorage.userId, '接单', parseFloat(text));
                        self.parentElement.remove();
                        if (--waitOrdersNum == 0) {
                            $(".weui-badge").css("display", "none");
                        } else {
                            $(".weui-badge").text(waitOrdersNum);
                        }
                    } else {
                        $.alert("请输入正确报价", "错误");
                    }
                },
                onCancel: function () {
                    //取消后返回订单列表
                },
                input: '0'
            });
        } else {
            //如果是管理员和客服直接进入订单完善页面
        }
    });
}

/* *
 * @brief 把接单情况记录入数据库
 * @param {number} order_id 订单编号
 *        {number} user_id 员工编号
 *        {string} is_receive 是否接单
 *        {float} 报出的价格
 * @return null
 * */
function offerState(order_id, user_id, is_receive, price_offer) {
    var params = {};
    params.orderId = order_id;
    params.userId = user_id;
    params.isReceive = is_receive;
    params.priceOffer = price_offer;
    console.log(params);
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

/* *
 * @brief 点击条目进入条目详情页面
 * @param {object} panel 要加载条目的面板容器样式名
 *        {string} state 订单状态
 * @return null
 * */
function itemOnclik(panel, state) {
    $($(panel).find(".weui-media-box__bd")).on("click", function () {
        orderId = parseInt($(this).children("p").text());
        orderState = $(this).children("p").attr("name");
        var params = {};
        params.orderId = orderId;
        $.ajax({
            url: "list-detail.html",
            type: "post",
            contentType: "application/json;charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(params),
            success: function (msg) {
                //记录下返回的订单详情
                sessionStorage.listDetail = JSON.stringify(msg);
                if (localStorage.userIdentification == '客服' && state == 'wait') {
                    //如果是客服，且是未完善订单，则跳转到完善页面
                    window.location.href = "customer-order.html";
                } else {
                    window.location.href = "list-detail.html?orderId=" + orderId + "&orderState=" +
                        encodeURI(encodeURI(orderState)) + "&identification="
                        + encodeURI(encodeURI(localStorage.userIdentification));
                }
            }
        });
    });
}

