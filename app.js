class Stribog {
  constructor(outputLength = 256) {
      this.outputLength = outputLength;
      this.h = new Uint8Array(64).fill(outputLength === 512 ? 0x01 : 0x00);
      this.N = new Uint8Array(64).fill(0);
      this.sigma = new Uint8Array(64).fill(0);
  }

  async hashFile(file) {
      const buffer = await file.arrayBuffer();
      const message = new Uint8Array(buffer);
      return this.generateHash(message);
  }

  generateHash(message) {
      let length = message.length * 8;
      let inc = 0;

      while (length >= 512) {
          let chunk = message.slice(inc * 64, (inc + 1) * 64);
          this.h = this.compress(this.N, chunk, this.h);
          this.N = this.addModulo512(this.N, 512);
          this.sigma = this.addModulo512(this.sigma, chunk);
          length -= 512;
          inc++;
      }

      let lastBlock = new Uint8Array(64).fill(0);
      let remaining = message.slice(inc * 64);
      lastBlock.set(remaining, 64 - remaining.length);
      lastBlock[64 - remaining.length - 1] = 0x01;

      this.h = this.compress(this.N, lastBlock, this.h);
      let lengthBlock = new Uint8Array(64).fill(0);
      lengthBlock.set(new Uint8Array([length & 0xff]), 63);

      this.N = this.addModulo512(this.N, lengthBlock);
      this.sigma = this.addModulo512(this.sigma, lastBlock);
      this.h = this.compress(new Uint8Array(64), this.N, this.h);
      this.h = this.compress(new Uint8Array(64), this.sigma, this.h);

      return this.h.slice(0, this.outputLength / 8);
  }

  addModulo512(a, b) {
      let result = new Uint8Array(64);
      let carry = 0;
      for (let i = 63; i >= 0; i--) {
          let sum = a[i] + (typeof b === 'number' ? b : b[i]) + carry;
          result[i] = sum & 0xff;
          carry = sum >> 8;
      }
      return result;
  }

  compress(N, m, h) {
      let K = this.xor(h, N);
      K = this.SPL(K);
      let t = this.E(K, m);
      return this.xor(this.xor(h, t), m);
  }

  xor(a, b) {
      return a.map((val, i) => val ^ b[i]);
  }

  SPL(a) {
      return this.L(this.P(this.S(a)));
  }

  S(a) {
      return a.map(val => Pi[val]);
  }

  P(a) {
      return a.map((_, i) => a[Tau[i]]);
  }

  L(a) {
      let result = new Uint8Array(64);
      for (let i = 0; i < 8; i++) {
          for (let k = 0; k < 8; k++) {
              if (a[i * 8 + k] & 0x80) {
                  for (let j = 0; j < 8; j++) {
                      result[i * 8 + j] ^= A[k * 8 + j];
                  }
              }
          }
      }
      return result;
  }

  E(K, m) {
      let state = this.xor(K, m);
      for (let i = 0; i < 12; i++) {
          state = this.SPL(state);
          K = this.keySchedule(K, i);
          state = this.xor(state, K);
      }
      return state;
  }

  keySchedule(K, i) {
      return this.SPL(this.xor(K, C[i]));
  }
}

// Функция генерации ЭЦП
async function signFile(hash, privateKey) {
  return crypto.subtle.sign(
      {
          name: "ECDSA",
          hash: { name: "SHA-256" }
      },
      privateKey,
      hash
  );
}

// Функция проверки ЭЦП
async function verifySignature(hash, signature, publicKey) {
  return crypto.subtle.verify(
      {
          name: "ECDSA",
          hash: { name: "SHA-256" }
      },
      publicKey,
      signature,
      hash
  );
}

// Подключаем обработку загрузки файлов
document.getElementById('fileInput').addEventListener('change', async function(event) {
  let file = event.target.files[0];
  if (!file) return;
  let stribog = new Stribog(256);
  let hash = await stribog.hashFile(file);
  let privateKey = await crypto.subtle.generateKey(
      {
          name: "ECDSA",
          namedCurve: "P-256"
      },
      true,
      ["sign", "verify"]
  );
  let signature = await signFile(hash, privateKey.privateKey);
  let isValid = await verifySignature(hash, signature, privateKey.publicKey);
  document.getElementById('hashOutput').innerText = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
  document.getElementById('signatureOutput').innerText = isValid ? "Подпись верна" : "Ошибка подписи";
});
