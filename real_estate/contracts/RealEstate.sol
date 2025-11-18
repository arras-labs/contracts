// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title RealEstate - Fractional Property Tokenization Platform
 * @author Arras Labs
 * @notice This contract enables fractional property ownership through tokenization
 * @dev Implements ERC721 for property ownership NFTs with pool-based token sales
 *
 * Mission: Democratizing real estate investment by breaking down barriers to entry
 * and creating an inclusive, liquid ecosystem where anyone can invest in property.
 */
contract RealEstate is ERC721, AccessControl, ReentrancyGuard, Pausable {
    // =========================
    // Role Definitions
    // =========================
    bytes32 public constant PROPERTY_MANAGER_ROLE = keccak256("PROPERTY_MANAGER_ROLE");
    bytes32 public constant COMPLIANCE_OFFICER_ROLE = keccak256("COMPLIANCE_OFFICER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // =========================
    // State Variables
    // =========================
    uint256 private _propertyIds;
    uint256 private _documentIds;

    uint256 public constant TOKEN_PRICE_USD = 50; // Price of each fractional token in USD
    uint256 public constant BASIS_POINTS = 10000; // For percentage calculations (100.00%)
    uint256 public platformFeeBasisPoints = 250; // 2.5% platform fee

    // Stablecoin support for payments
    IERC20 public immutable usdcToken; // USDC stablecoin address
    bool public stablecoinPaymentsEnabled;

    // =========================
    // Structs
    // =========================

    /**
     * @dev Property struct representing a tokenized real estate asset
     */
    struct Property {
        uint256 id;
        string name;
        string description;
        string location;
        uint256 totalValueUSD; // Total property value in USD
        uint256 area; // Area in square meters
        address owner; // Property owner (NFT holder)
        string imageUrl;
        uint256 listedTimestamp;
        uint256 totalTokens; // Total fractional tokens available
        uint256 tokensSold; // Tokens already sold
        bool isActive; // Pool is active for purchases
        uint256 estimatedAnnualYield; // Estimated yield in basis points (500 = 5%)
        uint256 totalDividendsDistributed; // Total dividends paid out
        uint256 lastDividendDistribution; // Timestamp of last dividend
    }

    /**
     * @dev Document struct for property legal documents stored on IPFS
     */
    struct Document {
        uint256 id;
        uint256 propertyId;
        string name;
        string documentType; // e.g., "Contract", "Appraisal", "Floor Plan"
        string ipfsHash; // IPFS hash of the document
        uint256 uploadDate;
        address uploadedBy;
        bool isVerified; // Verified by compliance officer
    }

    /**
     * @dev Dividend distribution record
     */
    struct DividendDistribution {
        uint256 propertyId;
        uint256 totalAmount;
        uint256 amountPerToken;
        uint256 timestamp;
        string description; // e.g., "Q1 2024 Rent Distribution"
    }

    // =========================
    // Mappings
    // =========================

    mapping(uint256 => Property) public properties;
    mapping(uint256 => mapping(address => uint256)) public propertyTokenBalances;
    mapping(uint256 => address[]) public propertyInvestors;
    mapping(uint256 => mapping(address => bool)) public isInvestor;

    // Documents
    mapping(uint256 => Document) public documents;
    mapping(uint256 => uint256[]) public propertyDocuments;

    // Dividends
    mapping(uint256 => DividendDistribution[]) public propertyDividends;
    mapping(uint256 => mapping(address => mapping(uint256 => bool))) public dividendClaimed; // propertyId => investor => distributionIndex => claimed

    // Compliance
    mapping(address => bool) public kycVerified;
    mapping(address => bool) public blacklisted;

    // Pending withdrawals (pull payment pattern for security)
    mapping(address => uint256) public pendingWithdrawals;

    // =========================
    // Events
    // =========================

    event PropertyListed(
        uint256 indexed propertyId,
        string name,
        uint256 totalValueUSD,
        uint256 totalTokens,
        address indexed owner
    );

    event TokensPurchased(
        uint256 indexed propertyId,
        address indexed buyer,
        uint256 tokenAmount,
        uint256 totalCost,
        bool paidInStablecoin
    );

    event PoolCompleted(
        uint256 indexed propertyId,
        uint256 totalRaised
    );

    event PropertyDelisted(uint256 indexed propertyId);

    event DocumentUploaded(
        uint256 indexed documentId,
        uint256 indexed propertyId,
        string name,
        string documentType,
        address indexed uploadedBy
    );

    event DocumentVerified(
        uint256 indexed documentId,
        address indexed verifiedBy
    );

    event YieldUpdated(
        uint256 indexed propertyId,
        uint256 newYield
    );

    event DividendDistributed(
        uint256 indexed propertyId,
        uint256 indexed distributionIndex,
        uint256 totalAmount,
        uint256 amountPerToken
    );

    event DividendClaimed(
        uint256 indexed propertyId,
        address indexed investor,
        uint256 amount
    );

    event KYCStatusUpdated(
        address indexed user,
        bool isVerified
    );

    event BlacklistStatusUpdated(
        address indexed user,
        bool isBlacklisted
    );

    event PlatformFeeUpdated(
        uint256 oldFee,
        uint256 newFee
    );

    event StablecoinPaymentToggled(
        bool enabled
    );

    event WithdrawalQueued(
        address indexed recipient,
        uint256 amount
    );

    event WithdrawalCompleted(
        address indexed recipient,
        uint256 amount
    );

    // =========================
    // Modifiers
    // =========================

    modifier onlyPropertyOwner(uint256 _propertyId) {
        require(ownerOf(_propertyId) == msg.sender, "Not property owner");
        _;
    }

    modifier propertyExists(uint256 _propertyId) {
        require(_propertyId > 0 && _propertyId <= _propertyIds, "Property does not exist");
        _;
    }

    modifier onlyKYCVerified() {
        require(kycVerified[msg.sender], "KYC verification required");
        _;
    }

    modifier notBlacklisted(address _user) {
        require(!blacklisted[_user], "Address is blacklisted");
        _;
    }

    // =========================
    // Constructor
    // =========================

    /**
     * @notice Initialize the RealEstate contract
     * @param _usdcToken Address of USDC stablecoin contract
     */
    constructor(address _usdcToken) ERC721("RealEstateNFT", "RENFT") {
        require(_usdcToken != address(0), "Invalid USDC address");

        usdcToken = IERC20(_usdcToken);
        stablecoinPaymentsEnabled = false;

        // Grant roles to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PROPERTY_MANAGER_ROLE, msg.sender);
        _grantRole(COMPLIANCE_OFFICER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        // Auto-verify deployer
        kycVerified[msg.sender] = true;
    }

    // =========================
    // Property Listing Functions
    // =========================

    /**
     * @notice List a new property with fractional token pool
     * @dev Creates NFT for property ownership and initializes token pool
     * @param _name Property name
     * @param _description Property description
     * @param _location Property location
     * @param _totalValueUSD Total property value in USD
     * @param _area Property area in square meters
     * @param _imageUrl URL to property image
     * @param _estimatedYield Estimated annual yield in basis points (500 = 5%)
     * @return propertyId ID of the newly listed property
     */
    function listProperty(
        string memory _name,
        string memory _description,
        string memory _location,
        uint256 _totalValueUSD,
        uint256 _area,
        string memory _imageUrl,
        uint256 _estimatedYield
    )
        public
        whenNotPaused
        onlyKYCVerified
        notBlacklisted(msg.sender)
        returns (uint256)
    {
        require(_totalValueUSD > 0, "Value must be greater than zero");
        require(_area > 0, "Area must be greater than zero");
        require(_totalValueUSD >= TOKEN_PRICE_USD, "Value must be at least one token price");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_location).length > 0, "Location cannot be empty");
        require(_estimatedYield <= 10000, "Yield cannot exceed 100%");

        _propertyIds++;
        uint256 newPropertyId = _propertyIds;

        // Calculate total tokens for this property
        uint256 totalTokens = _totalValueUSD / TOKEN_PRICE_USD;
        require(totalTokens > 0, "Value must generate at least 1 token");

        // Mint NFT to property owner (represents legal ownership)
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
            isActive: true,
            estimatedAnnualYield: _estimatedYield,
            totalDividendsDistributed: 0,
            lastDividendDistribution: 0
        });

        emit PropertyListed(newPropertyId, _name, _totalValueUSD, totalTokens, msg.sender);

        return newPropertyId;
    }

    // =========================
    // Token Purchase Functions
    // =========================

    /**
     * @notice Buy fractional property tokens with ETH
     * @dev Implements pull payment pattern for security
     * @param _propertyId ID of the property
     * @param _tokenAmount Number of tokens to purchase
     * @param _tokenPriceETH Price of one token in ETH (calculated by frontend with oracle)
     */
    function buyTokens(
        uint256 _propertyId,
        uint256 _tokenAmount,
        uint256 _tokenPriceETH
    )
        public
        payable
        propertyExists(_propertyId)
        whenNotPaused
        onlyKYCVerified
        notBlacklisted(msg.sender)
        nonReentrant
    {
        Property storage property = properties[_propertyId];

        require(property.isActive, "Pool is not active");
        require(_tokenAmount > 0, "Must purchase at least 1 token");
        require(
            property.tokensSold + _tokenAmount <= property.totalTokens,
            "Insufficient tokens in pool"
        );
        require(_tokenPriceETH > 0, "Token price must be greater than zero");

        uint256 totalCost = _tokenPriceETH * _tokenAmount;
        require(msg.value >= totalCost, "Insufficient funds");

        // Calculate platform fee
        uint256 platformFee = (totalCost * platformFeeBasisPoints) / BASIS_POINTS;
        uint256 amountToOwner = totalCost - platformFee;

        // Queue withdrawals (pull payment pattern)
        pendingWithdrawals[property.owner] += amountToOwner;
        pendingWithdrawals[address(this)] += platformFee; // Platform fees

        emit WithdrawalQueued(property.owner, amountToOwner);

        // Update investor tracking
        if (propertyTokenBalances[_propertyId][msg.sender] == 0 && !isInvestor[_propertyId][msg.sender]) {
            propertyInvestors[_propertyId].push(msg.sender);
            isInvestor[_propertyId][msg.sender] = true;
        }

        propertyTokenBalances[_propertyId][msg.sender] += _tokenAmount;
        property.tokensSold += _tokenAmount;

        emit TokensPurchased(_propertyId, msg.sender, _tokenAmount, msg.value, false);

        // Check if pool is complete
        if (property.tokensSold >= property.totalTokens) {
            property.isActive = false;
            emit PoolCompleted(_propertyId, property.totalValueUSD);
        }

        // Refund excess payment
        if (msg.value > totalCost) {
            pendingWithdrawals[msg.sender] += (msg.value - totalCost);
        }
    }

    /**
     * @notice Buy fractional property tokens with USDC stablecoin
     * @dev More stable pricing using stablecoin
     * @param _propertyId ID of the property
     * @param _tokenAmount Number of tokens to purchase
     */
    function buyTokensWithStablecoin(
        uint256 _propertyId,
        uint256 _tokenAmount
    )
        public
        propertyExists(_propertyId)
        whenNotPaused
        onlyKYCVerified
        notBlacklisted(msg.sender)
        nonReentrant
    {
        require(stablecoinPaymentsEnabled, "Stablecoin payments not enabled");

        Property storage property = properties[_propertyId];

        require(property.isActive, "Pool is not active");
        require(_tokenAmount > 0, "Must purchase at least 1 token");
        require(
            property.tokensSold + _tokenAmount <= property.totalTokens,
            "Insufficient tokens in pool"
        );

        uint256 totalCostUSD = TOKEN_PRICE_USD * _tokenAmount;
        uint256 totalCostUSDC = totalCostUSD * 1e6; // USDC has 6 decimals

        // Calculate platform fee
        uint256 platformFee = (totalCostUSDC * platformFeeBasisPoints) / BASIS_POINTS;
        uint256 amountToOwner = totalCostUSDC - platformFee;

        // Transfer USDC from buyer to contract
        require(
            usdcToken.transferFrom(msg.sender, address(this), totalCostUSDC),
            "USDC transfer failed"
        );

        // Transfer to property owner
        require(
            usdcToken.transfer(property.owner, amountToOwner),
            "Transfer to owner failed"
        );

        // Update investor tracking
        if (propertyTokenBalances[_propertyId][msg.sender] == 0 && !isInvestor[_propertyId][msg.sender]) {
            propertyInvestors[_propertyId].push(msg.sender);
            isInvestor[_propertyId][msg.sender] = true;
        }

        propertyTokenBalances[_propertyId][msg.sender] += _tokenAmount;
        property.tokensSold += _tokenAmount;

        emit TokensPurchased(_propertyId, msg.sender, _tokenAmount, totalCostUSDC, true);

        // Check if pool is complete
        if (property.tokensSold >= property.totalTokens) {
            property.isActive = false;
            emit PoolCompleted(_propertyId, property.totalValueUSD);
        }
    }

    /**
     * @notice Withdraw pending payments (pull payment pattern)
     * @dev Safer than direct transfers, prevents reentrancy issues
     */
    function withdraw() public nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");

        pendingWithdrawals[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");

        emit WithdrawalCompleted(msg.sender, amount);
    }

    // =========================
    // Pool Management Functions
    // =========================

    /**
     * @notice Deactivate a property pool
     * @param _propertyId ID of the property
     */
    function deactivatePool(uint256 _propertyId)
        public
        propertyExists(_propertyId)
        onlyPropertyOwner(_propertyId)
    {
        Property storage property = properties[_propertyId];
        require(property.isActive, "Pool is not active");

        property.isActive = false;
        emit PropertyDelisted(_propertyId);
    }

    /**
     * @notice Reactivate a property pool
     * @param _propertyId ID of the property
     */
    function reactivatePool(uint256 _propertyId)
        public
        propertyExists(_propertyId)
        onlyPropertyOwner(_propertyId)
    {
        Property storage property = properties[_propertyId];
        require(!property.isActive, "Pool is already active");
        require(property.tokensSold < property.totalTokens, "All tokens are already sold");

        property.isActive = true;
    }

    // =========================
    // Dividend Distribution Functions
    // =========================

    /**
     * @notice Distribute dividends to token holders
     * @dev Property owners can distribute rent or profits to investors
     * @param _propertyId ID of the property
     * @param _description Description of the distribution
     */
    function distributeDividends(
        uint256 _propertyId,
        string memory _description
    )
        public
        payable
        propertyExists(_propertyId)
        onlyPropertyOwner(_propertyId)
        nonReentrant
    {
        require(msg.value > 0, "Dividend amount must be greater than zero");

        Property storage property = properties[_propertyId];
        require(property.tokensSold > 0, "No tokens sold yet");

        uint256 amountPerToken = msg.value / property.tokensSold;
        require(amountPerToken > 0, "Dividend per token too small");

        uint256 distributionIndex = propertyDividends[_propertyId].length;

        propertyDividends[_propertyId].push(DividendDistribution({
            propertyId: _propertyId,
            totalAmount: msg.value,
            amountPerToken: amountPerToken,
            timestamp: block.timestamp,
            description: _description
        }));

        property.totalDividendsDistributed += msg.value;
        property.lastDividendDistribution = block.timestamp;

        emit DividendDistributed(_propertyId, distributionIndex, msg.value, amountPerToken);
    }

    /**
     * @notice Claim dividends for a specific distribution
     * @param _propertyId ID of the property
     * @param _distributionIndex Index of the dividend distribution
     */
    function claimDividend(
        uint256 _propertyId,
        uint256 _distributionIndex
    )
        public
        propertyExists(_propertyId)
        nonReentrant
    {
        require(_distributionIndex < propertyDividends[_propertyId].length, "Invalid distribution index");
        require(!dividendClaimed[_propertyId][msg.sender][_distributionIndex], "Dividend already claimed");

        uint256 tokenBalance = propertyTokenBalances[_propertyId][msg.sender];
        require(tokenBalance > 0, "No tokens owned");

        DividendDistribution memory distribution = propertyDividends[_propertyId][_distributionIndex];
        uint256 dividendAmount = tokenBalance * distribution.amountPerToken;

        dividendClaimed[_propertyId][msg.sender][_distributionIndex] = true;

        (bool success, ) = payable(msg.sender).call{value: dividendAmount}("");
        require(success, "Dividend transfer failed");

        emit DividendClaimed(_propertyId, msg.sender, dividendAmount);
    }

    /**
     * @notice Claim all unclaimed dividends for a property
     * @param _propertyId ID of the property
     */
    function claimAllDividends(uint256 _propertyId)
        public
        propertyExists(_propertyId)
        nonReentrant
    {
        uint256 tokenBalance = propertyTokenBalances[_propertyId][msg.sender];
        require(tokenBalance > 0, "No tokens owned");

        uint256 totalDividend = 0;
        uint256 distributionCount = propertyDividends[_propertyId].length;

        for (uint256 i = 0; i < distributionCount; i++) {
            if (!dividendClaimed[_propertyId][msg.sender][i]) {
                DividendDistribution memory distribution = propertyDividends[_propertyId][i];
                uint256 dividendAmount = tokenBalance * distribution.amountPerToken;
                totalDividend += dividendAmount;
                dividendClaimed[_propertyId][msg.sender][i] = true;
            }
        }

        require(totalDividend > 0, "No dividends to claim");

        (bool success, ) = payable(msg.sender).call{value: totalDividend}("");
        require(success, "Dividend transfer failed");

        emit DividendClaimed(_propertyId, msg.sender, totalDividend);
    }

    // =========================
    // Document Management Functions
    // =========================

    /**
     * @notice Upload a document for a property
     * @param _propertyId ID of the property
     * @param _name Document name
     * @param _documentType Type of document
     * @param _ipfsHash IPFS hash of the document
     * @return documentId ID of the uploaded document
     */
    function uploadDocument(
        uint256 _propertyId,
        string memory _name,
        string memory _documentType,
        string memory _ipfsHash
    )
        public
        propertyExists(_propertyId)
        onlyPropertyOwner(_propertyId)
        returns (uint256)
    {
        require(bytes(_ipfsHash).length > 0, "IPFS hash required");
        require(bytes(_name).length > 0, "Document name required");

        _documentIds++;
        uint256 newDocumentId = _documentIds;

        documents[newDocumentId] = Document({
            id: newDocumentId,
            propertyId: _propertyId,
            name: _name,
            documentType: _documentType,
            ipfsHash: _ipfsHash,
            uploadDate: block.timestamp,
            uploadedBy: msg.sender,
            isVerified: false
        });

        propertyDocuments[_propertyId].push(newDocumentId);

        emit DocumentUploaded(newDocumentId, _propertyId, _name, _documentType, msg.sender);

        return newDocumentId;
    }

    /**
     * @notice Verify a document (compliance officer only)
     * @param _documentId ID of the document
     */
    function verifyDocument(uint256 _documentId)
        public
        onlyRole(COMPLIANCE_OFFICER_ROLE)
    {
        require(_documentId > 0 && _documentId <= _documentIds, "Document does not exist");

        Document storage doc = documents[_documentId];
        require(!doc.isVerified, "Document already verified");

        doc.isVerified = true;

        emit DocumentVerified(_documentId, msg.sender);
    }

    // =========================
    // KYC & Compliance Functions
    // =========================

    /**
     * @notice Set KYC verification status for a user
     * @param _user Address of the user
     * @param _verified Verification status
     */
    function setKYCVerification(address _user, bool _verified)
        public
        onlyRole(COMPLIANCE_OFFICER_ROLE)
    {
        require(_user != address(0), "Invalid address");
        kycVerified[_user] = _verified;
        emit KYCStatusUpdated(_user, _verified);
    }

    /**
     * @notice Set blacklist status for a user
     * @param _user Address of the user
     * @param _blacklisted Blacklist status
     */
    function setBlacklist(address _user, bool _blacklisted)
        public
        onlyRole(COMPLIANCE_OFFICER_ROLE)
    {
        require(_user != address(0), "Invalid address");
        blacklisted[_user] = _blacklisted;
        emit BlacklistStatusUpdated(_user, _blacklisted);
    }

    // =========================
    // Admin Functions
    // =========================

    /**
     * @notice Update platform fee
     * @param _newFeeBasisPoints New fee in basis points
     */
    function setPlatformFee(uint256 _newFeeBasisPoints)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(_newFeeBasisPoints <= 1000, "Fee cannot exceed 10%");

        uint256 oldFee = platformFeeBasisPoints;
        platformFeeBasisPoints = _newFeeBasisPoints;

        emit PlatformFeeUpdated(oldFee, _newFeeBasisPoints);
    }

    /**
     * @notice Toggle stablecoin payments
     */
    function toggleStablecoinPayments()
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        stablecoinPaymentsEnabled = !stablecoinPaymentsEnabled;
        emit StablecoinPaymentToggled(stablecoinPaymentsEnabled);
    }

    /**
     * @notice Update estimated yield for a property
     * @param _propertyId ID of the property
     * @param _newYield New yield in basis points
     */
    function updateEstimatedYield(uint256 _propertyId, uint256 _newYield)
        public
        propertyExists(_propertyId)
        onlyPropertyOwner(_propertyId)
    {
        require(_newYield <= 10000, "Yield cannot exceed 100%");

        properties[_propertyId].estimatedAnnualYield = _newYield;
        emit YieldUpdated(_propertyId, _newYield);
    }

    /**
     * @notice Pause the contract (emergency use)
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Withdraw platform fees (admin only)
     */
    function withdrawPlatformFees()
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
        nonReentrant
    {
        uint256 amount = pendingWithdrawals[address(this)];
        require(amount > 0, "No platform fees to withdraw");

        pendingWithdrawals[address(this)] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Fee withdrawal failed");

        emit WithdrawalCompleted(msg.sender, amount);
    }

    // =========================
    // View Functions
    // =========================

    /**
     * @notice Get detailed pool information for a property
     * @param _propertyId ID of the property
     * @return totalTokens Total tokens available for the property
     * @return tokensSold Number of tokens already sold
     * @return tokensAvailable Number of tokens still available
     * @return totalValueUSD Total property value in USD
     * @return currentValueUSD Current value raised in USD
     * @return percentageComplete Percentage of pool completion
     * @return isActive Whether the pool is active
     * @return investors Array of investor addresses
     */
    function getPoolInfo(uint256 _propertyId)
        public
        view
        propertyExists(_propertyId)
        returns (
            uint256 totalTokens,
            uint256 tokensSold,
            uint256 tokensAvailable,
            uint256 totalValueUSD,
            uint256 currentValueUSD,
            uint256 percentageComplete,
            bool isActive,
            address[] memory investors
        )
    {
        Property memory property = properties[_propertyId];

        totalTokens = property.totalTokens;
        tokensSold = property.tokensSold;
        tokensAvailable = property.totalTokens - property.tokensSold;
        totalValueUSD = property.totalValueUSD;
        currentValueUSD = property.tokensSold * TOKEN_PRICE_USD;
        percentageComplete = (property.tokensSold * 100) / property.totalTokens;
        isActive = property.isActive;
        investors = propertyInvestors[_propertyId];
    }

    /**
     * @notice Get investor's token balance for a property
     * @param _propertyId ID of the property
     * @param _investor Address of the investor
     * @return Number of tokens owned
     */
    function getInvestorTokens(uint256 _propertyId, address _investor)
        public
        view
        returns (uint256)
    {
        return propertyTokenBalances[_propertyId][_investor];
    }

    /**
     * @notice Get all active properties
     * @return Array of active properties
     */
    function getActiveProperties() public view returns (Property[] memory) {
        uint256 totalProperties = _propertyIds;
        uint256 activeCount = 0;

        for (uint256 i = 1; i <= totalProperties; i++) {
            if (properties[i].isActive) {
                activeCount++;
            }
        }

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
     * @notice Get all properties owned by an address
     * @param _owner Address of the owner
     * @return Array of owned properties
     */
    function getMyProperties(address _owner) public view returns (Property[] memory) {
        uint256 totalProperties = _propertyIds;
        uint256 ownedCount = 0;

        for (uint256 i = 1; i <= totalProperties; i++) {
            if (_exists(i) && ownerOf(i) == _owner) {
                ownedCount++;
            }
        }

        Property[] memory ownedProperties = new Property[](ownedCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= totalProperties; i++) {
            if (_exists(i) && ownerOf(i) == _owner) {
                ownedProperties[index] = properties[i];
                index++;
            }
        }

        return ownedProperties;
    }

    /**
     * @notice Get all properties an investor has invested in
     * @param _investor Address of the investor
     * @return investedProperties Array of properties the investor has invested in
     * @return tokenAmounts Array of token amounts owned for each property
     */
    function getMyInvestments(address _investor)
        public
        view
        returns (Property[] memory investedProperties, uint256[] memory tokenAmounts)
    {
        uint256 totalProperties = _propertyIds;
        uint256 investmentCount = 0;

        for (uint256 i = 1; i <= totalProperties; i++) {
            if (propertyTokenBalances[i][_investor] > 0) {
                investmentCount++;
            }
        }

        investedProperties = new Property[](investmentCount);
        tokenAmounts = new uint256[](investmentCount);
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
     * @notice Get a specific property
     * @param _propertyId ID of the property
     * @return Property details
     */
    function getProperty(uint256 _propertyId)
        public
        view
        propertyExists(_propertyId)
        returns (Property memory)
    {
        return properties[_propertyId];
    }

    /**
     * @notice Get total number of properties
     * @return Total properties count
     */
    function getTotalProperties() public view returns (uint256) {
        return _propertyIds;
    }

    /**
     * @notice Get all documents for a property
     * @param _propertyId ID of the property
     * @return Array of documents
     */
    function getPropertyDocuments(uint256 _propertyId)
        public
        view
        propertyExists(_propertyId)
        returns (Document[] memory)
    {
        uint256[] memory documentIds = propertyDocuments[_propertyId];
        Document[] memory propertyDocs = new Document[](documentIds.length);

        for (uint256 i = 0; i < documentIds.length; i++) {
            propertyDocs[i] = documents[documentIds[i]];
        }

        return propertyDocs;
    }

    /**
     * @notice Get all dividend distributions for a property
     * @param _propertyId ID of the property
     * @return Array of dividend distributions
     */
    function getPropertyDividends(uint256 _propertyId)
        public
        view
        propertyExists(_propertyId)
        returns (DividendDistribution[] memory)
    {
        return propertyDividends[_propertyId];
    }

    /**
     * @notice Check if an investor has claimed a specific dividend
     * @param _propertyId ID of the property
     * @param _investor Address of the investor
     * @param _distributionIndex Index of the distribution
     * @return True if claimed
     */
    function hasClaimedDividend(
        uint256 _propertyId,
        address _investor,
        uint256 _distributionIndex
    )
        public
        view
        returns (bool)
    {
        return dividendClaimed[_propertyId][_investor][_distributionIndex];
    }

    /**
     * @notice Get unclaimed dividends for an investor
     * @param _propertyId ID of the property
     * @param _investor Address of the investor
     * @return Total unclaimed dividend amount
     */
    function getUnclaimedDividends(uint256 _propertyId, address _investor)
        public
        view
        propertyExists(_propertyId)
        returns (uint256)
    {
        uint256 tokenBalance = propertyTokenBalances[_propertyId][_investor];
        if (tokenBalance == 0) return 0;

        uint256 totalUnclaimed = 0;
        uint256 distributionCount = propertyDividends[_propertyId].length;

        for (uint256 i = 0; i < distributionCount; i++) {
            if (!dividendClaimed[_propertyId][_investor][i]) {
                DividendDistribution memory distribution = propertyDividends[_propertyId][i];
                totalUnclaimed += tokenBalance * distribution.amountPerToken;
            }
        }

        return totalUnclaimed;
    }

    // =========================
    // Required Overrides
    // =========================

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Check if token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}
