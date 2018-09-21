/* * 
 * @brief 列表项左滑右滑功能创建
 * 		  使用方法：$('.itemWipe').touchWipe({itemBtn: '.item-button'});
 * @param itemWipe	条目样式名
 * 		  itemBtn	滑动后出现的按钮样式名(左右按钮大小应一致，传入任一个即可)
 * @return 带滑动效果的列表项
 * */
(function ($) {
    $.fn.touchWipe = function (option) {
        var defaults = {
            itemBtn: '.item-delete', //删除元素
        };
        var opts = $.extend({}, defaults, option); //配置选项
        var btnWidth = $(opts.itemBtn).width() + 32;

        var initX; //触摸位置X
        var initY; //触摸位置Y
        var moveX; //滑动时的位置X
        var moveY; //滑动时的位置Y
        var X = 0; //移动距离X
        var Y = 0; //移动距离Y
        var flagX = 0; //是否是左右滑动 0为初始，1为左右，2为上下，在move中设置，在end中归零
        var objX = 0; //目标对象位置

        $(this).on('touchstart', function (event) {
            //console.log('start..');
            var obj = this;
            initX = event.targetTouches[0].pageX;
            initY = event.targetTouches[0].pageY;
            //console.log(initX + ':' + initY);
            objX = (obj.style.WebkitTransform.replace(/translateX\(/g, "").replace(/px\)/g, "")) * 1;  //点击时偏移的像素
            //console.log(objX);
            //objX等于0说明没有偏移，大于0说明向右偏移了，小于0说明向左偏移了
            if (objX == 0) {
                $(this).on('touchmove', function (event) {
                    // 判断滑动方向，X轴阻止默认事件，Y轴跳出使用浏览器默认
                    if (flagX == 0) {
                        setScrollX(event);
                        return;
                    } else if (flagX == 1) {
                        event.preventDefault();
                    } else {
                        return;
                    }

                    var obj = this;
                    moveX = event.targetTouches[0].pageX;
                    X = moveX - initX;
                    if (X >= 0) {
                        //右滑
                        var l = Math.abs(X);
                        obj.style.WebkitTransform = "translateX(" + l + "px)";
                        if (l > btnWidth) {
                            l = btnWidth;
                            obj.style.WebkitTransform = "translateX(" + l + "px)";
                        }
                    } else if (X < 0) {
                        //左滑
                        var l = Math.abs(X);
                        obj.style.WebkitTransform = "translateX(" + -l + "px)";
                        if (l > btnWidth) {
                            l = btnWidth;
                            obj.style.WebkitTransform = "translateX(" + -l + "px)";
                        }
                    }
                });
            } else if (objX < 0) {
                $(this).on('touchmove', function (event) {
                    // 判断滑动方向，X轴阻止默认事件，Y轴跳出使用浏览器默认
                    if (flagX == 0) {
                        setScrollX(event);
                        return;
                    } else if (flagX == 1) {
                        event.preventDefault();
                    } else {
                        return;
                    }

                    var obj = this;
                    moveX = event.targetTouches[0].pageX;
                    X = moveX - initX;
                    if (X >= 0) {
                        var r = -btnWidth + Math.abs(X);
                        obj.style.WebkitTransform = "translateX(" + r + "px)";
                        if (r > 0) {
                            r = 0;
                            obj.style.WebkitTransform = "translateX(" + r + "px)";
                        }
                    } else {
                        //用户继续向左滑动，保持不动
                        obj.style.WebkitTransform = "translateX(" + -btnWidth + "px)";
                    }
                });
            } else {
                $(this).on('touchmove', function (event) {
                    // 判断滑动方向，X轴阻止默认事件，Y轴跳出使用浏览器默认
                    if (flagX == 0) {
                        setScrollX(event);
                        return;
                    } else if (flagX == 1) {
                        event.preventDefault();
                    } else {
                        return;
                    }

                    var obj = this;
                    moveX = event.targetTouches[0].pageX;
                    X = moveX - initX;
                    if (X <= 0) {
                        var r = btnWidth + Math.abs(X);
                        obj.style.WebkitTransform = "translateX(" + r + "px)";
                        if (r > 0) {
                            r = 0;
                            obj.style.WebkitTransform = "translateX(" + r + "px)";
                        }
                    } else {
                        //用户继续向右滑动，保持不动
                        obj.style.WebkitTransform = "translateX(" + btnWidth + "px)";
                    }
                });
            }
        })

        //结束时判断，并自动滑动到底或返回
        $(this).on('touchend', function (event) {
            var obj = this;
            objX = (obj.style.WebkitTransform.replace(/translateX\(/g, "").replace(/px\)/g, "")) * 1;
            if (objX > -btnWidth / 2 && objX <= 0) {
                obj.style.transition = "all 0.2s";
                obj.style.WebkitTransform = "translateX(" + 0 + "px)";
                obj.style.transition = "all 0";
                objX = 0;
            } else if (objX > btnWidth / 2) {
                obj.style.transition = "all 0.2s";
                obj.style.WebkitTransform = "translateX(" + btnWidth + "px)";
                obj.style.transition = "all 0";
            } else if (objX < btnWidth / 2 && objX > 0) {
                obj.style.transition = "all 0.2s";
                obj.style.WebkitTransform = "translateX(" + 0 + "px)";
                obj.style.transition = "all 0";
                objX = 0;
            } else {
                obj.style.transition = "all 0.2s";
                obj.style.WebkitTransform = "translateX(" + -btnWidth + "px)";
                obj.style.transition = "all 0";
                objX = -btnWidth;
            }
            flagX = 0;
        })

        //设置滑动方向
        function setScrollX(event) {
            moveX = event.targetTouches[0].pageX;
            moveY = event.targetTouches[0].pageY;
            X = moveX - initX;
            Y = moveY - initY;

            if (Math.abs(X) > Math.abs(Y)) {
                flagX = 1;
            } else {
                flagX = 2;
            }
            return flagX;
        }

        //链式返回
        return this;
    };

})(jQuery);