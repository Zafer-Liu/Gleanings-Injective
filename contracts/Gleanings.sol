// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title Gleanings 拾遗
 * @notice 《拾遗 · Gleanings》游戏的链上藏品合约（Injective EVM）。
 *         - 信物 Relic：玩家通关某一幕后凭后端签发的 EIP-712 voucher 铸造。
 *         - 徽章 Badge：集齐某章全部信物后，凭真实持有的信物无需签名、可信地铸造。
 *         每个 token 唯一（ERC-721），metadata 记录章节、幕、稀有度、玩家选择路径与 AIGC 图。
 * @dev    基于 OpenZeppelin Contracts v5。
 */
contract Gleanings is
    ERC721Enumerable,
    ERC721URIStorage,
    ERC2981,
    Ownable,
    EIP712
{
    using ECDSA for bytes32;

    // ---------------------------------------------------------------------
    // 类型
    // ---------------------------------------------------------------------

    enum Kind {
        Relic, // 信物
        Badge // 徽章
    }

    struct Piece {
        uint256 seriesId; // 章节：1 = 福建老酒
        uint256 pieceId; // 章节内的幕/信物编号；徽章固定为 0
        Kind kind;
        uint8 rarity; // 0 普通 … 4 传世
        bytes32 pathHash; // 玩家选择路径哈希（个性化/防篡改）
    }

    /// @dev 后端签发信物 voucher 时使用的结构（EIP-712）。
    struct RelicVoucher {
        address player;
        uint256 seriesId;
        uint256 pieceId;
        uint8 rarity;
        bytes32 pathHash;
        string uri;
        uint256 nonce;
    }

    // ---------------------------------------------------------------------
    // 存储
    // ---------------------------------------------------------------------

    /// @notice tokenId => 藏品属性
    mapping(uint256 => Piece) public pieces;

    /// @notice 章节定义：seriesId => 是否存在
    mapping(uint256 => bool) public seriesExists;
    /// @notice 章节名：seriesId => name
    mapping(uint256 => string) public seriesName;
    /// @notice 集齐徽章所需信物数量：seriesId => count
    mapping(uint256 => uint256) public seriesRelicCount;
    /// @notice 某 pieceId 是否为该章徽章的必需信物：seriesId => pieceId => bool
    mapping(uint256 => mapping(uint256 => bool)) public isRequiredRelic;

    /// @notice 玩家是否已铸造某幕信物：player => seriesId => pieceId => bool
    mapping(address => mapping(uint256 => mapping(uint256 => bool))) public hasRelic;
    /// @notice 玩家是否已领取某章徽章：player => seriesId => bool
    mapping(address => mapping(uint256 => bool)) public hasBadge;

    /// @notice 后端 voucher 签名者地址
    address public voucherSigner;

    /// @notice 已使用的 voucher（防重放）：digest => used
    mapping(bytes32 => bool) public usedVouchers;

    uint256 private _nextId = 1;

    bytes32 private constant RELIC_TYPEHASH =
        keccak256(
            "RelicVoucher(address player,uint256 seriesId,uint256 pieceId,uint8 rarity,bytes32 pathHash,string uri,uint256 nonce)"
        );

    // ---------------------------------------------------------------------
    // 事件
    // ---------------------------------------------------------------------

    event SeriesDefined(uint256 indexed seriesId, string name, uint256 relicCount);
    event RelicMinted(
        address indexed player,
        uint256 indexed seriesId,
        uint256 indexed pieceId,
        uint256 tokenId,
        uint8 rarity
    );
    event BadgeClaimed(address indexed player, uint256 indexed seriesId, uint256 tokenId);
    event VoucherSignerUpdated(address indexed signer);

    // ---------------------------------------------------------------------
    // 构造
    // ---------------------------------------------------------------------

    /**
     * @param signer          后端 voucher 签名者地址
     * @param royaltyReceiver 二级交易版税收款地址（接商业模式的品牌方/团队分成）
     * @param royaltyBps      版税基点（如 500 = 5%）
     */
    constructor(
        address signer,
        address royaltyReceiver,
        uint96 royaltyBps
    ) ERC721("Gleanings", "GLEAN") EIP712("Gleanings", "1") Ownable(msg.sender) {
        require(signer != address(0), "signer=0");
        voucherSigner = signer;
        _setDefaultRoyalty(royaltyReceiver, royaltyBps);
    }

    // ---------------------------------------------------------------------
    // 管理
    // ---------------------------------------------------------------------

    function setVoucherSigner(address signer) external onlyOwner {
        require(signer != address(0), "signer=0");
        voucherSigner = signer;
        emit VoucherSignerUpdated(signer);
    }

    function setDefaultRoyalty(address receiver, uint96 bps) external onlyOwner {
        _setDefaultRoyalty(receiver, bps);
    }

    /**
     * @notice 定义一个章节及其集齐徽章所需的信物 pieceId 列表。
     * @dev    每个章节建议只调用一次。
     */
    function defineSeries(
        uint256 seriesId,
        string calldata name,
        uint256[] calldata requiredPieceIds
    ) external onlyOwner {
        require(!seriesExists[seriesId], "series exists");
        require(requiredPieceIds.length > 0, "no relics");

        seriesExists[seriesId] = true;
        seriesName[seriesId] = name;
        seriesRelicCount[seriesId] = requiredPieceIds.length;
        for (uint256 i = 0; i < requiredPieceIds.length; i++) {
            isRequiredRelic[seriesId][requiredPieceIds[i]] = true;
        }
        emit SeriesDefined(seriesId, name, requiredPieceIds.length);
    }

    // ---------------------------------------------------------------------
    // 信物铸造（EIP-712 voucher，后端授权）
    // ---------------------------------------------------------------------

    /**
     * @notice 玩家凭后端签发的 voucher 铸造一枚信物。
     * @param v   信物 voucher
     * @param sig 后端对 voucher 的 EIP-712 签名
     */
    function mintRelic(RelicVoucher calldata v, bytes calldata sig)
        external
        returns (uint256 tokenId)
    {
        require(v.player == msg.sender, "not your voucher");
        require(seriesExists[v.seriesId], "series undefined");
        require(!hasRelic[msg.sender][v.seriesId][v.pieceId], "relic already minted");

        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    RELIC_TYPEHASH,
                    v.player,
                    v.seriesId,
                    v.pieceId,
                    v.rarity,
                    v.pathHash,
                    keccak256(bytes(v.uri)),
                    v.nonce
                )
            )
        );
        require(!usedVouchers[digest], "voucher used");
        require(digest.recover(sig) == voucherSigner, "bad signature");
        usedVouchers[digest] = true;

        tokenId = _nextId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, v.uri);
        pieces[tokenId] = Piece({
            seriesId: v.seriesId,
            pieceId: v.pieceId,
            kind: Kind.Relic,
            rarity: v.rarity,
            pathHash: v.pathHash
        });
        hasRelic[msg.sender][v.seriesId][v.pieceId] = true;

        emit RelicMinted(msg.sender, v.seriesId, v.pieceId, tokenId, v.rarity);
    }

    // ---------------------------------------------------------------------
    // 徽章领取（可信：链上校验真实持有全部必需信物，无需签名）
    // ---------------------------------------------------------------------

    /**
     * @notice 集齐某章全部必需信物后铸造徽章。合约校验调用者确实持有这些信物。
     * @param seriesId      章节
     * @param relicTokenIds 调用者持有的、覆盖该章全部必需 pieceId 的信物 tokenId 列表
     * @param badgeUri      徽章 metadata URI
     */
    function claimBadge(
        uint256 seriesId,
        uint256[] calldata relicTokenIds,
        string calldata badgeUri
    ) external returns (uint256 tokenId) {
        require(seriesExists[seriesId], "series undefined");
        require(!hasBadge[msg.sender][seriesId], "badge claimed");
        require(relicTokenIds.length == seriesRelicCount[seriesId], "wrong relic count");

        for (uint256 i = 0; i < relicTokenIds.length; i++) {
            uint256 tid = relicTokenIds[i];
            require(ownerOf(tid) == msg.sender, "not owner");
            Piece memory p = pieces[tid];
            require(p.kind == Kind.Relic && p.seriesId == seriesId, "wrong relic");
            require(isRequiredRelic[seriesId][p.pieceId], "not required piece");
            // 去重：确保覆盖的是不同的必需 pieceId
            for (uint256 j = 0; j < i; j++) {
                require(pieces[relicTokenIds[j]].pieceId != p.pieceId, "duplicate piece");
            }
        }

        hasBadge[msg.sender][seriesId] = true;
        tokenId = _nextId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, badgeUri);
        pieces[tokenId] = Piece({
            seriesId: seriesId,
            pieceId: 0,
            kind: Kind.Badge,
            rarity: 4,
            pathHash: bytes32(0)
        });

        emit BadgeClaimed(msg.sender, seriesId, tokenId);
    }

    // ---------------------------------------------------------------------
    // 视图辅助
    // ---------------------------------------------------------------------

    /// @notice 返回某地址持有的全部 tokenId（图鉴/收藏馆读取用）。
    function collectionOf(address owner) external view returns (uint256[] memory ids) {
        uint256 n = balanceOf(owner);
        ids = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            ids[i] = tokenOfOwnerByIndex(owner, i);
        }
    }

    /// @notice EIP-712 domain separator（前端/后端签名用）。
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    // ---------------------------------------------------------------------
    // 多继承必需的重写
    // ---------------------------------------------------------------------

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
