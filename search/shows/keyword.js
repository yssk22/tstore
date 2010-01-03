function(doc, req){
   // !code vendor/couchapp/path.js
   // !code vendor/couchapp/date.js
   // !code vendor/crayon/lib/escape.js
   // !code vendor/crayon/lib/template.js
   // !code vendor/crayon/lib/error.js

   // !code lib/helper.js

   // !json couchapp
   // !json templates.site
   // !json templates.keyword

   var bindings = {
      assetPath : assetPath(),
      site : {
         title: "",
         scripts: [
            assetPath() + "/javascripts/keyword.js"
         ]
      }
   };

   if( doc && doc.type == "TStore::Search::CrawlKeyword" ){
      bindings.site.title = "Keyword: " + doc.keyword;
      bindings.doc = doc;

      if( doc.crawl_start_at && doc.crawl_end_at ){
         doc.crawl_completed_in = new Date(doc.crawl_end_at) - new Date(doc.crawl_start_at);
      }

      return render(templates.site.header, bindings) +
         render(templates.keyword.show, bindings) +
         render(templates.site.footer, bindings);
   }else{
      if(req.docId){
         var keyword = extractKeywordFromDocId(req.docId);
         bindings.site.title = "Keyword: " + keyword;
         if(keyword){
            return render(templates.site.header, bindings) +
               render(templates.keyword.new, bindings) +
               render(templates.site.footer, bindings);
         }else{
            return render_error(NOT_FOUND, {format: "html"});
         }
      }else{
         return render_error(NOT_FOUND, {format: "html"});
      }
   }
}