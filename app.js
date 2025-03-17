document.addEventListener('DOMContentLoaded', function () {
  const fileInput = document.getElementById('file-input');
  const selectFileButton = document.getElementById('select-file-button');
  const signingProgressContainer = document.getElementById('signing-progress-container');
  const signingProgressbar = document.getElementById('signing-progressbar');
  const signingStatusText = document.getElementById('signing-status-text');
  const cancelSigningButton = document.getElementById('cancel-signing-button');
  const sendFileContainer = document.getElementById('send-file-container');
  const recipientInput = document.getElementById('recipient-input');
  const sendFileButton = document.getElementById('send-file-button');
  const completionContainer = document.getElementById('completion-container');
  const returnToStartButton = document.getElementById('return-to-start-button');
  const closeAppButton = document.getElementById('close-app-button');

  let selectedFile;
  let signedFileBlob;

  // Функция для переключения между шагами
  function showStep(stepName) {
      const steps = document.querySelectorAll('.step');
      steps.forEach(step => step.classList.remove('active'));
      document.getElementById(stepName).classList.add('active');
  }

  // Функция для отображения процесса подписания
  function updateSigningProgress(progress) {
      signingProgressbar.value = progress;
      signingStatusText.textContent = `Подписание файла: ${progress}%`;
  }

  // Обработчик выбора файла
  selectFileButton.addEventListener('click', function () {
      fileInput.click();
  });

  // Обработчик изменения выбранного файла
  fileInput.addEventListener('change', async function (event) {
      selectedFile = event.target.files[0];
      console.log(`Выбран файл: ${selectedFile.name}`);
      showStep('signing-progress-container');
      try {
          await signFile(selectedFile);
          showStep('send-file-container');
      } catch (error) {
          alert('Ошибка при подписании файла.');
          showStep('file-select-container');
      }
  });

  // Функция для подписи файла на сервере
  async function signFile(file) {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/sign_file', {
          method: 'POST',
          body: formData,
      });

      if (!response.ok) {
          throw new Error('Ошибка при подписании файла.');
      }

      const { signedFile } = await response.json();
      signedFileBlob = new Blob([signedFile], { type: 'application/octet-stream' });
  }

  // Обработчик отправки подписанного файла
  sendFileButton.addEventListener('click', async function () {
      const recipient = recipientInput.value.trim();
      if (!recipient) {
          alert('Укажите получателя!');
          return;
      }

      const telegramApiResponse = await fetch('/api/send_signed_file', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              recipient,
              signedFile: signedFileBlob,
          }),
      });

      if (!telegramApiResponse.ok) {
          alert('Ошибка при отправке подписанного файла.');
          return;
      }

      showStep('completion-container');
  });

  // Обработчики кнопок возврата и закрытия
  returnToStartButton.addEventListener('click', function () {
      showStep('file-select-container');
  });

  closeAppButton.addEventListener('click', function () {
      window.close();
  });
});
