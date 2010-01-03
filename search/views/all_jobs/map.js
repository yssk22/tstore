function(doc){
  if( doc.type == "TStore::Search::CrawlKeyword" ) {
     if( doc.crawl_status != "EXEC" ){
        delete(doc._deleted_conflicts);
        emit([doc.crawl_end_at || "1900/01/01 00:00:00 +0000"], doc);
     }
  }
}