const express = require("express");
const app = express();
const port = 8080;
const path = require("path");
const mysql = require("mysql2");
const methodOverride = require("method-override");

require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect((err) => {
  try {
    if (err) {
      console.error("Unable to connect to database");
    } else {
      console.log("Successfully connected to MySQL Server!");
    }
  } catch {
    console.error("Error occured while connecting to the database - ", err);
  }
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.render("login.ejs");
});

app.get("/allusers", (req, res) => {
  const q = "SELECT * FROM users";
  connection.query(q, (err, result) => {
    if (err) {
      res.render("error.ejs", {
        errorMessage: "Error while fetching the data!",
        errorContent: `${err["sqlMessage"]}`,
      });
    } else {
      res.render("allusers.ejs", { users: result });
    }
  });
});

app.delete("/user/:id", (req, res) => {
  let id = req.params.id;
  let q = `DELETE FROM users WHERE id=?`;
  connection.query(q, [id], (err, result) => {
    if (err) {
      res.render("error.ejs", {
        errorMessage: "Error Occured while removing the user!",
        errorContent: `${err["sqlMessage"]}`,
      });
    } else {
      res.redirect("/allusers");
    }
  });
});

app.get("/user/:id", (req, res) => {
  const id = req.params.id;
  const q = "SELECT * FROM users WHERE id = ?";

  connection.query(q, [id], (err, result) => {
    if (err) {
      res.render("error.ejs", {
        errorMessage: "Error Occured while creating the user!",
        errorContent: `${err["sqlMessage"]}`,
      });
    }
    if (result.length === 0) {
      return res.send("User not found!");
    }
    res.render("editUser.ejs", { user: result[0] });
  });
});

app.patch("/user/:id", (req, res) => {
  let id = req.params.id;
  let { username, email, password } = req.body;
  let q = "UPDATE users set username=?, email=?, password=? WHERE id=?";
  connection.query(q, [username, email, password, id], (err, result) => {
    if (err) {
      res.render("error.ejs", {
        errorMessage: "Error Occured while editing the user!",
        errorContent: `${err["sqlMessage"]}`,
      });
    } else {
      res.redirect("/allusers");
    }
  });
});

app.get("/newuser", (req, res) => {
  res.render("newuser.ejs");
});

app.post("/user/signup", (req, res) => {
  const { username, email, password } = req.body;
  let q = "INSERT INTO users(username, email, password) VALUES (?, ?, ?)";
  connection.query(q, [username, email, password], (err, result) => {
    if (err) {
      res.render("error.ejs", {
        errorMessage: "Error Occured while creating the user!",
        errorContent: `${err["sqlMessage"]}`,
      });
    } else {
      res.render("welcome.ejs", { username });
    }
  });
});

app.post("/user", (req, res) => {
  const { identifier, password } = req.body;
  let q = `SELECT username,id FROM users where (email=? OR username=?) AND password=?`;
  connection.query(q, [identifier, identifier, password], (err, result) => {
    if (err) {
      res.send("Error while fetching data.");
    } else {
      if (result.length == 0) {
        res.render("error.ejs", {
          errorMessage: "User does not exist!",
          errorContent: "Inavlid email or password.",
        });
      } else {
        res.render("welcome.ejs", { username: `${result[0].username}` });
      }
    }
  });
});

app.listen(port, () => {
  console.log(`Server successfully started on ${port}`);
});
