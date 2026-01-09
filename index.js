require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors()); // Très important pour Render

// Configuration de la base de données
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false } // INDISPENSABLE pour Aiven sur Render
});

connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion MySQL:', err);
  } else {
    console.log('Connecté à la base de données MySQL');
  }
});

// Route de base pour vérifier que l'API est en ligne
app.get('/', (req, res) => {
  res.send('API Fléchettes – OK 🚀');
});

// Route principale pour les matchs
app.get('/api/matches', (req, res) => {
  const query = `
    SELECT
      m.match_id,
      m.match_date,
      m.round_name,
      -- Fusion du prénom et nom pour créer 'player1'
      CONCAT(p1.first_name, ' ', p1.last_name) AS player1,
      -- Fusion du prénom et nom pour créer 'player2'
      CONCAT(p2.first_name, ' ', p2.last_name) AS player2,
      r.player1_score,
      r.player2_score,
      -- Fusion pour le gagnant
      CONCAT(pw.first_name, ' ', pw.last_name) AS winner
    FROM matches m
    JOIN players p1 ON p1.player_id = m.player1_id
    JOIN players p2 ON p2.player_id = m.player2_id
    LEFT JOIN match_results r ON r.match_id = m.match_id
    LEFT JOIN players pw ON pw.player_id = r.winner_id
    ORDER BY m.match_date ASC
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur SQL' });
    } else {
      res.json(results);
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});