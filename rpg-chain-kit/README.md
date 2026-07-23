# RPG Chain Kit

可复用的自托管 RPG 道具链上模块。它将游戏道具铸造成 ERC-721 NFT，并提供 MetaMask 签名、资产查询、转让和交易历史接口。

## 包含内容

- `contracts/RpgItem.sol`：通用 ERC-721 道具合约，玩家自己铸造和转让。
- `src/rpg-item-router.js`：Express 路由，创建待签名请求、读取背包和链上历史。
- `public/`：MetaMask 钱包连接、签名和部署页面。
- `examples/godot/RpgChainClient.gd`：Godot 调用接口示例。

## 安全模型

玩家私钥只在 MetaMask 中使用；本服务不会接收或保存私钥。道具元数据编码为 `tokenURI` data URI，`provenanceHash` 用于证明游戏事件或 AI 生成输入未被替换。

## 安装与部署

```powershell
cd rpg-chain-kit
npm install
npm run compile
Copy-Item .env.example .env
npm start
```

打开 `http://127.0.0.1:3100/deploy.html`，使用 MetaMask 部署合约。把页面返回的地址写入 `.env`：

```dotenv
RPG_ITEM_CONTRACT_ADDRESS=0x你的合约地址
```

重启服务。Injective EVM Testnet 的默认 Chain ID 为 `1439`；如需其他 EVM 网络，只需修改 `.env` 的 RPC、Chain ID、货币和浏览器地址。

## Railway 部署（手机公开分享）

本目录已包含 [`railway.toml`](railway.toml)，可直接作为 Railway Service 的根目录部署。Railway 会使用 `npm start` 并通过 `/health` 确认服务就绪。

1. 将本仓库推送到 GitHub，在 Railway 选择 **Deploy from GitHub Repo**；若仓库包含多个项目，请把服务的 **Root Directory** 设为 `rpg-chain-kit`。
2. 在 Railway 的 **Variables** 中粘贴 [`railway.env.example`](railway.env.example) 的变量，并将 `PUBLIC_SHARE_ORIGIN` 改为 Railway 自动生成的 HTTPS 域名。
3. 在 **Settings → Networking** 点击 **Generate Domain**，得到 `https://<service>.up.railway.app`。
4. 把游戏构建变量 `VITE_CHAIN_BRIDGE_URL` 指向该 HTTPS 域名，并把游戏域名填入 `CORS_ORIGINS`。

部署后，分享链接格式为：

```text
https://<service>.up.railway.app/share/?wallet=0x玩家钱包地址
```

该页面只读取公开 NFT 数据，不请求私钥；任意手机网络均可打开。

## 游戏接入流程

1. 游戏打开 `http://127.0.0.1:3100/connect.html`，轮询 `GET /api/rpg/wallet` 获得 EVM 地址。
2. 铸造时请求 `POST /api/rpg/requests`：

```json
{
  "kind": "mint",
  "wallet": "0x玩家地址",
  "item": {
    "name": "Tide Crown",
    "item_type": "Helmet",
    "rarity": "Legendary",
    "stats": {"defense": 42},
    "description": "A relic from the abyss.",
    "source": "Deep Sea Dungeon"
  }
}
```

3. 打开返回的 `wallet_url`；玩家在 MetaMask 确认交易。
4. 游戏轮询 `GET /api/rpg/requests/:id`，状态为 `confirmed` 后调用 `GET /api/rpg/assets/:wallet` 刷新背包。
5. 转让时提交 `{ "kind":"transfer", "wallet":"0x持有人", "token_id":"1", "to_wallet":"0x接收方" }`，并打开返回签名页。

## 接口

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/api/rpg/config` | 检查合约与网络配置 |
| POST/GET | `/api/rpg/wallet` | 写入/读取本地钱包会话 |
| POST | `/api/rpg/requests` | 创建铸造或转让请求 |
| GET | `/api/rpg/requests/:id` | 查询签名结果 |
| GET | `/api/rpg/assets/:wallet` | 查询玩家 NFT 道具 |
| GET | `/api/rpg/history/:tokenId` | 查询转让历史 |

## 适配建议

- 正式项目建议把大图片、长剧情和视频放 IPFS/Arweave；NFT 只保存 URI、哈希与关键属性。
- 生产环境应把内存中的 `pending` 请求改为带过期时间的数据库或 Redis。
- 为防止任意客户端铸造，游戏服务可以在创建请求前验证任务完成、掉落概率与玩家资格。
