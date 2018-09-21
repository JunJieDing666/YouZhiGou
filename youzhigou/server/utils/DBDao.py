import MySQLdb
from youzhigou.conf import config


class DBDao:
    def __init__(self):
        self.conn = MySQLdb.connect(host=config.MYSQL_DATABASE_HOST,
                                    port=3306,
                                    user=config.MYSQL_DATABASE_USER,
                                    passwd=config.MYSQL_DATABASE_PASSWORD,
                                    db=config.MYSQL_DATABASE_DB,
                                    charset='utf8')

    def setBySql(self, sql):
        cursor = self.conn.cursor();
        try:
            cursor.execute(sql)
            newId = self.conn.insert_id()
            self.conn.commit()
            return newId
        except Exception, e:
            print e
            self.conn.rollback()
            return -1

    def getOneBySql(self, sql):
        cursor = self.conn.cursor();
        try:
            cursor.execute(sql)
            result = cursor.fetchone()
            self.conn.commit()
            return result
        except Exception, e:
            print e
            self.conn.rollback()
            return None

    def getAllBySql(self, sql):
        cursor = self.conn.cursor();
        try:
            cursor.execute(sql)
            result = cursor.fetchall()
            self.conn.commit()
            return result
        except Exception, e:
            print e
            self.conn.rollback()
            return None

    def __del__(self):
        self.conn.close()
