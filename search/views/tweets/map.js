function(doc){
   if( doc.type == "TStore::Tweet" && doc.keyword){
      emit([doc.keyword, new Date(doc.tweet.created_at).toJSON()], doc.tweet);
   }
}