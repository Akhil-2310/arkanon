# 🎭 ArkAnon

> **Anonymous social platform powered by zero-knowledge proofs.**  
> Create groups, post anonymously, vote privately — all verified on-chain.

---

## 🌐 TL;DR

ArkAnon is a **privacy-first social platform** where verified group members can:
- 📝 **Post anonymously** — Share thoughts without revealing identity
- 🗳️ **Vote privately** — Participate in governance anonymously  
- 👥 **Form communities** — Create interest-based groups on-chain

It uses **Semaphore** for anonymous proofs, **Scroll Sepolia** for verification, **Arkiv** for data storage, and **Scaffold-ETH 2** for seamless development.

> 💡 Think "anonymous Reddit meets ZK proofs" — trustworthy, private, and on-chain.

---

## 🎯 Problem

Online spaces force a binary choice:
- **Anonymous = untrustworthy spam**  
- **Verified = doxxed and tracked**

Communities, DAOs, and whistleblowers need a way to **prove they belong** without revealing **who they are**.

Traditional platforms rely on centralized trust — admins, servers, moderators — introducing bias, censorship, and risk.

---

## 💡 Solution — *ArkAnon*

ArkAnon enables **verifiable anonymity** through zero-knowledge proofs.  
Anyone can post, vote, or signal — verified by cryptography, not by trust.

- 🧠 **Zero-Knowledge Proofs** — Prove group membership without revealing identity  
- 🔗 **On-Chain Verification** — Proofs verified by smart contracts on Scroll Sepolia  
- 🔒 **Anonymous but Accountable** — Unique nullifiers prevent double-signaling  
- 📊 **Arkiv Integration** — On-chain data storage for metadata

---

## 🧩 How It Works

1. **Connect Wallet**
   - User generates a **Semaphore identity** (derived from wallet, stored locally)

2. **Create or Join a Group**
   - Groups = communities, DAOs, or interest-based collectives
   - Metadata stored on-chain with Arkiv for permanence

3. **Post Anonymously**
   - User creates a **ZK proof** showing:
     - ✅ Membership in group  
     - 🆔 Unique nullifier (prevents double-posting in same scope)
   - Proof sent to smart contract for verification

4. **Vote Privately**
   - Create proposals with multiple options
   - Members vote anonymously with ZK proofs
   - Results are public, but voters remain private

---

## 🏗️ Architecture

| Layer | Technology |
|-------|-------------|
| ZK Layer | Semaphore Protocol |
| Smart Contracts | Solidity + Hardhat |
| Blockchain | Scroll Sepolia |
| Data Storage | Arkiv (on-chain) + Supabase (off-chain) |
| Frontend | Next.js + Scaffold-ETH 2 |

---

## ⚙️ Tech Stack

| Category | Tools / Frameworks |
|-----------|--------------------|
| 🧱 Smart Contracts | Solidity, Hardhat, Scaffold-ETH 2 |
| 🔐 Zero-Knowledge | Semaphore V4, SnarkJS |
| 🌐 Blockchain | Scroll Sepolia |
| 💾 Storage | Arkiv (on-chain), Supabase (posts/proposals) |
| 💻 Frontend | Next.js, TailwindCSS, RainbowKit, Viem |
| 🧰 Tooling | Scaffold-ETH 2, Wagmi, Arkiv SDK |

---

## 🧠 Use Cases

| Use Case | Description |
|----------|-------------|
| 🕵️ **Whistleblowing** | Prove affiliation, stay anonymous |
| 🗳️ **DAO Governance** | Vote without revealing wallet |
| 💬 **Anonymous Feedback** | Share opinions without fear |
| 👥 **Private Communities** | Interest-based groups with privacy |
| 📊 **Censorship Resistance** | Can't be silenced by centralized platforms |

---

## 🔭 Future Roadmap

- 🧩 **Token-Gated Groups** — NFT/token-based membership
- 💬 **Real-Time Chat** — Anonymous group messaging
- 🪙 **Reputation System** — Build trust without identity
- 🌐 **Cross-Chain Support** — Deploy on multiple networks
- 📱 **Mobile App** — Native iOS/Android experience

---

## 🛡️ Why Scroll Sepolia & Arkiv?

**Scroll Sepolia:**
- ⚡ zkEVM for efficient zero-knowledge operations
- 🔐 Low gas costs for ZK verification
- 🌐 EVM-compatible (easy to deploy)

**Arkiv:**
- 📊 On-chain data permanence
- 🔍 Queryable on-chain storage
- 💾 No reliance on centralized APIs

---

## 📜 Deployed Contracts (Scroll Sepolia)

**Contract Address:** `0x071A6085Cbb762eFa8A88eefbdC3171d7E57baae`

[View on Scrollscan](https://sepolia.scrollscan.com/address/0x071A6085Cbb762eFa8A88eefbdC3171d7E57baae)

**Pre-deployed Semaphore Contracts:**
- SemaphoreVerifier: `0x4DeC9E3784EcC1eE002001BfE91deEf4A48931f8`
- PoseidonT3: `0xB43122Ecb241DD50062641f089876679fd06599a`
- Semaphore: `0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D`

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Yarn
- MetaMask or compatible wallet

### Setup

```bash
# Clone the repository
git clone https://github.com/Akhil-2310/arkanon
cd arkanon

# Install dependencies
yarn install

# Set up environment variables
cp packages/nextjs/.env.example packages/nextjs/.env.local
# Add your Supabase and Arkiv credentials

# Start local development
cd packages/nextjs
yarn start
```

Visit `http://localhost:3000` and connect your wallet!

---

## 👥 Team

**Built by:**
- 🧑‍💻 **Akhil Nanavati** — Full Stack + ZK Dev  

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- **Semaphore Protocol** — For anonymous identity infrastructure
- **Scaffold-ETH 2** — For rapid dApp development
- **Scroll** — For zkEVM infrastructure
- **Arkiv** — For on-chain data storage
- **Supabase** — For scalable off-chain storage

---

**Privacy is not a feature. It's a right.** 🎭

