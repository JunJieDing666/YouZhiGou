# !/usr/bin/python
# encoding:utf-8

import json
import urllib
import urllib2
import hashlib
import base64

def encrypt(origin_data, appkey):
    """数据内容签名：把(请求内容(未编码)+AppKey)进行MD5加密，然后Base64编码"""
    data = (origin_data + appkey).encode('utf-8')
    return base64.urlsafe_b64encode(get_md5_value(data))


def sendpost(url, datas):
    """发送post请求"""
    postdata = urllib.urlencode(datas).encode('utf-8')
    header = {
        "Accept": "application/x-www-form-urlencoded;charset=utf-8",
        "Accept-Encoding": "utf-8"
    }
    req = urllib2.Request(url, postdata, header)
    get_data = (urllib2.urlopen(req).read().decode('utf-8'))
    return get_data


def get_company(logistic_code, appid, appkey, url):
    """获取对应快递单号的快递公司代码和名称"""
    data1 = {'LogisticCode': logistic_code}
    d1 = json.dumps(data1)
    requestdata = encrypt(d1, appkey)
    post_data = {
        'RequestData': urllib.quote(d1),
        'EBusinessID': appid,
        'RequestType': '2002',
        'DataType': '2',
        'DataSign': requestdata
    }
    json_data = sendpost(url, post_data)
    sort_data = json.loads(json_data)
    return sort_data


def get_traces(logistic_code, shipper_code, appid, appkey, url):
    """查询接口支持按照运单号查询(单个查询)"""
    data1 = {'LogisticCode': logistic_code, 'ShipperCode': shipper_code}
    d1 = json.dumps(data1, sort_keys=True)
    requestdata = encrypt(d1, appkey)
    post_data = {'RequestData': d1, 'EBusinessID': appid, 'RequestType': '1002', 'DataType': '2',
                 'DataSign': requestdata.decode()}
    json_data = sendpost(url, post_data)
    sort_data = json.loads(json_data)
    return sort_data


def get_md5_value(src):
    myMd5 = hashlib.md5()
    myMd5.update(src)
    myMd5_Digest = myMd5.hexdigest()
    return myMd5_Digest
