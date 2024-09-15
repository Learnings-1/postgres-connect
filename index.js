const { Client } = require("pg");
const express = require("express");
require("dotenv").config();
const app = express();
app.use(express.json());
var xsenv = require("@sap/xsenv");
xsenv.loadEnv();

var services = xsenv.readServices();

postgress_db = services["postgress-trial-personal"];
// Load PostgreSQL credentials from VCAP_SERVICES environment variable
const postgresCredentials = postgress_db.credentials;

// Set up PostgreSQL client
const client = new Client({
  host: postgresCredentials.hostname,
  port: postgresCredentials.port,
  user: postgresCredentials.username,
  password: postgresCredentials.password,
  database: postgresCredentials.dbname,
  ssl: { rejectUnauthorized: false },
});

// Connect to the database
client
  .connect()
  .then((res) => {
    console.log("Connected to PostgreSQL!");

    // Start your Express server (or other logic) after successful DB connection
  })
  .catch((err) => {
    console.error("Failed to connect to PostgreSQL:", err.stack);
    process.exit(1); // Exit with failure if the DB connection fails
  });

app.get("/", (req, res) =>
  client.query("SELECT NOW()").then((result) => {
    res.send(`Connected to PostgreSQL. Server time: ${result.rows[0].now}`);
  })
);

app.get("/create-table", (req, res) => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(100) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  client
    .query(createTableQuery)
    .then((res) => {
      res.send(res);
    })
    .catch((error) => {
      res.status(500).send("Failed to create table.");
    });
});

// Route to insert a new user into the `users` table
app.post("/add-user", (req, res) => {
  const { name, email } = req.query;
  if (!name || !email) {
    return res.status(400).send("Name and email are required.");
  }

  const insertUserQuery = `
    INSERT INTO users (name, email)
    VALUES ($1, $2)
    RETURNING *;
  `;

  client
    .query(insertUserQuery, [name, email])
    .then((result) => {
      res.status(201).send(`User added with ID: ${result.rows[0].id}`);
    })
    .catch((err) => {
      console.error("Error inserting user:", err.stack);
      res.status(500).send("Failed to insert user.");
    });
});

// Route to get all users from the `users` table
app.get("/users", (req, res) => {
  const selectUsersQuery = "SELECT * FROM users ORDER BY id ASC;";

  client
    .query(selectUsersQuery)
    .then((result) => {
      res.status(200).json(result.rows);
    })
    .catch((err) => {
      console.error("Error fetching users:", err.stack);
      res.status(500).send("Failed to fetch users.");
    });
});

// Route to update a user's details (name, email) by ID
app.put("/update-user/:id", (req, res) => {
  const userId = req.params.id;
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).send("Name and email are required.");
  }

  const updateUserQuery = `
    UPDATE users
    SET name = $1, email = $2
    WHERE id = $3
    RETURNING *;
  `;

  client
    .query(updateUserQuery, [name, email, userId])
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(404).send("User not found.");
      }
      res.status(200).send(`User with ID: ${userId} updated successfully.`);
    })
    .catch((err) => {
      console.error("Error updating user:", err.stack);
      res.status(500).send("Failed to update user.");
    });
});

// Route to delete a user by ID
app.delete("/delete-user/:id", (req, res) => {
  const userId = req.params.id;

  const deleteUserQuery = `
    DELETE FROM users
    WHERE id = $1
    RETURNING *;
  `;

  client
    .query(deleteUserQuery, [userId])
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(404).send("User not found.");
      }
      res.status(200).send(`User with ID: ${userId} deleted successfully.`);
    })
    .catch((err) => {
      console.error("Error deleting user:", err.stack);
      res.status(500).send("Failed to delete user.");
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
