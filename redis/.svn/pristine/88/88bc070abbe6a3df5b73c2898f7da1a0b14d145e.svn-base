from datetime import datetime
import time
def get_time():
  return datetime.now()
d2 = get_time()

import csv,sys,os.path,re,signal
import splunk
import splunk.Intersplunk

#(isgetinfo, sys.argv) = splunk.Intersplunk.isGetInfo(sys.argv)
keywords, options = splunk.Intersplunk.getKeywordsAndOptions()


if len(keywords) < 1 :
    splunk.Intersplunk.parseError("Invalid keywords %s! Usage: rtscript s_time" % keywords)
    sys.exit(0)



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
    d3 = get_time()
    d1 = datetime.strptime(row["s_time"].strip('"'), "%Y-%m-%d %H:%M:%S.%f")
    headers.append("d1")
    headers.append("d2")
    headers.append("d3")
    headers.append("diff_d1_d3")
    row["d1"] = d1
    row["d2"] = d2
    row["d3"] = d3
    row["diff_d1_d3"] = d3 - d1
    writer.writerow(row)

if __name__ == "__main__":
  sys.exit(main())

