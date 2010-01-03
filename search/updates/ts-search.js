function(doc, req){
   // !code vendor/couchapp/date.js
   // !code lib/helper.js
   if( doc ){
      // nothing
      return [{
         type: "TStore::UpdateFilterError",
         error: {
            forbidden: "You cannot update the document."
         }
      }, toJSON("")];
   }else{
      if( req.docId ){
         var ts = new Date();
         var newDoc = {
            _id : req.docId,
            type: "TStore::Search::CrawlKeyword",
            created_at: ts.toJSON(),
            updated_at: ts.toJSON()
         };
         var keyword = extractKeywordFromDocId(req.docId);
         if(keyword){
            newDoc.keyword = keyword;
         }
         return [newDoc, toJSON({ok: "true"})];
      }
      return [{
         type: "TStore::UpdateFilterError",
         error: {
            not_found: "Not found"
         }
      }, toJSON("")];
   }
}