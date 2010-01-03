function(head, req){
   // !code vendor/couchapp/path.js
   // !code vendor/couchapp/date.js
   // !code vendor/crayon/lib/escape.js
   // !code vendor/crayon/lib/template.js
   // !code vendor/crayon/lib/error.js

   // !code lib/helper.js

   // !json couchapp
   // !json templates.timeline

   var bindings = {
      assetPath : assetPath()
   };

   var row;
   var last_row;
   send(render(templates.timeline.head, bindings));
   while(row = getRow()){
      last_row = row;
      bindings.tweet = row.value;
      send(render(templates.timeline.row, bindings));
   }
   // set next page parameter if found a row
   if(last_row){
      bindings.next_page = listPath("timeline", "tweets") + encodeOptions({
         descending: true,
         startkey: last_row.key,
         endkey: [last_row.key[0]],
         limit: req.query.limit,
         skip: 1
      });
      return render(templates.timeline.tail, bindings);
   }else{
      return "no more";
   }
}