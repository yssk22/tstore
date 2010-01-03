function extractKeywordFromDocId(docId){
   if( docId && docId.match(/^ts-search-(.+)/)){
      return RegExp.$1;
   }
   return null;
}
