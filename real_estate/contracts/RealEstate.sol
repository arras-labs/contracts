// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RealEstate
 * @dev Smart contract per gestire proprietà immobiliari tokenizzate frazionalmente su Polygon
 * Ogni immobile ha una pool di token che gli utenti possono acquistare
 */
contract RealEstate is ERC721, Ownable {
    uint256 private _propertyIds;
    uint256 public constant TOKEN_PRICE_USD = 50; // Prezzo di ogni token in USD
    
    struct Property {
        uint256 id;
        string name;
        string description;
        string location;
        uint256 totalValueUSD; // Valore totale in USD (prezzo + spese gestione)
        uint256 area; // in metri quadri
        address owner;
        string imageUrl;
        uint256 listedTimestamp;
        uint256 totalTokens; // Totale token disponibili per questa proprietà
        uint256 tokensSold; // Token già venduti
        bool isActive; // True se la pool è attiva
    }
    
    // Struct per tracciare gli investimenti in token
    struct TokenInvestment {
        uint256 propertyId;
        address investor;
        uint256 tokensOwned;
        uint256 investmentDate;
    }
    
    // Mapping da property ID a Property
    mapping(uint256 => Property) public properties;
    
    // Mapping: propertyId => investor address => numero di token posseduti
    mapping(uint256 => mapping(address => uint256)) public propertyTokenBalances;
    
    // Mapping per tracciare tutti gli investitori di una proprietà
    mapping(uint256 => address[]) public propertyInvestors;
    
    // Mapping per verificare se un indirizzo è già investitore di una proprietà
    mapping(uint256 => mapping(address => bool)) public isInvestor;
    
    // Eventi
    event PropertyListed(
        uint256 indexed propertyId, 
        string name, 
        uint256 totalValueUSD, 
        uint256 totalTokens,
        address owner
    );
    event TokensPurchased(
        uint256 indexed propertyId, 
        address indexed buyer, 
        uint256 tokenAmount,
        uint256 totalCost
    );
    event PoolCompleted(
        uint256 indexed propertyId,
        uint256 totalRaised
    );
    event PropertyDelisted(uint256 indexed propertyId);
    
    constructor() ERC721("RealEstateNFT", "RENFT") Ownable(msg.sender) {}
    
    /**
     * @dev Lista una nuova proprietà immobiliare con pool di token
     * @param _totalValueUSD Valore totale in USD (prezzo immobile + spese gestione)
     */
    function listProperty(
        string memory _name,
        string memory _description,
        string memory _location,
        uint256 _totalValueUSD,
        uint256 _area,
        string memory _imageUrl
    ) public returns (uint256) {
        require(_totalValueUSD > 0, "Il valore deve essere maggiore di zero");
        require(_area > 0, "L'area deve essere maggiore di zero");
        require(_totalValueUSD >= TOKEN_PRICE_USD, "Il valore deve essere almeno pari al prezzo di un token");
        
        _propertyIds++;
        uint256 newPropertyId = _propertyIds;
        
        // Calcola il numero totale di token per questa proprietà
        uint256 totalTokens = _totalValueUSD / TOKEN_PRICE_USD;
        require(totalTokens > 0, "Il valore deve generare almeno 1 token");
        
        // Minta l'NFT al proprietario (rappresenta la proprietà legale)
        _safeMint(msg.sender, newPropertyId);
        
        properties[newPropertyId] = Property({
            id: newPropertyId,
            name: _name,
            description: _description,
            location: _location,
            totalValueUSD: _totalValueUSD,
            area: _area,
            owner: msg.sender,
            imageUrl: _imageUrl,
            listedTimestamp: block.timestamp,
            totalTokens: totalTokens,
            tokensSold: 0,
            isActive: true
        });
        
        emit PropertyListed(newPropertyId, _name, _totalValueUSD, totalTokens, msg.sender);
        
        return newPropertyId;
    }
    
    /**
     * @dev Acquista token di una proprietà
     * @param _propertyId ID della proprietà
     * @param _tokenAmount Numero di token da acquistare
     * @param _tokenPriceETH Prezzo di un singolo token in ETH (calcolato dal frontend)
     */
    function buyTokens(
        uint256 _propertyId, 
        uint256 _tokenAmount,
        uint256 _tokenPriceETH
    ) public payable {
        Property storage property = properties[_propertyId];
        
        require(_propertyId > 0 && _propertyId <= _propertyIds, "Proprieta non esistente");
        require(property.isActive, "Pool non attiva");
        require(_tokenAmount > 0, "Devi acquistare almeno 1 token");
        require(
            property.tokensSold + _tokenAmount <= property.totalTokens, 
            "Token insufficienti nella pool"
        );
        
        uint256 totalCost = _tokenPriceETH * _tokenAmount;
        require(msg.value >= totalCost, "Fondi insufficienti");
        
        // Trasferisce i fondi al proprietario
        payable(property.owner).transfer(msg.value);
        
        // Aggiorna il balance dei token per l'investitore
        if (propertyTokenBalances[_propertyId][msg.sender] == 0 && !isInvestor[_propertyId][msg.sender]) {
            propertyInvestors[_propertyId].push(msg.sender);
            isInvestor[_propertyId][msg.sender] = true;
        }
        
        propertyTokenBalances[_propertyId][msg.sender] += _tokenAmount;
        property.tokensSold += _tokenAmount;
        
        emit TokensPurchased(_propertyId, msg.sender, _tokenAmount, msg.value);
        
        // Se tutti i token sono venduti, la pool è completata
        if (property.tokensSold >= property.totalTokens) {
            property.isActive = false;
            emit PoolCompleted(_propertyId, property.totalValueUSD);
        }
    }
    
    /**
     * @dev Disattiva una pool (solo il proprietario)
     */
    function deactivatePool(uint256 _propertyId) public {
        Property storage property = properties[_propertyId];
        
        require(ownerOf(_propertyId) == msg.sender, "Non sei il proprietario");
        require(property.isActive, "La pool non e attiva");
        
        property.isActive = false;
        
        emit PropertyDelisted(_propertyId);
    }
    
    /**
     * @dev Riattiva una pool (solo il proprietario)
     */
    function reactivatePool(uint256 _propertyId) public {
        Property storage property = properties[_propertyId];
        
        require(ownerOf(_propertyId) == msg.sender, "Non sei il proprietario");
        require(!property.isActive, "La pool e gia attiva");
        require(property.tokensSold < property.totalTokens, "Tutti i token sono gia stati venduti");
        
        property.isActive = true;
    }
    
    /**
     * @dev Restituisce le informazioni sulla pool di una proprietà
     */
    function getPoolInfo(uint256 _propertyId) public view returns (
        uint256 totalTokens,
        uint256 tokensSold,
        uint256 tokensAvailable,
        uint256 totalValueUSD,
        uint256 currentValueUSD,
        uint256 percentageComplete,
        bool isActive,
        address[] memory investors
    ) {
        require(_propertyId > 0 && _propertyId <= _propertyIds, "Proprieta non esistente");
        
        Property memory property = properties[_propertyId];
        
        totalTokens = property.totalTokens;
        tokensSold = property.tokensSold;
        tokensAvailable = property.totalTokens - property.tokensSold;
        totalValueUSD = property.totalValueUSD;
        currentValueUSD = property.tokensSold * TOKEN_PRICE_USD;
        percentageComplete = (property.tokensSold * 100) / property.totalTokens;
        isActive = property.isActive;
        investors = propertyInvestors[_propertyId];
        
        return (
            totalTokens,
            tokensSold,
            tokensAvailable,
            totalValueUSD,
            currentValueUSD,
            percentageComplete,
            isActive,
            investors
        );
    }
    
    /**
     * @dev Restituisce il numero di token posseduti da un investitore per una proprietà
     */
    function getInvestorTokens(uint256 _propertyId, address _investor) public view returns (uint256) {
        return propertyTokenBalances[_propertyId][_investor];
    }
    
    /**
     * @dev Restituisce tutte le proprietà attive
     */
    function getActiveProperties() public view returns (Property[] memory) {
        uint256 totalProperties = _propertyIds;
        uint256 activeCount = 0;
        
        // Conta le proprietà attive
        for (uint256 i = 1; i <= totalProperties; i++) {
            if (properties[i].isActive) {
                activeCount++;
            }
        }
        
        // Crea l'array delle proprietà attive
        Property[] memory activeProperties = new Property[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= totalProperties; i++) {
            if (properties[i].isActive) {
                activeProperties[index] = properties[i];
                index++;
            }
        }
        
        return activeProperties;
    }
    
    /**
     * @dev Restituisce tutte le proprietà di un utente
     */
    function getMyProperties(address _owner) public view returns (Property[] memory) {
        uint256 totalProperties = _propertyIds;
        uint256 ownedCount = 0;
        
        // Conta le proprietà possedute (proprietario dell'NFT)
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
     * @dev Restituisce tutte le proprietà in cui un utente ha investito
     */
    function getMyInvestments(address _investor) public view returns (Property[] memory, uint256[] memory) {
        uint256 totalProperties = _propertyIds;
        uint256 investmentCount = 0;
        
        // Conta gli investimenti
        for (uint256 i = 1; i <= totalProperties; i++) {
            if (propertyTokenBalances[i][_investor] > 0) {
                investmentCount++;
            }
        }
        
        // Crea gli array degli investimenti
        Property[] memory investedProperties = new Property[](investmentCount);
        uint256[] memory tokenAmounts = new uint256[](investmentCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= totalProperties; i++) {
            if (propertyTokenBalances[i][_investor] > 0) {
                investedProperties[index] = properties[i];
                tokenAmounts[index] = propertyTokenBalances[i][_investor];
                index++;
            }
        }
        
        return (investedProperties, tokenAmounts);
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
