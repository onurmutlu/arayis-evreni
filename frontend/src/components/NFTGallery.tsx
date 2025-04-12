
import React from 'react';

const sampleNFTs = [
  { id: 1, name: "Cyber Agent", media: "/assets/nft1.gif" },
  { id: 2, name: "Hooded Leader", media: "/assets/nft2.gif" }
];

export default function NFTGallery() {
  return (
    <div>
      <h2>🎨 NFT Galeri</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {sampleNFTs.map(nft => (
          <div key={nft.id} style={{ border: "1px solid #ccc", padding: 10, borderRadius: 8 }}>
            <img src={nft.media} alt={nft.name} style={{ width: 120, borderRadius: 8 }} />
            <p style={{ textAlign: "center" }}>{nft.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
