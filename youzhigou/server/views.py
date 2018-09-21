# -*- coding: utf-8 -*-

from .resources.order import Order, uploadImgs, deleteImgs, getImgs, saveOrder, OrderManage, userLogin, ListDetail, \
    getOrders, offerState, customerSaveOrder, updateOrder, updateOrderState, getExpress, subscribeExpress, WXPay, \
    getFinalPrice, WXPayResult
from .. import api

'''
RESTful接口
'''
#
# 页面定向(TODO 改成统一定向)
#
# 定向到主页
api.add_resource(Order, '/', '/index.html')
# 定向到订单列表页
api.add_resource(OrderManage, '/order-manage.html')
# 订单详情页面
api.add_resource(ListDetail, '/list-detail.html','/wxpay/list-detail.html')
# 客户下单页面
api.add_resource(customerSaveOrder, '/customer-order.html')

#
# 下单页面
#
# 上传图片
api.add_resource(uploadImgs, '/img-api/upload_imgs')
# 预览图片
api.add_resource(getImgs, '/imgDB/<filename>')
# 删除图片
api.add_resource(deleteImgs, '/img-api/delete_imgs')
# 存储订单信息
api.add_resource(saveOrder, '/order-api/save_order')
# 更新订单信息
api.add_resource(updateOrder, '/order-api/update_order')
# 更新订单状态
api.add_resource(updateOrderState, '/order-api/update_order_state')

#
# 未接订单页面
#
# 获得指定人员的订单信息
api.add_resource(getOrders, '/order-api/get_orders/<identification>/<user_id>/<state>')
# 记录接单情况
api.add_resource(offerState, '/order-api/offer_state')

#
# 已接订单页面
#
# 获取物流公司信息
api.add_resource(getExpress, '/order-api/get-express')
# 获取具体物流信息
api.add_resource(subscribeExpress, '/order-api/subscribe-express')
# 获取商品价格
api.add_resource(getFinalPrice,'/wxpay/order-api/get-final-price')
# 微信支付
api.add_resource(WXPay, '/wxpay/pay-bill')
# 微信支付结果返回
api.add_resource(WXPayResult, '/wxpay/result')

#
# 用户中心
#
# 用户登录
api.add_resource(userLogin, '/mycenter-api/login')
