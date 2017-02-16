 app.get('/Campaign' function(req, res) {
   mongoose.model('Campaign').find(function(err, Campaign){
     res.send(Campaign);
   });
 });
