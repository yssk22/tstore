function replacePrettyDate(selector){
   var e;
   if(selector){
      e = $(selector).find(".prettyDate");
   }else{
      e = $(".prettyDate");
   }
   e.each(function(){
      $(this).attr("prettyDate", $(this).text());
      $(this).text(prettyDate($(this).text())).
         addClass("prettyDated").
         removeClass("prettyDate");
   });
}

function replacePrettyTime(selector){
   var e;
   if(selector){
      e = $(selector).find(".prettyTime");
   }else{
      e = $(".prettyTime");
   }
   e.each(function(){
      $(this).attr("prettyTime", $(this).text());
      $(this).text(prettyTime($(this).text())).
         addClass("prettyTimed").
         removeClass("prettyTime");
   });
}

function prettyDate(time){
   var date = new Date(time),
       diff = (((new Date()).getTime() - date.getTime()) / 1000),
       day_diff = Math.floor(diff / 86400);

   // if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 ) return;

   return day_diff < 1 && (
      diff < 60 && "just now" ||
      	diff < 120 && "1 minute ago" ||
      	diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
      	diff < 7200 && "1 hour ago" ||
      	diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
      day_diff == 1 && "yesterday" ||
      day_diff < 21 && day_diff + " days ago" ||
      day_diff < 45 && Math.ceil( day_diff / 7 ) + " weeks ago" ||
      day_diff < 730 && Math.ceil( day_diff / 31 ) + " months ago" ||
      Math.ceil( day_diff / 365 ) + " years ago";
};

function prettyTime(msecs){
   var secs = msecs / 1000,
       days = Math.floor(secs / 86400);
   return days< 1 && (
      secs < 1 && "at once" ||
      	secs < 60 && secs + " secs" ||
      	secs < 3600 && Math.floor( secs / 60 ) + " minutes" ||
      	secs < 7200 && "1 hour" ||
      	secs < 86400 && Math.floor( secs / 3600 ) + " hours") ||
      days == 1 && "one day" ||
      days < 21 && day_diff + " days" ||
      days < 45 && Math.ceil( day_diff / 7 ) + " weeks" ||
      days < 730 && Math.ceil( day_diff / 31 ) + " months" ||
      Math.ceil( days / 365 ) + " years";
}
