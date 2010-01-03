function(doc, req){
   // !code vendor/couchapp/date.js
   // !code lib/helper.js

   // This filter is used for updating search crawler status document.
   // special document(id:ts-search-crawler-status) is used for the status.
   var ts = new Date();
   if(doc){
      if( doc._id == "ts-search-crawler-status"){
         doc.updated_at = ts.toJSON();
         return [doc, toJSON({ok: "true"})];
      }
   }else{
      if( req.docId == "ts-search-crawler-status"){
         var newDoc = {
            _id : req.docId,
            type: "TStore::Search::CrawlerStatus",
            created_at: ts.toJSON(),
            updated_at: ts.toJSON()
         };
         return [newDoc, toJSON({ok: "true"})];
      }
   }
   return [{
      type: "TStore::UpdateFilterError",
      error: {
         forbidden: "invalid request."
      }
   }, toJSON("")];
}