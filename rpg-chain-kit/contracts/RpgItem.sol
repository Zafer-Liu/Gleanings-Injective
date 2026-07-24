// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
contract RpgItem is ERC721Enumerable, ERC721URIStorage {
    uint256 private _nextTokenId = 1;
    mapping(uint256 => bytes32) public provenanceHashes;
    event ItemMinted(uint256 indexed tokenId, address indexed owner, bytes32 indexed provenanceHash);
    constructor(string memory collectionName, string memory collectionSymbol) ERC721(collectionName, collectionSymbol) {}
    function mintToSelf(string calldata tokenUri, bytes32 provenanceHash) external returns (uint256 tokenId) { tokenId = _nextTokenId++; _safeMint(msg.sender, tokenId); _setTokenURI(tokenId, tokenUri); provenanceHashes[tokenId] = provenanceHash; emit ItemMinted(tokenId, msg.sender, provenanceHash); }
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) { return super.tokenURI(tokenId); }
    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable, ERC721URIStorage) returns (bool) { return super.supportsInterface(interfaceId); }
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721, ERC721Enumerable) returns (address) { return super._update(to, tokenId, auth); }
    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) { super._increaseBalance(account, value); }
}
