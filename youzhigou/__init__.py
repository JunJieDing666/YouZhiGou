# -*- coding: utf-8 -*-
from __future__ import absolute_import
# 第三方包
from threading import Timer

import time
from flask import Flask
from flask_restful import Api
# 自定义的包
from youzhigou.server.utils.DBDao import DBDao

'''
建立起服务器端
'''
app = Flask("youzhigou", static_folder="./static", template_folder="./templates")
api = Api(app)
from .server import views


class timerOperate:
    # 定时，三天内无人接单则取消订单
    def cancel_order(self, db):
        sql = "update goods set order_state = '%s' where order_time < %d - 259200000  and order_state = '%s';" \
                                                                         % ('已取消', int(round(time.time() * 1000)), '未接单')
        db.setBySql(sql)
        # print int(round(time.time() * 1000))
        Timer(600, self.cancel_order, (db,)).start()

    # TODO
    def find_lowest_price(self,db):
        sql = "update goods set order_state = '%s' where order_time < %d - 259200000  and order_state = '%s';" \
              % ('已取消', int(round(time.time() * 1000)), '未接单')
        db.setBySql(sql)


# 开启定时任务，每10分钟检测一次订单状态
db = DBDao()
timer_operate = timerOperate()
timer_operate.cancel_order(db)
