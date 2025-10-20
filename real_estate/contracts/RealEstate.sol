// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RealEstate
 * @dev Smart contract per gestire proprietà immobiliari tokenizzate su Polygon
 */
contract RealEstate is ERC721, Ownable {
    uint256 private _propertyIds;
    
    struct Property {
        uint256 id;
        string name;
        string description;
        string location;
        uint256 price;
        uint256 area; // in metri quadri
        address owner;
        bool isForSale;
        string imageUrl;
        uint256 listedTimestamp;
    }
    
    // Mapping da property ID a Property
    mapping(uint256 => Property) public properties;
    
    // Eventi
    event PropertyListed(uint256 indexed propertyId, string name, uint256 price, address owner);
    event PropertySold(uint256 indexed propertyId, address from, address to, uint256 price);
    event PropertyPriceChanged(uint256 indexed propertyId, uint256 oldPrice, uint256 newPrice);
    event PropertyDelisted(uint256 indexed propertyId);
    
    constructor() ERC721("RealEstateNFT", "RENFT") Ownable(msg.sender) {}
    
    /**
     * @dev Lista una nuova proprietà immobiliare
     */
    function listProperty(
        string memory _name,
        string memory _description,
        string memory _location,
        uint256 _price,
        uint256 _area,
        string memory _imageUrl
    ) public returns (uint256) {
        require(_price > 0, "Il prezzo deve essere maggiore di zero");
        require(_area > 0, "L'area deve essere maggiore di zero");
        
        _propertyIds++;
        uint256 newPropertyId = _propertyIds;
        
        _safeMint(msg.sender, newPropertyId);
        
        properties[newPropertyId] = Property({
            id: newPropertyId,
            name: _name,
            description: _description,
            location: _location,
            price: _price,
            area: _area,
            owner: msg.sender,
            isForSale: true,
            imageUrl: _imageUrl,
            listedTimestamp: block.timestamp
        });
        
        emit PropertyListed(newPropertyId, _name, _price, msg.sender);
        
        return newPropertyId;
    }
    
    /**
     * @dev Acquista una proprietà
     */
    function buyProperty(uint256 _propertyId) public payable {
        Property storage property = properties[_propertyId];
        
        require(_propertyId > 0 && _propertyId <= _propertyIds, "Proprieta non esistente");
        require(property.isForSale, "Proprieta non in vendita");
        require(msg.value >= property.price, "Fondi insufficienti");
        require(msg.sender != property.owner, "Non puoi acquistare la tua proprieta");
        
        address previousOwner = property.owner;
        
        // Trasferisce i fondi al proprietario precedente
        payable(previousOwner).transfer(msg.value);
        
        // Trasferisce l'NFT
        _transfer(previousOwner, msg.sender, _propertyId);
        
        // Aggiorna i dati della proprietà
        property.owner = msg.sender;
        property.isForSale = false;
        
        emit PropertySold(_propertyId, previousOwner, msg.sender, msg.value);
    }
    
    /**
     * @dev Mette in vendita una proprietà
     */
    function setForSale(uint256 _propertyId, uint256 _newPrice) public {
        Property storage property = properties[_propertyId];
        
        require(ownerOf(_propertyId) == msg.sender, "Non sei il proprietario");
        require(_newPrice > 0, "Il prezzo deve essere maggiore di zero");
        
        uint256 oldPrice = property.price;
        property.price = _newPrice;
        property.isForSale = true;
        
        emit PropertyPriceChanged(_propertyId, oldPrice, _newPrice);
    }
    
    /**
     * @dev Rimuove una proprietà dalla vendita
     */
    function removeFromSale(uint256 _propertyId) public {
        Property storage property = properties[_propertyId];
        
        require(ownerOf(_propertyId) == msg.sender, "Non sei il proprietario");
        require(property.isForSale, "La proprieta non e in vendita");
        
        property.isForSale = false;
        
        emit PropertyDelisted(_propertyId);
    }
    
    /**
     * @dev Restituisce tutte le proprietà in vendita
     */
    function getPropertiesForSale() public view returns (Property[] memory) {
        uint256 totalProperties = _propertyIds;
        uint256 forSaleCount = 0;
        
        // Conta le proprietà in vendita
        for (uint256 i = 1; i <= totalProperties; i++) {
            if (properties[i].isForSale) {
                forSaleCount++;
            }
        }
        
        // Crea l'array delle proprietà in vendita
        Property[] memory forSaleProperties = new Property[](forSaleCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= totalProperties; i++) {
            if (properties[i].isForSale) {
                forSaleProperties[index] = properties[i];
                index++;
            }
        }
        
        return forSaleProperties;
    }
    
    /**
     * @dev Restituisce tutte le proprietà di un utente
     */
    function getMyProperties(address _owner) public view returns (Property[] memory) {
        uint256 totalProperties = _propertyIds;
        uint256 ownedCount = 0;
        
        // Conta le proprietà possedute
        for (uint256 i = 1; i <= totalProperties; i++) {
            if (ownerOf(i) == _owner) {
                ownedCount++;
            }
        }
        
        // Crea l'array delle proprietà possedute
        Property[] memory ownedProperties = new Property[](ownedCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= totalProperties; i++) {
            if (ownerOf(i) == _owner) {
                ownedProperties[index] = properties[i];
                index++;
            }
        }
        
        return ownedProperties;
    }
    
    /**
     * @dev Restituisce una proprietà specifica
     */
    function getProperty(uint256 _propertyId) public view returns (Property memory) {
        require(_propertyId > 0 && _propertyId <= _propertyIds, "Proprieta non esistente");
        return properties[_propertyId];
    }
    
    /**
     * @dev Restituisce il numero totale di proprietà
     */
    function getTotalProperties() public view returns (uint256) {
        return _propertyIds;
    }
}
