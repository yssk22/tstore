#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 
# Name        : search_crawler.py
# Description : Get the search result from twitter.com and push it to CouchDB.
# Usage       :
#  search_crawler.py -d couchdb_url -q search_word [-s since_id]
# あ

import getopt, sys
import urllib, urllib2
import urlparse
import httplib
import json
import datetime
import threading
import time
import Queue
import logging
import base64
import traceback
    
SEARCH_EP = "http://search.twitter.com/search.json"

DEFAULT_WAIT_INTERVAL = 5
DEFAULT_MAX_CRAWLERS  = 15

class PutRequest(urllib2.Request):
    def get_method(self):
        return "PUT"

class SearchCrawlerConfig:
    @staticmethod
    def from_file(json_path):
        def get(dict, key, default):
            return dict[key] if dict.has_key(key) else default
        logging.debug("[Config] create instance from json config file")
        rc = json.loads(open(json_path).read())
        couchdb = get(rc, "couchdb", {
                'host' : 'localhost',
                'port' : 5984,
                'db'   : 'tstore',
                'user' : None,
                'password' : None
                });
        threads = get(rc, "threads", {
                'wait_interval' : DEFAULT_WAIT_INTERVAL,
                'max_crawlers'  : DEFAULT_MAX_CRAWLERS
                })
        return SearchCrawlerConfig(
            host           = get(couchdb, "host", "localhost"),
            port           = get(couchdb, "port", 5984),
            db             = get(couchdb, "db",   "tstore"),
            user           = get(couchdb, "user", None),
            password       = get(couchdb, "password", None),
            wait_interval  = get(threads, 'wait_interval', DEFAULT_WAIT_INTERVAL),
            max_crawlers   = get(threads, 'max_crawlers',  DEFAULT_MAX_CRAWLERS),
            )

    def __init__(self,
                 host="localhost", port=5984,db="tstore",
                 user=None,password=None, 
                 wait_interval=DEFAULT_WAIT_INTERVAL,max_crawlers=DEFAULT_MAX_CRAWLERS,
                 ):
        self.host           = host
        self.port           = port
        self.db             = db
        self.user           = user
        self.password       = password
        self.wait_interval = wait_interval
        self.max_crawlers   = max_crawlers 
        
    def db_url(self):
        return ("http://%s:%d/%s" % (self.host, self.port, self.db))
    
class SearchCrawler(threading.Thread):
    def __init__(self,queue,config = None):
        threading.Thread.__init__(self)
        self._config    = config or SearchCrawlerConfig()
        self._queue     = queue
        self.setDaemon(True)

    def run(self):
        logging.debug("[Crawler] thread has been started.")
        while True:
            self._job = self._queue.get(True, None)
            if self._job == None:
                logging.info("[Crawler] receive a None job. exit queue monitor loop.")
                break

            try:
                self._lock_job()
            except urllib2.HTTPError, err:
                if err.code == 409:
                    logging.warn("[Crawler] the job has already been processed by another thread.")
                else:
                    logging.error("[Crawler] %s" % err)
                continue
            except Exception, err:
                logging.error("[Crawler] lock failed : %s" % err)
                logging.error(traceback.format_exc())
                continue

            try:
                self._crawl()
            except Exception, err:
                self._job["error"] = str(err)
                self._job["crawl_status"] = "FAIL"
                logging.warn("[Crawler] some errors detected while crawling '%s': %s" % (self._job["keyword"], err))
                logging.error(traceback.format_exc())

            try:
                self._unlock_job()
            except urllib2.URLError, err:
                logging.critical("[Crawler] Unlock job railed : %s" % err)
                

    def _lock_job(self):
        logging.debug("[Crawler] lock job: (%s, %s)" % (self._job["_id"], self._job["_rev"]))
        now = datetime.datetime.utcnow().strftime("%Y/%m/%d %H:%M:%S +0000")
        self._job["crawl_status"]   = "EXEC"
        self._job["crawl_start_at"] = now
        self._job["error"] = None
        self._update_job()

    def _unlock_job(self):
        logging.debug("[Crawler] unlock job: (%s, %s)" % (self._job["_id"], self._job["_rev"]))
        now = datetime.datetime.utcnow().strftime("%Y/%m/%d %H:%M:%S +0000")
        self._job["crawl_end_at"] = now
        self._update_job()

    def _crawl(self):
        params = {"q": self._job["keyword"].encode("utf_8")}
        if self._job.has_key("last_tweet_id"):
            params["since_id"] = self._job["last_tweet_id"]

        list = self._exec_search("?" + urllib.urlencode(params), [])
        now = datetime.datetime.utcnow().strftime("%Y/%m/%d %H:%M:%S +0000")
        self._push_tweets([{"tweet"      : doc, 
                            "type"       : "TStore::Tweet", 
                            "created_at" : now,
                            "updated_at" : now,
                            "keyword": self._job["keyword"] } for doc in list])
        
        self._job["last_no_of_tweets"] = len(list)
        if len(list) > 0:
            self._job["last_tweet_id"] = list[0]["id"]
        self._job["crawl_status"] = "SUCC"
        

    def _update_job(self):
        url  = self._job_url()
        data = json.dumps(self._job)
        logging.debug("[Crawler] PUT document : %s" % url)
        logging.debug("[Crawler] >> %s" % data)
        request = PutRequest(url, data)
        received = self._send_request(request).read()
        logging.debug("[Crawler] << %s" % received)
        result = json.loads(received)
        self._job["_rev"] = result["rev"]

    def _job_url(self):
        return self._config.db_url() + "/" + urllib.quote(self._job["_id"].encode("utf_8"))

    def _exec_search(self, next_page, list):
        url = SEARCH_EP + next_page
        logging.debug("[Crawler] Search : %s" % url)
        f = urllib2.urlopen(url=url, timeout=30)
        result   = f.read()
        logging.debug("[Crawler] << %s" % result)
        response = json.loads(result)
        if response.has_key("results"):
            list = list + response["results"]
            if response.has_key("next_page"):
                return self._exec_search(response["next_page"], list)
        return list

    def _push_tweets(self, list):
        url = self._config.db_url() + "/_bulk_docs"
        data = json.dumps({"docs": list})
        logging.debug("[Crawler] bulk docs : %s" % url)
        logging.debug("[Crawler] >> %s" % data)
        request = urllib2.Request(url, data)
        received = self._send_request(request).read()
        return json.loads(received)

    def _send_request(self, req):
        if self._config.user and self._config.password:
            basic = base64.encodestring('%s:%s' % (self._config.user, self._config.password))[:-1]
            req.add_header("Authorization", "Basic %s" % basic)
            
        return urllib2.urlopen(req)
        
class SearchCrawlJobFetcher(threading.Thread):
    def __init__(self,config = None):
        threading.Thread.__init__(self)
        self._config = config or SearchCrawlerConfig()
        self._queue    = Queue.Queue(self._config.max_crawlers * 2)
        self._crawlers = []
        for i in range(self._config.max_crawlers):
            self._crawlers.append(SearchCrawler(self._queue, config=self._config))
        self._stop = False
        self.setDaemon(True)

    def run(self):
        logging.debug("[JobFetcher] thread has been started.")
        logging.debug("[JobFetcher] start %s crawlers." % len(self._crawlers))
        for crawler in self._crawlers:
            crawler.setDaemon(True)
            crawler.start()

        while self._stop == False:
            self._update_status()
            try:
                self._enqueue_jobs()
                time.sleep(self._config.wait_interval)
            except Queue.Full:
                logging.warn("[JobFetcher] job queui is full. waiting...")
                time.sleep(self._config.wait_interval * 0.5)

        logging.debug("[JobFetcher] push None jobs to job queue.")
        for i in range(self._config.max_crawlers):
            self._queue.put(None)
    
        # print "waiting crawler threads"
        logging.debug("[JobFetcher] wait for crawlers to be stopped.")
        for crawler in self._crawlers:
            crawler.join()

    def _update_status(self):
        url = self._config.db_url() + "/_design/search/_update/ts-search-crawler/ts-search-crawler-status"
        data = json.dumps({})
        logging.debug("[JobFetcher] update crawler status : %s" % url)
        logging.debug("[JobFetcher] >> %s" % data)
        req = PutRequest(url, data)

        if self._config.user and self._config.password:
            basic = base64.encodestring('%s:%s' % (self._config.user, self._config.password))[:-1]
            req.add_header("Authorization", "Basic %s" % basic)
            
        return urllib2.urlopen(req)

    def _enqueue_jobs(self):
        logging.debug("[JobFetcher] fetch jobsjobs")
        now = datetime.datetime.utcnow();
        config = self._config
        endkey = (now - datetime.timedelta(seconds = config.wait_interval))
        params = {
            "endkey" : json.dumps([endkey.strftime("%Y/%m/%d %H:%M:%S +0000")]),
            "limit"  : config.max_crawlers
            }
        logging.debug("[JobFetcher] Now : %s" % now)
        logging.debug("[JobFetcher] endkey : %s" % endkey)

        url = ("http://%s:%d/%s/_design/search/_view/all_jobs?%s" %
               (config.host, config.port, config.db, 
                urllib.urlencode(params)))
        # print url 
        logging.debug("[JobFetcher] view/all_jobs : %s" % url)
        f = urllib2.urlopen(url=url)
        received = f.read()
        logging.debug("[JobFetcher] << %s" % received)
        response = json.loads(received)
        logging.info("[JobFetcher] %s jobs found." % len(response["rows"]))
        for row in response["rows"]:
            # print "enqueue: %s" % row["value"]["_id"]
            self._queue.put(row["value"], True, self._config.wait_interval * 0.5)

    def stop(self):
        self._stop = True



# for command line
def usage():
    sys.stderr.write("search_crawler.py [-f rcfile] \n")

def main():
    logging.basicConfig(level=logging.DEBUG)
    logging.debug("Start search crawler from command line.")
    try:
        opts, args = getopt.getopt(sys.argv[1:], "f:")
    except getopt.GetOptError:
        usage()
        sys.exit(2);
    rcfile = None
    for o, a in opts:
        if o == "-f":
            rcfile = a
    if rcfile == None:
        config = SearchCrawlerConfig()
    else:
        config = SearchCrawlerConfig.from_file(rcfile)

    mgr1 = SearchCrawlJobFetcher(config)
    mgr1.start()
    line = sys.stdin.readline()
    mgr1.stop()
    mgr1.join()
        
if __name__ == "__main__":
    main()
