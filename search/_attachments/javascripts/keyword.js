$.CouchApp(function(app){
   var paths = window.location.pathname.split("/");
   var keyword = paths.pop();
   if( keyword.match(/^ts-search-(.+)/) ){
      keyword = decodeURIComponent(RegExp.$1);
      $("form.search input[name='keyword']").val(keyword);
   }
   $("form#ts-search").submit(function(e){
      var form = $(this);
      var url    = form.attr("action");
      var method = form.attr("method");
      var data   = form.serialize();
      var keyword = form.find("input[name='keyword']").val();
      $.ajax({
         type: form.attr("method"),
         url: form.attr("action"),
         data : form.serialize(),
         success: function(msg){
            // reload the page
            window.location.href = app.showPath("keyword", encodeURIComponent("ts-search-" + keyword));
         },
         failure: function(req, status){
            alert(req.responseText);
         }
      });
      e.preventDefault();
      return false;
   });

   $(".prettyDate").each(function(){
      $(this).text(prettyDate($(this).text()));
   });

   $(".prettyTime").each(function(){
      $(this).text(prettyTime($(this).text()));
   });

   var tl_url = app.listPath("timeline", "tweets");
   var params = $.param({
      descending:true,
      limit: 20,
      startkey : JSON.stringify([keyword, "\u9999"]),
      endkey   : JSON.stringify([keyword])
   });

   var setReadMore = function(){
      var last = $("#timeline li#last");
      var a = $("#timeline a#more");
      var url = a.attr("href");
      a.click(function(e){
         $.get(url, function(data){
            last.replaceWith(data);
            setReadMore();
         });
         e.preventDefault();
         return false;
      });
   };
   $("#timeline").load(tl_url + "?" + params, function(){
      if($("#timeline li").length == 0){
         $("#timeline").replaceWith("<p>The search results are being cached on this site. Please wait a few minutes and reload the page.</p>");
      }else{
         $("#timeline .prettyDate").each(function(){
            $(this).text(prettyDate($(this).text()));
         });
         setReadMore();
      }
   });
});
