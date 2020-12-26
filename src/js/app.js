App = {
     web3Provider: null,
     contracts: {},
     account: 0x0,
     loading: false,

     init: function() {
          //load articlesRow
        //var articlesRow = $('#articlesRow');
        //var articleTemplate = $('#articleTemplate');

        //articleTemplate.find('.panel-title').text('article 1');
        //articleTemplate.find('.article-description').text('Description for article 1');
        //articleTemplate.find('.article-price').text("10.23");
        //articleTemplate.find('article-seller').text("0x01234567890123456789012345678901");

        //articlesRow.append(articleTemplate.html());

          return App.initWeb3();
     },

     initWeb3: function() {
       // initialize web3
       if(typeof web3 !== 'undefined') {
         //reuse the provider of the Web3 object injected by Metamask
         App.web3Provider = web3.currentProvider;
       } else {
         //create a new provider and plug it directly into our local node
         App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
       }
       web3 = new Web3(App.web3Provider);

       App.displayAccountInfo();

       return App.initContract();
     },

     displayAccountInfo: function(){
       //console.log(web3.eth.accounts);
       web3.eth.getCoinbase(function(err, account) {
         if (err === null){
           App.account = account;
           $('#account').text(account);
           web3.eth.getBalance(account, function(err, balance) {
             if (err === null){
               $('#accountBalance').text(web3.fromWei(balance, "ether") +" ETH");
             }
           })
         }
       });
     },

     initContract: function() {
          $.getJSON('ChainList.json',function(chainListArtifact){
            // get the contract artifact file and use it to instantiate a truffle abstraction
            App.contracts.ChainList = TruffleContract(chainListArtifact);
            // set the provider for our contracts
            App.contracts.ChainList.setProvider(App.web3Provider);
            //listenToEvents
            App.listenToEvents();
            // retrive the article from the contract
            return App.reloadArticles();

          });
     },

     reloadArticles: function() {
       //avoid reentry

       if(App.loading){
         return;
       }

       App.loading = true;
       // refresh account information because the balance might have changed
       App.displayAccountInfo();

       var chainListInstance;

       // retrieve the article placeholder and clear it
       //$('#articlesRow').empty();

       App.contracts.ChainList.deployed().then(function(instance) {
         chainListInstance = instance;
         return chainListInstance.getArticlesForSale();
       }).then(function(articleIds) {

        $('#articlesRow').empty();

        for(var i = 0; i < articleIds.length; i++) {
          var articleId = articleIds[i];
          chainListInstance.articles(articleId.toNumber()).then(function(article){
            App.displayArticle(article[0], article[1], article[3], article[4], article[5]);
          });
        }
        App.loading = false;
       }).catch(function(err) {
         console.error(err.message);
         App.loading = false;
       });
     },

     displayArticle: function(id, seller, name, description, price) {
       var articlesRow = $('#articlesRow');
       var etherPrice =  web3.fromWei(price, "ether");
       var articleTemplate = $('#articleTemplate');

       articleTemplate.find('.panel-title').text(name);
       articleTemplate.find('.article-description').text(description);
       articleTemplate.find('.article-price').text(etherPrice + " ETH");
       articleTemplate.find('.btn-buy').attr('data-id', id);
       articleTemplate.find('.btn-buy').attr('data-value', etherPrice);

       //seller
       if(seller == App.account){
         articleTemplate.find('.article-seller').text("You");
         articleTemplate.find('.btn-buy').hide();
       }else {
         articleTemplate.find('.article-seller').text(seller);
         articleTemplate.find('.btn-buy').show();
       }
       //add this new artilce
       articlesRow.append(articleTemplate.html());
     },


     sellArticle:function(){
       //retrive details of the articlesRow
       var _article_name = $('#article_name').val();
       var _description = $('#article_description').val();
       var _price = web3.toWei(parseFloat($('#article_price').val() || 0), "ether");

       if ((_article_name.trim() == '') || (_price ==  0)){
         //nothing to sell; nothing on name or price is 0
         return false;
       }
       App.contracts.ChainList.deployed().then(function(instance){
         return instance.sellArticle(_article_name, _description, _price, {
           from: App.account,
           gas: 500000
         });
       }).then(function(result){
         //App.reloadArticles(); dont need this anymore events taking care of this
       }).catch(function(err){
         console.error(err);
       });
     },
     //listen to events triggered by contract`
     listenToEvents: function(){
       App.contracts.ChainList.deployed().then(function(instance){
         instance.LogSellArticle({}, {}).watch(function(error, event){
           if (!error){
             $('#events').append('<li class="list-group-item">' + event.args._name + ' is now for sale</li>')
           }else {
             console.error(error);
           }
           App.reloadArticles();
         });
         instance.LogBuyArticle({}, {}).watch(function(error, event){
           if (!error){
             $('#events').append('<li class="list-group-item">' + event.args._buyer + ' bought '+event.args._name +'</li>')
           }else {
             console.error(error);
           }
           App.reloadArticles();
         })
       });
     },

     buyArticle: function(){
       event.preventDefault();
       //retrieve article Price
       var _articleId = $(event.target).data('id');
       var _price = parseFloat($(event.target).data('value'));

       App.contracts.ChainList.deployed().then(function(instance){
         return instance.buyArticle(_articleId, {
           from: App.account,
           value: web3.toWei(_price, "ether"),
           gas: 500000
         });
       }).catch(function(error){
         console.error(error);
       });
     }
   };

$(function() {
     $(window).load(function() {
          App.init();
     });
});
