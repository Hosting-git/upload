// server.js
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Serve static file kalo lo punya aset tambahan di folder 'public'
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Upload HTML Ciamik</title>
  <!-- Bootstrap CSS -->
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
  <!-- FontAwesome untuk icon -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
  <style>
    body {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #fff;
      min-height: 100vh;
      padding-bottom: 50px;
    }
    .container {
      margin-top: 50px;
    }
    .upload-box {
      background: rgba(0, 0, 0, 0.55);
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }
    .btn-upload {
      background: #ff4081;
      border: none;
    }
    .file-list li {
      padding: 10px 15px;
      margin-bottom: 10px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .file-name {
      font-weight: bold;
    }
    .file-actions a {
      color: #fff;
      margin-left: 10px;
      font-size: 1.2em;
      transition: color 0.3s ease;
    }
    .file-actions a:hover {
      color: #ff4081;
    }
    hr {
      border-color: rgba(255, 255, 255, 0.2);
    }
  </style>
</head>
<body>
  <!-- Musik latar (ganti URL musik sesuai selera) -->
  <audio id="bg-music" src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" loop autoplay></audio>

  <div class="container">
    <div class="upload-box">
      <h1 class="text-center mb-4">Upload File HTML Lo</h1>
      <form id="uploadForm">
        <div class="form-group">
          <input type="file" class="form-control-file" id="fileInput" accept=".html" required>
        </div>
        <button type="submit" class="btn btn-upload btn-block">Upload Sekarang</button>
      </form>
      <hr>
      <h2 class="text-center">Daftar File</h2>
      <ul class="list-unstyled file-list" id="fileList"></ul>
    </div>
  </div>

  <script>
    // Konfigurasi GitHub
    const owner = 'Hosting-git';              // Nama owner sesuai repo lo
    const repo = 'upload';                    // Nama repo
    const branch = 'main';                    // Pastikan branch sesuai
    const directory = '';                     // Kosongkan jika file di root atau isi folder, misal 'uploads'
    const token = 'YOUR_PERSONAL_ACCESS_TOKEN'; // Ganti dengan Personal Access Token lo

    // Fungsi untuk fetch list file dari repo GitHub lo
    async function fetchFileList() {
      const url = \`https://api.github.com/repos/\${owner}/\${repo}/contents/\${directory}?ref=\${branch}\`;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Gagal fetch file list');
        const data = await response.json();
        const fileListElem = document.getElementById('fileList');
        fileListElem.innerHTML = data
          .filter(item => item.type === 'file' && item.name.endsWith('.html'))
          .map(file => {
            // URL untuk akses file via GitHub Pages, raw file, dan download file
            const runUrl = \`https://\${owner}.github.io/\${repo}/\${directory ? directory + '/' : ''}\${file.name}\`;
            const rawUrl = \`https://raw.githubusercontent.com/\${owner}/\${repo}/\${branch}/\${directory ? directory + '/' : ''}\${file.name}\`;
            return \`
              <li>
                <span class="file-name">\${file.name}</span>
                <span class="file-actions">
                  <a href="\${rawUrl}" title="Raw" target="_blank"><i class="fas fa-code"></i></a>
                  <a href="\${rawUrl}" title="Download" download><i class="fas fa-download"></i></a>
                  <a href="\${runUrl}" title="Run" target="_blank"><i class="fas fa-play-circle"></i></a>
                </span>
              </li>
            \`;
          }).join('');
      } catch (error) {
        console.error(error);
      }
    }

    // Panggil fetchFileList saat load halaman
    fetchFileList();

    document.getElementById('uploadForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById('fileInput');
      const file = fileInput.files[0];
      // Validasi ekstensi file, karena MIME type bisa tidak konsisten
      if (!file || !file.name.endsWith('.html')) {
        alert('Pilih file HTML!');
        return;
      }

      const reader = new FileReader();
      reader.onload = async function() {
        const content = reader.result;
        // Encode file ke base64
        const base64Content = btoa(unescape(encodeURIComponent(content)));
        const filePath = directory ? \`\${directory}/\${file.name}\` : file.name;
        const apiUrl = \`https://api.github.com/repos/\${owner}/\${repo}/contents/\${filePath}\`;

        // Payload commit file
        const payload = {
          message: 'Upload file ' + file.name,
          content: base64Content,
          branch: branch
        };

        // Cek apakah file sudah ada (kalau ada, ambil sha untuk update)
        try {
          const getResponse = await fetch(apiUrl, {
            headers: { 'Authorization': 'token ' + token }
          });
          if (getResponse.ok) {
            const fileData = await getResponse.json();
            payload.sha = fileData.sha;
          }
        } catch (err) {
          console.error('File belum ada, akan dibuat baru');
        }

        try {
          const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
              'Authorization': 'token ' + token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Gagal upload file');
          }

          alert('Upload berhasil!');
          fileInput.value = '';
          fetchFileList();
        } catch (error) {
          console.error(error);
          alert('Error: ' + error.message);
        }
      };
      reader.readAsText(file);
    });
  </script>

  <!-- jQuery & Bootstrap JS -->
  <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
  <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
</body>
</html>`);
});

app.listen(port, () => {
  console.log(\`Server running on http://localhost:\${port}\`);
  console.log("Kalo lo mau expose lewat ngrok, jalankan: ngrok http " + port);
});
