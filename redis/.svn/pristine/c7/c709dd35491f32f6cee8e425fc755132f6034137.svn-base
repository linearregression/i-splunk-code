import csv,sys,os.path,re,signal
import splunk


import logging
from logging.handlers import RotatingFileHandler

import redis 

from util import *


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


def signalHandler(signum, frame):
  """Exits when called, used to handle all signals."""
  sys.exit(0)

def main():
  logger.debug("beginning with main method")

  # SIGNAL HANDLER
  signal.signal(signal.SIGINT, signalHandler)
  signal.signal(signal.SIGQUIT, signalHandler)
  signal.signal(signal.SIGTERM, signalHandler)

  cfg = redis_config.RedisConfig(logger)
  if cfg.check_config() > 0:
    logger.error("could not parse redis configuration file")
    return 1
  logger.debug("redis config initialized")

  port=-1 

  try:
    port = int(cfg.port)
  except ValueError as e:
    logger.error("could not parse port in redis.conf, has to be an integer")
    return 1

  # open connection to redis db
  r_db = redis.StrictRedis(host=cfg.hostname, port=port, db=0)
  logger.debug("connection to redis DB initialized")

  r = csv.reader(sys.stdin)
  w = csv.writer(sys.stdout)

  header = []
  first = True

  ipi       = -1
  ispi      = -1

  # RFC 1918 regex (thanks to Thomas Petersen)
  iprfc = re.compile("(?:10|192\.168|172\.1[6-9]|172\.2\d|172\.3[01])(?:\.\d{1,3}){2,3}")

  for line in r:

    if first:
      header = line
      try:
        ipi = header.index("ip")
      except:
        logger.info("IP field must exist in CSV data")
        return 1 
      try:
        ispi = header.index("isp")
      except:
        logger.error("ISP field must exists in CSV data")
        return 1

      w.writerow(header)
      first = False
      continue

    try:
      #logger.debug("ispi=%s" % ispi)
      logger.debug("wrtiting ipi=%s, ispi=%s" % (line[ipi], line[ispi]))
      logger.debug(str(line))
      r_db.set(line[ipi],line[ispi]) 
    except Exception as e: 
      print  e
      continue;

    w.writerow(line)




if __name__ == "__main__":
  sys.exit(main())

