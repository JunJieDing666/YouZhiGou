# -*- coding: utf-8 -*-
# 第三方库
import copy
import os
import random
import shutil
import time
import traceback
import uuid
from os import path
from threading import Timer

from flask import render_template, make_response, request, send_from_directory
from flask_restful import Resource
from werkzeug.utils import secure_filename

# 自建库
import youzhigou.server.utils.sms as SmsSender
from youzhigou.conf.config import TEMP_UPLOAD_FOLDER, FACTOR_BELOW_100, EXPRESS_APPID, EXPRESS_APPKEY, \
    FACTOR_BETWEEN_100_1000, FACTOR_OVER_1000, SMS_APPID, SMS_APPKEY
from youzhigou.server.utils.DBDao import DBDao
from youzhigou.server.utils.getExpress import get_company
from youzhigou.server.utils.wxpaySDK import UnifiedOrder_pub
from ...conf import config


class Order(Resource):
    def get(self):
        return make_response(render_template('index.html', api_root=config.APP_HOST))


class OrderManage(Resource):
    def get(self):
        return make_response(render_template('order-manage.html', api_root=config.APP_HOST))


class ListDetail(Resource):
    def get(self):
        return make_response(render_template('list-detail.html'))

    def post(self):
        order_id = request.get_json()['orderId']
        if order_id:
            db = DBDao()
            # 从商品表中找到该订单
            try:
                sql = "select * from goods where order_id = %d" % (int(order_id))
                goods = db.getOneBySql(sql)

                if goods:
                    res_data = {'orderId': goods[0], 'orderTime': goods[1], 'goodsNameCN': goods[2],
                                'goodsNameEN': goods[3], 'specifications': goods[4], 'goodsNum': goods[5],
                                'msg': goods[6], 'refUrl': goods[7], 'imgIdList': goods[8],
                                'imgPathList': goods[15], 'deliveryName': goods[9], 'deliveryPhone': goods[10],
                                'deliveryAddr': goods[11], 'deliveryMode': goods[12], 'userId': goods[13],
                                'orderState': goods[14]}
                else:
                    res_data = {'msg': False}
            except:
                res_data = {'msg': 'Error'}
                traceback.print_exc()
        else:
            res_data = {'msg': False}
        return res_data


class getFinalPrice(Resource):
    def post(self):
        order_id = request.get_json()['orderId']
        db = DBDao()
        sql = "select single_price from purchasefinal where order_id = %d" % (int(order_id))
        price = db.getOneBySql(sql)
        # 对价格进行分类处理
        if price:
            final_price = self.getFinalPrice(price[0])
            return {'price': final_price}
        else:
            return {'price': -1}

    def getFinalPrice(self, price):
        factor = 0
        if price <= 100:
            factor = FACTOR_BELOW_100
        elif price > 100 and price < 1000:
            factor = FACTOR_BETWEEN_100_1000
        else:
            factor = FACTOR_OVER_1000
        return round(price * factor, 2)


class uploadImgs(Resource):
    def post(self):
        if request.method == 'POST':
            file = request.files['fileVal']
            if file and file.filename.rsplit('.', 1)[1] in config.ALLOWED_EXTENSIONS:
                DBId = self.create_uid()
                filename = secure_filename(file.filename)
                # 将名字命名为唯一的
                filename = DBId + "." + filename.split(".")[1]
                base_path = path.abspath(path.dirname(__file__))
                upload_path = path.join(base_path, config.UPLOAD_FOLDER)
                file.save(upload_path + filename)
                # 定时4个小时后清除没有下单但上传的图片
                Timer(14400, self.operateImgs, (base_path, upload_path, filename)).start()

                res_data = {'result': True, 'url': config.UPLOAD_FOLDER + filename,
                            'DBId': DBId}
                return res_data

    def create_uid(self):
        return str(uuid.uuid1())

    def operateImgs(self, basePath, uploadPath, fileName):
        # 删除上传的文件
        os.remove(uploadPath + fileName)
        # 如果成功下单了，去临时文件夹拷贝图片回来，并删除临时图片
        if (os.path.exists(path.join(basePath, TEMP_UPLOAD_FOLDER + fileName))):
            shutil.copyfile(path.join(basePath, TEMP_UPLOAD_FOLDER + fileName), uploadPath + fileName)
            os.remove(path.join(basePath, TEMP_UPLOAD_FOLDER + fileName))
            return


class getImgs(Resource):
    def get(self, filename):
        base_path = path.abspath(path.dirname(__file__))
        upload_path = path.join(base_path, config.UPLOAD_FOLDER)
        return send_from_directory(upload_path,
                                   filename)


class deleteImgs(Resource):
    def delete(self):
        data = request.get_json()
        self.data = data
        base_path = path.abspath(path.dirname(__file__))
        upload_file = path.join(base_path, data['imgUrl'])
        if os.path.exists(upload_file):
            os.remove(upload_file)
            return True
        else:
            return False


class saveOrder(Resource):
    def post(self):
        data = request.get_json()
        # 如有图片，拷贝到临时文件夹
        base_path = path.abspath(path.dirname(__file__))
        imgPathList = data['imgsPathArr'].split(',')
        if imgPathList != [u'']:
            for item in imgPathList:
                shutil.copyfile(path.join(base_path, item), path.join(base_path, TEMP_UPLOAD_FOLDER + item[6:]))
        db = DBDao()
        sql = "insert into goods(order_time, goods_name_cn,goods_name_en,specifications,goods_num,msg,ref_url," \
              + "imgs_id_list,delivery_name,delivery_phone,delivery_addr,delivery_mode,user_id,imgs_path_list) " \
              + "values (%f,'%s','%s','%s', %d,'%s','%s','%s','%s','%s','%s','%s',%d,'%s')" \
                % (data['generationTime'], data['goodsCNName'], data['goodsEnName'], data['specifications'],
                   data['goodsNum'], data['msg'], data['refUrl'], data['imgsIdArr'], data['userName'],
                   data['userPhone'], data['addr'], data['pickUpMode'], data['workerId'], data['imgsPathArr'])
        newId = db.setBySql(sql)
        if newId != -1:
            Timer(259200, self.cancel_order, (db, newId,)).start()
        return True

    def cancel_order(self, db, newId):
        # 定时，三天内无人接单则取消订单 TODO
        sql = "update goods set order_state = '%s' where order_id = %d and order_state = '%s';" % ('已取消', newId, '未接单')
        db.setBySql(sql)


class updateOrder(Resource):
    def post(self):
        data = request.get_json()
        db = DBDao()
        sql = "select user_id from goods where order_id = %d" % (data['orderId'])
        userId = db.getOneBySql(sql)
        if userId == (0,):
            sql = "update goods set order_time=%f, goods_name_cn='%s',goods_name_en='%s',specifications='%s',goods_num=%d," \
                  "msg='%s',ref_url='%s',imgs_id_list='%s',delivery_name='%s',delivery_phone='%s',delivery_addr='%s'," \
                  "delivery_mode='%s',user_id=%d,imgs_path_list='%s' where order_id=%d" \
                  % (data['generationTime'], data['goodsCNName'], data['goodsEnName'], data['specifications'],
                     data['goodsNum'], data['msg'], data['refUrl'], data['imgsIdArr'], data['userName'],
                     data['userPhone'], data['addr'], data['pickUpMode'], int(data['workerId']), data['imgsPathArr'],
                     data['orderId'])
            db.setBySql(sql)
            return True
        else:
            return False


class updateOrderState(Resource):
    def post(self):
        data = request.get_json()
        db = DBDao()
        sql = "update goods set order_state='%s' where order_id=%d" % (data['orderState'], int(data['orderId']))
        db.setBySql(sql)
        return True


class customerSaveOrder(Resource):
    def get(self):
        return make_response(render_template('customer-order.html'))


class getOrders(Resource):
    def get(self, identification, user_id, state):
        db = DBDao()
        sql = ""
        # 根据人员身份和订单状态查找数据
        if identification == u'管理员':
            if state == 'wait':
                order_state = '未接单'
            elif state == 'underway':
                order_state = '已接单'
            elif state == 'completed':
                order_state = '已完成'
            sql = "select * from goods where substr(order_state,1,3) = '%s'" % (order_state)
            orders = db.getAllBySql(sql)
        elif identification == u'采购':
            if state == 'wait':
                order_state = '未接单'
                # 1.先去查找该员工处理过的订单编号
                sql = "select order_id from purchasestate where user_id = %d" % (int(user_id))
                orderIdList = list(db.getAllBySql(sql))
                # 2.排除拒接订单
                sql = "select * from goods where order_state ='%s' and user_id != 0" % (order_state)
                tempOrders = list(db.getAllBySql(sql))
                orders = copy.deepcopy(tempOrders)
                for key, value in enumerate(tempOrders):
                    # 判断(id,)这种格式表示的id是否在list中
                    if (value[0],) in orderIdList:
                        # 排除该订单
                        orders.remove(value)
            elif state == 'underway':
                order_state = '已接单'
                # 1.去最终确定的采购表中找自己id下的订单编号
                sql = "select order_id from purchasefinal where user_id = %d" % (int(user_id))
                orderIdList = list(db.getAllBySql(sql))
                # 2.根据编号去商品表中查找订单详情
                orders = []
                for key, value in enumerate(orderIdList):
                    # python中的占位符碰到like匹配时，应在占位符外包裹%%
                    sql = "select * from goods where substr(order_state,1,3) = '%s' and order_id= %d " % (
                        order_state, value[0])
                    order = db.getOneBySql(sql)
                    # 如果为空说明订单已完成或被取消
                    if order != None:
                        orders.append(db.getOneBySql(sql))
            elif state == 'completed':
                order_state = '已完成'
                sql = "select * from goods where order_state ='%s' and user_id=%d" % (order_state, int(user_id))
                orders = db.getAllBySql(sql)
        elif identification == u'客服':
            if state == 'wait':
                # 只出现未经完善的订单
                sql = "select * from goods where user_id = 0"
            elif state == 'underway':
                # 所有正在进行的订单都可以查看，方便客服管理
                order_state = '接单'
                sql = "select * from goods where substr(order_state,2,2) = '%s' and user_id != 0" % (order_state)
            elif state == 'completed':
                order_state = '已完成'
                sql = "select * from goods where order_state ='%s'" % (order_state)
            orders = db.getAllBySql(sql)
        # 未知问题，必须转为list而不能直接返回tuple
        return list(orders)


class offerState(Resource):
    def post(self):
        data = request.get_json()
        db = DBDao()
        # 1.往采购状态表中加入订单记录
        sql = "insert into purchasestate(order_id, user_id,is_receive,price_offer) " \
              + "values (%d,%d,'%s',%f)" % (
            int(data['orderId']), int(data['userId']), data['isReceive'], data['priceOffer'])
        db.setBySql(sql)
        # 2.查询是否已经有人接了此单，如果没有则为首次接单，则开始计时，1天后竞价
        sql = "select count(*) from purchasestate where order_id=%d and is_receive='%s' and user_id !=%d" % (
            int(data['orderId']), data['isReceive'], int(data['userId']))
        cnt = db.getOneBySql(sql)
        # 3.如果第一次接单，则定时1天后结束竞价 TODO
        if cnt == (0L,):
            Timer(86400, self.find_lowest_price, (db, data)).start()
        return True

    def find_lowest_price(self, db, data):
        sql = "INSERT INTO purchasefinal(order_id,user_id,single_price) SELECT order_id,user_id,price_offer FROM " \
              "purchasestate WHERE order_id = %d AND is_receive = '%s' ORDER BY price_offer ASC LIMIT 1;" % (
                  int(data['orderId']), '接单')
        db.setBySql(sql)
        # 4.改变订单状态
        sql = "UPDATE goods SET order_state='已接单未付款' WHERE order_id = %d AND order_state = '未接单';" % (
            int(data['orderId']))
        db.setBySql(sql)
        # 5.通知用户付款，如果1天内未付款则取消订单
        # 找到用户手机号下发短信
        sql = "select * from goods where order_id = %d" % (int(data['orderId']))
        res = db.getOneBySql(sql)
        single_sender = SmsSender.SmsSingleSender(SMS_APPID, SMS_APPKEY)
        params = [str(res[0]), str(res[0])]
        result = single_sender.send_with_param("86", res[10], 73367, params, "优值购平台", "", "")
        print result
        # 1天内未付款取消订单 TODO
        Timer(86400, self.cancel_order, (db, data)).start()

    def cancel_order(self, db, data):
        sql = "update goods set order_state='%s' where order_id=%d and order_state='%s'" % (
            '已取消', int(data['orderId']), '已接单未付款')
        db.setBySql(sql)


class userLogin(Resource):
    def post(self):
        data = request.get_json()
        db = DBDao()
        sql = "select * from user where user_phone = '%s' and user_psd = '%s'" % (data['username'], data['password'])
        user = db.getOneBySql(sql)
        if user:
            res_data = {'userId': user[0], 'userName': user[1], 'userPhone': user[2],
                        'userIdentification': user[3], 'msg': True}
        else:
            res_data = {'msg': False}

        return res_data


class getExpress(Resource):
    def get(self):
        return make_response(render_template('express-trace.html'))

    def post(self):
        req = request.get_json()
        expresscode = req['expressCode']
        url = 'http://api.kdniao.cc/Ebusiness/EbusinessOrderHandle.aspx'
        data = get_company(expresscode, EXPRESS_APPID, EXPRESS_APPKEY, url)
        if not any(data['Shippers']):
            print "未查到该快递信息,请检查快递单号是否有误！"
            return False
        else:
            print "已查到该", data['Shippers'][0]['ShipperName'] + "(" + data['Shippers'][0][
                'ShipperCode'] + ")", expresscode
            # 记录入数据库
            db = DBDao()
            sql = "update goods set express_com ='%s',express_code = '%s' where order_id=%d" % (
                data['Shippers'][0]['ShipperCode'], expresscode, int(req['orderId']))
            db.setBySql(sql)
            # trace_data = get_traces(expresscode, data['Shippers'][0]['ShipperCode'], EXPRESS_APPID, EXPRESS_APPKEY, url)
            # if trace_data['Success'] == "false" or not any(trace_data['Traces']):
            #     print "未查询到该快递物流轨迹！"
            # else:
            #     str_state = "问题件"
            #     if trace_data['State'] == '2':
            #         str_state = "在途中"
            #     if trace_data['State'] == '3':
            #         str_state = "已签收"
            #     print "目前状态： " + str_state
            #     trace_data = trace_data['Traces']
            #     item_no = 1
            #     for item in trace_data:
            #         print str(item_no) + ":", item['AcceptTime'], item['AcceptStation']
            #         item_no += 1
            #     print("\n")
            return {"Shipper": data['Shippers'][0]['ShipperName'], "ShipperCode": data['Shippers'][0]['ShipperCode'],
                    "ExpressCode": expresscode}


class subscribeExpress(Resource):
    def get(self):
        return make_response(render_template('express-trace.html'))

    def post(self):
        data = request.get_json()
        db = DBDao()
        sql = "select * from goods where order_id = %d" % (int(data['orderId']))
        res = db.getOneBySql(sql)
        resp = {"expressCom": res[16], "expressCode": res[17]}
        return resp


# TODO 微信支付
class WXPay(Resource):
    def get(self):
        return make_response(render_template('wxpay.html'))

    def post(self):
        db = DBDao()
        data = request.get_json()
        # raw_remote_addr = request.remote_addr
        # remote_addr = request.headers
        # remote_addr = request.headers['remote-user-ip']

        params = {}
        params["spbill_create_ip"] = request.remote_addr
        params["body"] = data['body']
        params["out_trade_no"] = self.getOutTradeNo()
        params["total_fee"] = data['totalFee']
        params["notify_url"] = "mgmt.uzhigou.com/wxpay/pay-bill"
        params["trade_type"] = "MWEB"
        params["scene_info"] = '{"h5_info": {"type":"Wap","wap_url": "https://uzhigou.com","wap_name": "优值购商品付款"}}'
        req = UnifiedOrder_pub()
        req.parameters = params
        mweb_url = req.getMWEBUrl()
        # 将商户订单号存入对应商品数据中作为付款标识
        sql = "update goods set out_trade_no='%s' where order_id=%d" % (
            params["out_trade_no"], int(data['orderId']))
        db.setBySql(sql)
        return mweb_url

    def getOutTradeNo(self):
        chars = "abcdefghijklmnopqrstuvwxyz0123456789"
        strs = []
        for x in range(18):
            strs.append(chars[random.randrange(0, len(chars))])
        return time.strftime('%Y%m%d%H%M%S', time.localtime(time.time())) + "".join(strs)


class WXPayResult(Resource):
    def get(self):
        return make_response(render_template('wxpay.html'))

    def post(self):
        db = DBDao()
        data = request.get_json()

        return_code_ = data['return_code']
        params = {}

        if return_code_ == 'SUCCESS':
            params['sign'] = data['sign']
            params['result_code'] = data['result_code']
            params['openid'] = data['openid']
            params['total_fee'] = data['total_fee']
            params['settlement_total_fee'] = data['settlement_total_fee']
            params['time_end'] = data['time_end']
            params['out_trade_no'] = data['out_trade_no']

            # 用户成功付款后，改变订单状态并通知相应采购发货 TODO 验证付款金额
            sql = "update goods set order_state='%s' where out_trade_no='%s'" % (
                '已接单已付款', data['out_trade_no'])
            db.setBySql(sql)
            sql = "select order_id,user_id where out_trade_no = '%s'" % (data['out_trade_no'])
            queryGoods = db.getOneBySql(sql)
            sql = "select user_name,user_phone where user_id = %d" % (int(queryGoods[1]))
            queryUser = db.getOneBySql(sql)

            single_sender = SmsSender.SmsSingleSender(SMS_APPID, SMS_APPKEY)
            result = single_sender.send_with_param("86", queryUser[1], 94155, [queryUser[0], queryGoods[0]], "优值购平台",
                                                   "", "")
            print result
        else:
            params['result_code'] = data['result_code']
            params['result_msg'] = data['return_msg']

        print params
        return {'return_code': 'SUCCESS'}
