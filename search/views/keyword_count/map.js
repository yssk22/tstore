function(doc){
   if(doc.type=="TStore::Tweet" && doc.keyword){
      emit(["by_lang", doc.tweet.iso_language_code || "unknown"], 1);
      emit(["by_user", doc.tweet.from_user], 1);
      emit(["by_keyword", doc.keyword], 1);
   }
}