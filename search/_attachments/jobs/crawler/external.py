#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 
# Name        : external.py
# Description : interface script launched by CouchDB external API
# Usage       :
#   configure local.ini on your CouchDB as follows.
#   
#      [external]
#      _ts-search-crawler = /usr/local/bin/python2.6 /Users/yssk22/Dropbox/projects/tstore/search/_attachments/jobs/external.py
#
#      [httpd_db_handlers]
#      _ts-search-crawler = {couch_httpd_external, handle_external_req, <<"tstore_search">>}
#

import sys
import json
import threading
import time
from search_crawler import *

def get_config():
    try:
        opts, args = getopt.getopt(sys.argv[1:], "f:v")
    except getopt.GetOptError:
        sys.exit(2);
    json_config = None
    for o, a in opts:
        if o == "-f":
            json_config = a
        if o == "-v":
            logging.basicConfig(level=logging.DEBUG)

    if json_config == None:
        return SearchCrawlerConfig()
    else:
        return SearchCrawlerConfig.from_file(json_config)

def respond(code=200, data={}):
    sys.stdout.write("%s\n" % json.dumps({'code': code, 'json': data}))
    sys.stdout.flush()

def handle_requests():
    job_fetcher = None
    line = sys.stdin.readline()
    while line:
        if job_fetcher == None:
            job_fetcher = SearchCrawlJobFetcher(get_config())
            job_fetcher.start()
            respond(200, {"ok" : "New thread created"})
        else:
            respond(200, {"ok" : "Thread already created"})
        line = sys.stdin.readline()

    if job_fetcher != None:
        job_fetcher.stop()
        job_fetcher.join(60)

if __name__ == "__main__":
    handle_requests()
