function(newDoc, oldDoc, userCtx){
   // !code vendor/crayon/lib/validate.js
   // !code lib/helper.js

   if(newDoc.type == "TStore::UpdateFilterError"){
      throw(newDoc.error);
   }

   if(newDoc.type == "TStore::Search::CrawlerStatus"){
      if(userCtx.roles.indexOf("_admin") == -1){
         log("[TStore::Search::CrawlKeyword] " + toJSON(userCtx.name) + " / " + toJSON(userCtx.roles));
         throw({forbidden: "Document cannot be updated"});
      }
   }

   if(newDoc.type == "TStore::Search::CrawlKeyword"){
      if(oldDoc){
         log("[TStore::Search::CrawlKeyword] validation/update");
         if(userCtx.roles.indexOf("_admin") == -1){
            log("[TStore::Search::CrawlKeyword] " + toJSON(userCtx.name) + " / " + toJSON(userCtx.roles));
            throw({forbidden: "Document cannot be updated"});
         }
      }else{
         log("[TStore::Search::CrawlKeyword] validation/create");
         var keyword = extractKeywordFromDocId(newDoc._id);
         if( keyword == null || newDoc.keyword != keyword ){
            throw({forbidden: "Invalid data structure."});
         }
      }
   }

}