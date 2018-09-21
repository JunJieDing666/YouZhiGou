//商品中文名
var goodsCNName;
//商品英文名
var goodsEnName;
//商品规格
var specifications;
//购买数量
var goodsNum;
//买家留言
var msg;
//参考商品链接
var refUrl;
//图片标志符数组
var imgsIdArr = [];
//图片存放地址数组
var imgsPathArr = [];
//收货人
var userName;
//联系电话
var userPhone;
//收货地址
var addr;
//收货方式
var pickUpMode;
//工作人员编号
var workerId = 0;
//订单状态
var orderState = "未接单";
//缓存下来的订单详情
var detail;

//所有未接订单信息
var waitOrders;
//当前浏览到的未接订单位置
var waitOrderPosition = [0];
//未接订单个数
var waitOrdersNum = 0;
//所有正在进行订单信息
var underwayOrders;
//当前浏览到的正在进行订单位置
var underwayOrderPosition = [0];
//所有已完成订单信息
var completedOrders;
//当前浏览到的已完成订单位置
var completedOrderPosition = [0];
//缓存下来的订单条目
var cache;
var cacheId = $(".cache").attr("name");

//登录状态
var isLogin;

window.onload = function () {
    if (localStorage.userId) {
        //载入缓存的列表
        loadCache(cacheId);
    }
}

window.onunload = function () {
    if (localStorage.userId && localStorage.needCache == 'true') {
        //离开页面时生成缓存
        createCache(cacheId);
    }
}

/* *
 * @brief 可对指定多个控件进行内容和位置的缓存
 * @param cacheId 缓存元素的id
 * @return null
 * */
function createCache(cacheId) {
    //对内容进行缓存
    var list = [];
    var listController = $('.cache');
    $.each(listController, function (index, value, array) {
        list.push(value.innerHTML);
    })
    //对浏览到的位置进行缓存
    var top = [];
    var topController = $(".cache").find(".top");
    $.each(topController, function (index, value, array) {
        top.push(value.scrollTop);
    })
    //存入sessionstorage中
    sessionStorage.setItem(cacheId, JSON.stringify({
        list: list,
        top: top,
        waitOrderPosition: waitOrderPosition,
        underwayOrderPosition: underwayOrderPosition,
        completedOrderPosition: completedOrderPosition
    }));
}

/* *
 * @breif 可对指定多个控件加载缓存
 * @param 加载缓存的id
 * @return null
 * */
function loadCache(cacheId) {
    //一定要放在整个js文件最前面
    cache = sessionStorage.getItem(cacheId);
    if (cache) {
        cache = JSON.parse(cache);
        //还原内容
        var listController = $('.cache');
        $.each(listController, function (index, value, array) {
            value.innerHTML = cache.list[index];
        })
        //还原位置
        var topController = $(".cache").find(".top");
        $.each(topController, function (index, value, array) {
            value.scrollTop = cache.top[index];
        })
    }
}

