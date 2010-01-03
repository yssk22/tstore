h1. What is TStore

TStore is a twitter search result backup application build on Apache CouchDB.

h1. Requirements

- CouchDB 0.10.0 or higher
- Python 2.5 or higher
  
h1. Installation

h2. Install Prerequistic Libraries

Install following libraries using easy_install 

- couchapp

h2. Install CouchApp application on your CouchDB
  
  $ easy_install couchapp
  $ git clone git@github.com:yssk22/tstore.git
  $ cp app/dot_couchapprc couchapp/.couchapprc
  $ vi app/.couchapprc
    # see dot_couchapprc
  $ export PYTHONPATH={TSTORE_ROOT}/vendor/yssk22-couchapp
  $ ../vendor/yssk22-couchapp/bin/couchapp push 

Note that we use couchapp, not official version but modified version (under vendor dir).
