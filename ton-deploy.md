# TON Blockchain Jetton Deployment Notları

## Genel Bilgiler

TON (The Open Network) blockchain üzerinde Jetton (token) oluşturmak için aşağıdaki temel bileşenler gereklidir:

- **TON Cüzdanı**: Deploy işlemi için minimum 1 TON bakiyesi bulunan bir cüzdan
- **Jetton Minter Kontratı**: Tokenların oluşturulması ve yönetilmesi için akıllı kontrat
- **Jetton Wallet Kontratı**: Her kullanıcı için otomatik oluşturulan token cüzdanı kontratı
- **Metadata**: Token bilgilerini içeren JSON formatında veri

## Jetton Standartı

TON üzerindeki Jetton'lar TEP-74 ve TEP-64 standartlarını takip eder. Bu standartlar token'ların nasıl oluşturulacağını, transfer edileceğini ve metadata'larının nasıl saklanacağını belirler.

## Metadata Formatı

Jetton metadata'sı aşağıdaki alanları içerir:

```json
{
  "name": "AJAN X",
  "symbol": "AJX",
  "description": "AJAN X created by Arayış Evreni",
  "decimals": "9",
  "image": "ipfs://QmYourIpfsHash"
}
```

## IPFS Entegrasyonu

Token logosu için:
1. Logo görselini IPFS'e yükleyin (Pinata, Infura gibi servisler kullanılabilir)
2. Alınan IPFS hash'ini `ipfs://QmHash` formatında metadata'da kullanın
3. Görsel ideal olarak 256x256 piksel, PNG formatında olmalıdır

## Deployment Öncesi Kontrol Listesi

1. ✅ TON cüzdanı oluşturuldu ve yeterli bakiye (min. 1 TON) yüklendi
2. ✅ Jetton metadata hazırlandı ve doğrulandı
3. ✅ Logo IPFS'e yüklendi ve hash alındı
4. ✅ Doğru ağ seçildi (Mainnet veya Testnet)
5. ✅ Deploy scriptinde tüm parametreler doğru ayarlandı

## Deployment Sonrası İşlemler

1. Jetton Minter adresini not edin
2. Explorerde işlem hash'ini kontrol edin
3. Token'ları kullanıcılara dağıtmak için transfer işlemleri yapın
4. TONscan, TONwhales gibi explorerlerde token'ınızı doğrulayın

## TON Connect Entegrasyonu

Kullanıcıların web uygulamanızdan token'larınıza erişebilmesi için:

1. TON Connect 2.0 entegrasyonu yapın
2. Cüzdan bağlantı desteği ekleyin
3. Jetton operasyonları için UI hazırlayın

## Yaygın Sorunlar ve Çözümleri

1. **Deploy Başarısız Oldu**: Cüzdan bakiyesini ve doğru ağda olduğunuzu kontrol edin
2. **Metadata Görünmüyor**: IPFS linklerinin doğru formatta olduğunu doğrulayın
3. **Gaz Yetersiz**: İşlemler için daha fazla TON ayırın (genellikle 1 TON yeterlidir)
4. **Kontrat Kodunda Hata**: Güncel ve doğrulanmış Jetton kontrat kodunu kullanın

## Güvenlik Notları

1. Deploy cüzdanının mnemonik kelimelerini güvenli bir yerde saklayın
2. Admin işlemleri için kullanılan cüzdanı başka işlemler için kullanmayın
3. Büyük miktarda token transferleri öncesinde test yapın
4. Kontrat kodunda özelleştirme yapmadan önce audit yaptırın

## Faydalı Kaynaklar

- [TON Documentation](https://docs.ton.org/)
- [TEP-74 Standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jetton-standard.md)
- [Jetton Contracts Repository](https://github.com/ton-blockchain/token-contract)
- [TON Minter Example](https://github.com/ton-blockchain/minter-contract)
- [TON Connect Documentation](https://docs.tonconnect.org/)

## Komut Satırı Araçları

```bash
# TON CLI ile Jetton bilgilerini sorgulama
tonos-cli run <jetton_master_address> get_jetton_data

# Jetton bakiyesi sorgulama
tonos-cli run <jetton_wallet_address> get_wallet_data
```

## İleri Seviye Konular

- **Jetton Vesting**: Belirli bir süre boyunca kademeli olarak serbest bırakılan token mekanizması
- **Burning Mekanizması**: Token'ların dolaşımdan kaldırılması için burn fonksiyonu
- **Yükseltilibilir Kontratlar**: Gelecekte güncelleme yapılabilecek kontrat yapısı
- **Royalty Sistemi**: Her transferde belirli bir yüzdeyi otomatik olarak bir adrese gönderme
- **Multisig Yönetimi**: Token yönetiminin birden fazla imza gerektirmesi

Bu notlar, TON üzerinde Jetton oluşturma ve yönetme sürecinde size rehberlik edecektir. Herhangi bir değişiklik veya güncelleme gerektiğinde bu dokümanı güncelleyebilirsiniz. 