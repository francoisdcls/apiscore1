require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());

// --- CONFIGURATION DE LA BASE DE DONNÉES ---

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err);
  } else {
    console.log('Connecté à la base de données MySQL');
  }
});

// --- ROUTES API ---

// Health check
app.get('/api/healthz', (req, res) => {
  res.json({ ok: true });
});


// =======================
// ROUTE : LISTE DES MATCHS
// =======================
app.get('/api/matches', (req, res) => {

  const query = `
    SELECT
      m.match_id,
      c.year,
      m.round_name,
      m.match_date,

      p1.first_name AS player1_firstname,
      p1.last_name  AS player1_lastname,

      p2.first_name AS player2_firstname,
      p2.last_name  AS player2_lastname,

      r.player1_score,
      r.player2_score,

      pw.first_name AS winner_firstname,
      pw.last_name  AS winner_lastname

    FROM matches m
    JOIN championships c ON c.championship_id = m.championship_id
    JOIN players p1 ON p1.player_id = m.player1_id
    JOIN players p2 ON p2.player_id = m.player2_id
    LEFT JOIN match_results r ON r.match_id = m.match_id
    LEFT JOIN players pw ON pw.player_id = r.winner_id

    ORDER BY m.match_date ASC
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur lors de la récupération des matchs' });
    } else {
      res.json(results);
    }
  });
});

// =======================
// ROUTE : LISTE DES JOUEURS
// =======================
app.get('/api/players', (req, res) => {
  connection.query('SELECT * FROM players ORDER BY last_name', (err, results) => {
    if (err) res.status(500).json({ error: 'Erreur joueurs' });
    else res.json(results);
  });
});

// =======================
// ROUTE : PALMARES DES JOUEURS
// =======================

app.get('/api/champions', (req, res) => {
  const query = `
    SELECT
      p.first_name,
      p.last_name,
      COUNT(*) AS titles
    FROM match_results r
    JOIN matches m ON m.match_id = r.match_id
    JOIN players p ON p.player_id = r.winner_id
    WHERE m.round_name = 'Finale'
    GROUP BY p.player_id
    ORDER BY titles DESC
  `;

  connection.query(query, (err, results) => {
    if (err) res.status(500).json({ error: 'Erreur palmarès' });
    else res.json(results);
  });
});

app.get('/', (req, res) => {
  res.send('API Fléchettes – OK 🚀');
});

// --- DÉMARRAGE DU SERVEUR ---

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Serveur API lancé sur http://localhost:${PORT}`);
});
