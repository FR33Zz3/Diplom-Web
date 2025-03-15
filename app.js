document.getElementById("fileInput").addEventListener("change", function () {
    const fileName = this.files[0] ? this.files[0].name : "Выберите файл...";
    this.nextElementSibling.textContent = fileName;
  });
  
  async function processFile() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
  
    if (!file) {
      alert("Пожалуйста, выберите файл.");
      return;
    }
  
    const hash = await gostHash(file);
    document.getElementById("result").innerHTML = `<p>Файл: ${file.name}</p><p>Хэш: ${hash}</p>`;
  
    const signedFile = await signFile(hash);
    sendToTelegram(signedFile);
  }
  
  // 🔹 ГОСТ 34.11-2018 (имитация хэширования)
  async function gostHash(file) {
    const buffer = await file.arrayBuffer();
    let hash = 0n;
  
    for (const byte of new Uint8Array(buffer)) {
      hash = (hash * 31n + BigInt(byte)) % 0xFFFFFFFFFFFFFFFFn;
    }
  
    return hash.toString(16).padStart(16, "0");
  }
  
  // 🔹 Простая цифровая подпись (имитация)
  async function signFile(hash) {
    const privateKey = "1234567890ABCDEF"; // Должно быть безопаснее!
    let signed = "";
  
    for (let i = 0; i < hash.length; i++) {
      signed += String.fromCharCode(hash.charCodeAt(i) ^ privateKey.charCodeAt(i % privateKey.length));
    }
  
    return btoa(signed);
  }
  
  // 🔹 Отправка подписанного файла в Telegram
  async function sendToTelegram(signedData) {
    const botToken = "7091590459:AAFuMkVB-DHeazhmtXGNOsKpydKKBYNNmfg";
    const chatId = "7091590459";
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: `Подписанный файл: ${signedData}` }),
    });
  
    alert("Файл успешно подписан и отправлен в Telegram!");
  }
  
