const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser'); // Dodaj tę linię
// Tworzenie instancji aplikacji Express.js
const app = express();

// Ustawienie ścieżki do folderu, w którym będą przechowywane przesłane pliki
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Zapisujemy oryginalną nazwę pliku
    const fileName = `${Date.now()}_${file.originalname}`;
    cb(null, fileName);
  },
});




app.get('/', function(req, res){
  res.sendFile(path.join(__dirname+'/static/index.html'));
});

// Inicjalizacja modułu multer z użyciem zdefiniowanych opcji
const upload = multer({ storage });

// Dodaj middleware do parsowania ciała żądania
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const accessCode = 'Johnatan';

// Zmienna, która będzie przechowywać informację, czy użytkownik jest uwierzytelniony
let isAuthenticated = false;

// Obsługa routingu dla strony głównej
app.get('/l', (req, res) => {
  // Jeśli użytkownik jest uwierzytelniony, wyświetl standardowy widok
  if (isAuthenticated) {
    const files = fs.readdirSync('uploads/');
    const filesList = files.map((file) => ({
      filename: file,
      originalname: file.split('_').slice(1).join('_'), // Wyodrębniamy oryginalną nazwę pliku
      downloadLink: `/download/${file}`,
      deleteLink: `/delete/${file}`, // Dodajemy link do usuwania pliku
    }));

    res.send(`
      <h2>Przesłane pliki:</h2>
      <ul>
        ${filesList
          .map(
            (file) => `<li>${file.originalname}
                        <a href="${file.downloadLink}"><button>Download</button></a>
                        <form action="${file.deleteLink}" method="post">
                          <input type="hidden" name="_method" value="DELETE">
                          <button type="submit">Usuń</button>
                        </form>
                      </li>`
          )
          .join('')}
      </ul>
      <form action="/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="file"/>
        <input type="submit" value="Upload"/>
      </form>
    `);
    isAuthenticated = false;
  } else {
    // Jeśli użytkownik nie jest uwierzytelniony, przekieruj na stronę logowania
    res.redirect('/login');
  }
});

// Obsługa strony logowania
app.get('/login', (req, res) => {
  res.send(`
    <h2>Wprowadź kod dostępu:</h2>
    <form action="/authenticate" method="post">
      <input type="password" name="accessCode" />
      <input type="submit" value="Zaloguj"/>
    </form>
  `);
});

// Obsługa uploadu pliku
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).send('Nie wybrano pliku!');
  } else {
    res.redirect('/l');
  }
});

// Obsługa pobierania pliku
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  res.download(filePath, (err) => {
    if (err) {
      res.status(404).send('Nie znaleziono pliku!');
    }
  });
});

// Obsługa uwierzytelniania
app.post('/authenticate', (req, res) => {
  const enteredCode = req.body.accessCode;
  if (enteredCode === accessCode) {
    isAuthenticated = true;
    res.redirect('/l');
  } else {
    res.send('Nieprawidłowy kod dostępu!');
  }
});

// Obsługa usuwania pliku
app.post('/delete/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  fs.unlink(filePath, (err) => {
    if (err) {
      res.status(404).send('Nie znaleziono pliku lub wystąpił błąd podczas usuwania!');
    } else {
      res.redirect('/l');
    }
  });
});

// Uruchomienie serwera na porcie 3000
app.listen(4000, () => {
  console.log('Serwer uruchomiony na porcie 4000.');
});