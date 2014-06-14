from splunk.clilib import cli_common as cli

class RedisConfig:
  """ get svn.conf items and generate svn command srings"""
  def __init__(self, logger=None, conf="redis", stanza="default"):
    self.logger = logger
    if logger:
      logger.debug("reading configs")
    cfg = cli.getConfStanza(conf, stanza)
    self.hostname = cfg.get('hostname')
    self.port = cfg.get('port')

  def check_config(self):
    """ check if there are missing config values
        return 0 for success """
    err = 0
    if not self.hostname:
      err += 1
    if self.port == 'None':
      err += 1
    if self.logger:
      self.logger.debug("config check returned value=%s" % (err))
    return err

