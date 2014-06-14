import csv,sys,os.path,re,signal
import splunk
import splunk.Intersplunk


import logging
from logging.handlers import RotatingFileHandler

import redis 

from util import *

#(isgetinfo, sys.argv) = splunk.Intersplunk.isGetInfo(sys.argv)
keywords, options = splunk.Intersplunk.getKeywordsAndOptions()


def setup_logging():
   """ initialize the logging handler """
   logger = logging.getLogger('splunk.redis')
   SPLUNK_HOME = os.environ['SPLUNK_HOME']

   LOGGING_DEFAULT_CONFIG_FILE = os.path.join(SPLUNK_HOME, 'etc', 'log.cfg')
   LOGGING_LOCAL_CONFIG_FILE = os.path.join(SPLUNK_HOME, 'etc', 'log-local.cfg')
   LOGGING_STANZA_NAME = 'python'
   LOGGING_FILE_NAME = "redis.log"
   BASE_LOG_PATH = os.path.join('var', 'log', 'splunk')
   LOGGING_FORMAT = "%(asctime)s %(levelname)-s\t%(module)s:%(lineno)d - %(message)s"
   splunk_log_handler = logging.handlers.RotatingFileHandler(os.path.join(SPLUNK_HOME, BASE_LOG_PATH, LOGGING_FILE_NAME), mode='a')
   splunk_log_handler.setFormatter(logging.Formatter(LOGGING_FORMAT))
   logger.addHandler(splunk_log_handler)
   splunk.setupSplunkLogger(logger, LOGGING_DEFAULT_CONFIG_FILE, LOGGING_LOCAL_CONFIG_FILE, LOGGING_STANZA_NAME)
   return logger

logger = setup_logging()
logger.debug("logger initialized")


if len(keywords) < 2 :
    splunk.Intersplunk.parseError("Invalid keywords %s! Usage: redisout [options] <key> <value>" % keywords)
    sys.exit(0)

logger.info("keywords=%s" % (keywords))

cfg = redis_config.RedisConfig(logger)
if cfg.check_config() > 0:
  logger.error("could not parse redis configuration file")
  sys.exit(1) 
logger.debug("redis config initialized")

port=-1 

try:
  port = int(cfg.port)
except ValueError as e:
  logger.error("could not parse port in redis.conf, has to be an integer")
  sys.exit(1)

# open connection to redis db
r_db = redis.StrictRedis(host=cfg.hostname, port=port, db=0)
logger.debug("connection to redis DB initialized")

def main():

  while True:
    line = sys.stdin.readline()
    if not line.strip(): break

  reader = csv.DictReader( sys.stdin )
  headers = reader.fieldnames
  if not headers: 
    return


  writer = csv.DictWriter( sys.stdout, headers )
  writer.writer.writerow(headers)
  for row in reader:
    #logger.debug("writing ip=%s, isp=%s" % (row["ip"],row["isp"]))
    r_db.set(row["ip"],row["isp"]) 
    writer.writerow(row)

if __name__ == "__main__":
  sys.exit(main())

