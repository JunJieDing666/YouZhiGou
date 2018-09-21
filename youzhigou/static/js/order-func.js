$(function () {
    /* *
     * 地址选择器初始化(VM)
     * */
    $("#city-picker").cityPicker({
        title: "请选择收货地址"
    });

    /* *
     * 数量加减(VM)
     * */
    //加的效果
    $(".add").click(function () {
        var n = $(this).prev().val();
        var num = parseInt(n) + 1;
        if (num == 0) {
            return;
        }
        $(this).prev().val(num);
    });
    //减的效果
    $(".minus").click(function () {
        var n = $(this).next().val();
        var num = parseInt(n) - 1;
        if (num == 0) {
            return
        }
        $(this).next().val(num);
    });

    /* *
     * 图片上传
     * */
    var uploadCount = 0,
        uploadList = [],
        uploadSuccessCount = 0;
    var uploadCountDom = document.getElementById("uploadCount");
    weui.uploader('#uploader', {
        url: 'img-api/upload_imgs',
        auto: true,
        type: 'file',
        fileVal: 'fileVal',
        compress: {
            width: 1600,
            height: 1600,
            quality: .8
        },
        onBeforeQueued: function onBeforeQueued(files) {
            if (["image/jpg", "image/jpeg", "image/png", "image/gif"].indexOf(this.type) < 0) {
                weui.alert('请上传图片');
                return false;
            }
            if (this.size > 5 * 1024 * 1024) {
                weui.alert('请上传不超过5M的图片');
                return false;
            }
            if (files.length > 4) {
                // 防止一下子选中过多文件
                weui.alert('最多只能上传4张图片，请重新选择');
                return false;
            }
            if (uploadCount + 1 > 4) {
                weui.alert('最多只能上传4张图片');
                return false;
            }
            if (localStorage.userId == undefined) {
                weui.alert('请先登录!');
                return false;
            }

            ++uploadCount;
            uploadCountDom.innerHTML = uploadCount;
        },
        onQueued: function onQueued() {
            uploadList.push(this);
            //console.log(this);
            //手动上传
            /*var self = this;
            $('#preview_confirm').on('click',function(){
                self.upload();
            });*/
        },
        onBeforeSend: function onBeforeSend(data, headers) {
            $("#submit_order").addClass("weui-btn_disabled");
            // return false; // 阻止文件上传
        },
        onProgress: function onProgress(procent) {
            //console.log(this, procent);
        },
        onSuccess: function onSuccess(ret) {
            if (ret.result == true) {
                uploadSuccessCount++;
                if (uploadSuccessCount == uploadCount) {
                    $("#submit_order").removeClass("weui-btn_disabled");
                }
            }
            var uploadID = this.id;
            $("#uploaderFiles li").each(function () {
                if ($(this).attr("data-id") == uploadID) {
                    $(this).attr("DB-id", ret.DBId);
                    $(this).attr("url", ret.url);
                }
                console.log(this);
            });
            //console.log(this, ret);
        },
        onError: function onError(err) {
            console.log(this, err);
        }
    });

    /* *
     * 缩略图预览
     * */
    document.querySelector('#uploaderFiles').addEventListener('click', function (e) {
        var target = e.target;

        while (!target.classList.contains('weui-uploader__file') && target) {
            target = target.parentNode;
        }
        if (!target) return;

        var url = target.getAttribute('url');
        var DBId = target.getAttribute('db-id');
        var id = target.getAttribute('data-id');

        console.log(target);

        var gallery = weui.gallery(url, {
            className: 'custom-name',
            onDelete: function () {
                var isDelete = confirm('确定删除该图片？');
                if (isDelete) {
                    --uploadCount;
                    uploadCountDom.innerHTML = uploadCount;
                    for (var i = 0, len = uploadList.length; i < len; ++i) {
                        var file = uploadList[i];
                        if (file.id == id) {
                            $("#uploaderFiles li").each(function () {
                                if ($(this).attr("data-id") == id) {
                                    var param = {};
                                    param.DBId = DBId;
                                    param.imgUrl = url;
                                    $.ajax({
                                        url: "img-api/delete_imgs",
                                        type: "delete",
                                        contentType: "application/json;charset=UTF-8",
                                        dataType: "json",
                                        data: JSON.stringify(param),
                                        success: function (msg) {
                                            console.log(msg);
                                        },
                                        error: function (xhr, textstatus, thrown) {

                                        }
                                    });
                                }
                            });
                            file.stop();
                            break;
                        }
                    }
                    target.remove();
                    gallery.hide();
                }
            }
        });
    });

    /* *
     * 地址栏数字限制
     * */
    $("#addr_detail").on("keyup", function () {
        if ($("#addr_detail").val().length > 50) {

        } else {
            $("#text_limit").text($("#addr_detail").val().length);
        }
    });

    /* *
     * 确认下单信息界面显示(VM)
     * */
    $("#submit_order").click(function () {
        if (localStorage.userId) {
            //获得填写的所有信息
            goodsCNName = $("#goods_cn_name").val();
            goodsEnName = $("#goods_en_name").val();
            specifications = $("#specifications").val();
            goodsNum = parseInt($(".num").val());
            msg = $("#msg").val();
            refUrl = $("#ref_url").val();
            userName = $("#user_name").val();
            userPhone = $("#user_phone").val();
            addr = $("#city-picker").val().replace(/\s+/g, "") + $("#addr_detail").val();
            pickUpMode = $(".weui-check:checked").parent().prev().children().html();
            //图片索引集合
            imgsIdArr = [];
            imgsPathArr = [];
            $("#uploaderFiles li").each(function () {
                imgsIdArr.push($(this).attr("DB-id"));
                imgsPathArr.push($(this).attr("url"));
            });
            imgsIdArr = imgsIdArr.toString();
            imgsPathArr = imgsPathArr.toString();

            if (goodsCNName && specifications && goodsNum && userName && userPhone && addr) {
                //切换到预览页
                $(".good_container").css('display', 'none');
                $(".weui-form-preview").css('display', 'block');

                //预览页信息初始化
                $("#preview_goods").text(goodsCNName);
                $("#preview_specifications").text(specifications);
                $("#preview_goods_num").text(goodsNum);
                $("#preview_user_name").text(userName);
                $("#preview_addr").text(addr);
                $("#preview_pickup_mode").text(pickUpMode);
            } else {
                $.toast("请将信息填写完整!", "text");
            }
        } else {
            loginDialog();
            $.toast("请先登录!", "text");
        }


    });
    //取消
    $("#preview_cancel").click(function () {
        $(".good_container").css('display', 'block');
        $(".weui-form-preview").css('display', 'none');
    });
    //确定
    $("#preview_confirm").click(function () {
        $(".good_container").css('display', 'block');
        $(".weui-form-preview").css('display', 'none');
        //上传表单
        var orderDetail = {};
        orderDetail.generationTime = new Date().getTime();
        orderDetail.goodsCNName = goodsCNName;
        orderDetail.goodsEnName = goodsEnName;
        orderDetail.specifications = specifications;
        orderDetail.goodsNum = goodsNum;
        orderDetail.msg = msg;
        orderDetail.refUrl = refUrl;
        orderDetail.imgsIdArr = imgsIdArr;
        orderDetail.imgsPathArr = imgsPathArr;
        orderDetail.userName = userName;
        orderDetail.userPhone = userPhone;
        orderDetail.addr = addr;
        orderDetail.pickUpMode = pickUpMode;
        orderDetail.workerId = parseInt(localStorage.userId);
        orderDetail.orderState = orderState;
        $.ajax({
            url: "order-api/save_order",
            type: "post",
            contentType: "application/json;charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(orderDetail),
            success: function (msg) {
                console.log(msg);
            },
            error: function (xhr, textstatus, thrown) {

            },
            async: false
        });
        //清空表单
        $('#uploaderFiles').empty();
        location.reload();
    });

});