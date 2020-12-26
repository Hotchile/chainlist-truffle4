pragma solidity ^0.4.18;

import "./Ownable.sol";

contract ChainList is Ownable{
  // custom types
  struct Article {

    uint id;
    address seller;
    address buyer;
    string name;
    string description;
    uint256 price;
  }


  //state variables
  address seller;
  address buyer;
  string name;
  string description;
  uint256 price; //unsigned integer

  mapping (uint => Article) public articles;
  uint articleCounter;

  //events
  event LogSellArticle(
    uint indexed _id,
    address indexed _seller,
    string _name,
    uint _price
    );
//constructor
  event LogBuyArticle(
    uint indexed _id,
    address indexed _seller,
    address indexed _buyer,
    string _name,
    uint _price
    );

//deactivate the contracts
    function kill() public onlyOwner {
      selfdestruct(owner);
    }

  //sell an article
  function sellArticle(string _name, string _description, uint256 _price) public{
    // a new article
    articleCounter++;
    //storing article
    articles[articleCounter] = Article(
      articleCounter,
      msg.sender,
      0x0,
      _name,
      _description,
      _price
      );

    LogSellArticle(articleCounter, msg.sender, _name, _price);
  }

  // dont need below as we are getting ID through counter and calling with getNumberOfArticles
  //function getArticle() public view returns(
    //address _seller,
    //address _buyer,
    //string _name,
    //string _description,
    //uint256 _price){
    //return (seller, buyer, name, description, price);
  //}

  //fetch number of artilces in the countract

  function getNumberOfArticles() public view returns(uint){
    return articleCounter;
  }

  //fetch and return all article ids for articles still for sale
  function getArticlesForSale() public view returns (uint[]){
    //prepare output array
    uint[] memory articleIds = new uint[](articleCounter);

    uint numberOfArticlesForSale = 0;
    //
    for(uint i = 1; i <= articleCounter; i++){
      //keep id if article is still for sellArticle
      if(articles[i].buyer == 0x0){
        articleIds[numberOfArticlesForSale] = articles[i].id;
        numberOfArticlesForSale++;

      }
    }

    // copy the articleIds array into a smaller forSale array
    uint[] memory forSale = new uint[](numberOfArticlesForSale);
    for(uint j = 0; j < numberOfArticlesForSale; j++){
      forSale[j] = articleIds[j];

    }
    return forSale;
  }

  //buy
  function buyArticle(uint _id) payable public{ //payble so you can send value to it
    //check items for sell
    require(articleCounter > 0);

    //check the article exists
    require(_id>0 && _id<=articleCounter);

    //retrive article from mapping
    Article storage article = articles[_id];

    //check item hasnt be solid
    require(article.buyer == 0x0);
    //dont allow seller to buy own items
    require(msg.sender != article.seller);
    //value sent corresponds to price of items
    require(msg.value == article.price);
    //keep track of buyer info
    article.buyer = msg.sender;
    //buyer can pay seller
    article.seller.transfer(msg.value);
    //trigger events
    LogBuyArticle(_id, article.seller, article.buyer, article.name, article.price);
  }
}
