# What is TStore

TStore is a twitter search result backup application build on Apache CouchDB.

# Requirements

- CouchDB 0.10.0 or higher
- Python 2.5 or higher
  
# Installation

## Install Prerequistic Libraries

Install following libraries using easy_install 

- couchapp

## Install CouchApp application on your CouchDB
  
  $ easy_install couchapp
  $ git clone git@github.com:yssk22/tstore.git
  $ cp search/dot_couchapprc couchapp/.couchapprc
  $ vi search/.couchapprc
  $ export PYTHONPATH={TSTORE_ROOT}/vendor/yssk22-couchapp
  $ ../vendor/yssk22-couchapp/bin/couchapp push 

Note that we use couchapp, not official version but modified version (under vendor dir).

## Configure twitter search crawler

configure the crawler task to store search results on CouchDB.

### Set task script perission

  $ chown couchdb.couchdb search/_attachments/jobs/crawler/external.py
  $ chown 700 search/_attachments/jobs/crawler/external.py

### prepare configuration file

You need to preprare json-formatted configuration file as follows:

   {
     "couchdb": {              
         "host" : "localhost",
         "port" : 5984,
         "db"   : "tstore_default",
         "user" : "admin",
         "password" : "time2relax"
     },
     "threads" : {              
         "wait_interval"  : 5,  
         "max_crawlers"   : 1   
     }  
   }

Save this to HOME/tstore-search.json (or any directory that can be acceessed by your CouchDB OS user) and then

   $ chmod 600 tstore-search.json
   $ chown couchdb.couchdb tstore-search.json

### configure external API 

Configure your local.ini file for CouchDB.

   [external]
   ts-search-crawler = /opt/local/bin/python TSTORE_ROOT/search/_attachments/jobs/crawler/external.py -f HOME/ts-search-config.json

   [httpd_db_handlers]
   _ts-search-crawler = {couch_httpd_external, handle_external_req, <<"ts-search-crawler">>}
