// tstore script
App = null;
$.CouchApp(function(app){
   var CONFIG = JSON.parse($("#site_config").attr("data"));
   var USE_EXTERNAL  = CONFIG["use_external"];
   var PING_RETRY    = CONFIG["external_ping_retry"];
   var PING_AFTER    = CONFIG["external_ping_after"];
   var PING_INTERVAL = CONFIG["external_ping_interval"] * 1000;

   var ping = 0;
   function updateCrawlerStatus(){
      app.db.openDoc("ts-search-crawler-status",{
         success: function(doc) {
            var updated = new Date(doc.updated_at);
            var diff = (new Date() - updated) / 60000;
            $("#crawler_last_udated").text(updated.toLocaleString());
            if( diff >= PING_AFTER ){
               if( ping < PING_RETRY ){
                  setTimeout("pingExternal()", PING_INTERVAL);
               }
            }else{
               markSiteStatus("up");
            }
         },
         error: function(status, error, reason){
            markSiteStatus("down");
            if( ping < PING_RETRY ){
               setTimeout("pingExternal()", PING_INTERVAL);
            }
         }
      });
   }

   function pingExternal(){
      if(USE_EXTERNAL == false){
         return;
      }
      ping += 1;
      var uri = app.db.uri + "_ts-search-crawler";
      $.ajax({url : uri, type: "POST", dataType: "json",
              complete: function(req){
                 var resp = $.httpData(req, "json");
                 if (req.status == 200){
                    markSiteStatus("up");
                    updateCrawlerStatus();
                 }
                 else {
                    markSiteStatus("down");
                 }
              }
             });
   }
   // export pingExtTernal globally for setTimeout
   window.pingExternal = pingExternal;

   function markSiteStatus(up_or_down){
      $("#crawler_last_udated").toggleClass("up", up_or_down == "up");
      $("#crawler_last_udated").toggleClass("down", up_or_down == "down");
   }

   $("header form.search").submit(function(e){
      e.preventDefault();
      var keyword = $(this).find("input[name='keyword']").val();
      if( keyword == "" ){
         window.location.href = app.showPath("top");
      }else{
         var docId = encodeURIComponent("ts-search-" + keyword);
         window.location.href = app.showPath("keyword", docId);
      }
      return fasle;
   });
   app.db.info({
      success: function(doc){
         var size = (doc.disk_size / (1024 * 1024)).toFixed(1);
         $("#disk_used").text(size + " MB");
      }
   });

   updateCrawlerStatus();
});
