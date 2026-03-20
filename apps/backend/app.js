import express from "express";
import { initDB } from "./db.js";
import axios from "axios";

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] ${req.method} ${req.path}`);
  
  if (Object.keys(req.query).length > 0) {
    console.log('  Query:', JSON.stringify(req.query));
  }
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('  Body:', JSON.stringify(req.body));
  }
  
  next();
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

let db;

app.get("/", (req, res) => res.send("Cloud SQL MySQL + Express is running!"));

app.get("/time", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT NOW() AS now");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database query failed");
  }
});

app.get("/tables", async (req, res) => {
  try {
    const [rows] = await db.query("show tables;");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database query failed");
  }
});
app.get("/api/userCopies", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).send("A userId query parameter is required.");
    }
    const sql = `
      SELECT 
        UserCopies.*, 
        b.*, 
        r.rating AS userRating
      FROM UserCopies 
      LEFT JOIN Book b ON b.bookID = UserCopies.bookID 
      LEFT JOIN Review r ON r.bookID = UserCopies.bookID AND r.userID = ?
      WHERE UserCopies.userID = ? 
        AND (UserCopies.is_deleted IS NULL OR UserCopies.is_deleted = 0)
    `;
    const [rows] = await db.query(sql, [userId, userId]);
    console.log(`Retrieved ${rows.length} books for user ${userId}`);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching user copies:", err.message);
    res.status(500).send("Database query failed");
  }
});


app.get("/getBookCover", async (req, res) => {
  try {
    const { isbn } = req.query;
    if (!isbn) {
      return res.status(400).send("A isbn query parameter is required.");
    }
    let coverUrl = null;

    try {
      const googleBooksResponse = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
      const googleBooksData = googleBooksResponse.data;
      if (
        googleBooksData.items &&
        googleBooksData.items[0] &&
        googleBooksData.items[0].volumeInfo &&
        googleBooksData.items[0].volumeInfo.imageLinks &&
        googleBooksData.items[0].volumeInfo.imageLinks.thumbnail
      ) {
        coverUrl = googleBooksData.items[0].volumeInfo.imageLinks.thumbnail.replace(/^http:/, "https:");
      }
    } catch (err) {
      coverUrl = null;
    }
    if (!coverUrl) {
      try {
        const openLibraryResponse = await axios.get(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`);
        const openLibraryData = openLibraryResponse.data;
        if (
          openLibraryData[`ISBN:${isbn}`] &&
          openLibraryData[`ISBN:${isbn}`].cover &&
          openLibraryData[`ISBN:${isbn}`].cover.medium
        ) {
          coverUrl = openLibraryData[`ISBN:${isbn}`].cover.medium;
        }
      } catch (err) {
        coverUrl = null;
      }
    }

    if (!coverUrl) {
      return res.status(404).send("Book cover not found");
    }
    const imageResponse = await axios.get(coverUrl, { responseType: "arraybuffer" });
    const contentType = imageResponse.headers["content-type"] || "image/png";
    res.set("Content-Type", contentType);
    res.send(Buffer.from(imageResponse.data, "binary"));
  } catch (err) {
    console.error(err);
    res.status(500).send("Book cover not found");
  }
});


app.get("/api/auth/login", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ success: false, message: "Username is required" });
    }
    
    const sql = "SELECT userID, username, email, name FROM User WHERE username = ?";
    const [rows] = await db.query(sql, [username]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

app.post("/api/userCopies", async (req, res) => {
  try {
    const { userId, isbn, condition, canExchange } = req.body;

    if (!userId || !isbn) {
      return res.status(400).json({
        success: false,
        message: "userId and isbn are required",
      });
    }

        let bookId = null;

    const [existingBooks] = await db.query(
      "SELECT bookID, title, author FROM Book WHERE isbn = ?",
      [isbn]
    );

    if (existingBooks.length > 0) {
      bookId = existingBooks[0].bookID;
      console.log(`Book already exists: "${existingBooks[0].title}" by ${existingBooks[0].author} (ID: ${bookId})`);
    } else {
            let title = "Unknown Title";
      let author = "Unknown Author";
      let genre = null;
      let publisher = null;
      let yearPublished = null;
      let averageRating = null;

      try {
        const googleBooksResponse = await axios.get(
          `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
        );
        const googleBooksData = googleBooksResponse.data;
        
        console.log(`Fetching from Google Books API (ISBN: ${isbn})`);
        console.log(`Total Items: ${googleBooksData.totalItems}`);
        
        const volumeInfo =
          googleBooksData.items &&
          googleBooksData.items[0] &&
          googleBooksData.items[0].volumeInfo
            ? googleBooksData.items[0].volumeInfo
            : null;

        if (volumeInfo) {
          if (volumeInfo.title) {
            title = volumeInfo.title;
          }

          if (Array.isArray(volumeInfo.authors) && volumeInfo.authors.length > 0) {
            author = volumeInfo.authors.join(", ");
          }

          if (Array.isArray(volumeInfo.categories) && volumeInfo.categories.length > 0) {
            genre = volumeInfo.categories[0];
          }

          if (volumeInfo.publisher) {
            publisher = volumeInfo.publisher;
          }

          if (volumeInfo.publishedDate) {
            const match = String(volumeInfo.publishedDate).match(/^(\d{4})/);
            if (match) {
              yearPublished = parseInt(match[1], 10);
            }
          }

          if (typeof volumeInfo.averageRating === "number") {
            averageRating = volumeInfo.averageRating;
          }
        }
      } catch (err) {
        console.error("Google Books API Error:", err.message);
      }

      console.log(`  → Creating book: "${title}" by ${author}`);

      const [insertResult] = await db.query(
        "INSERT INTO Book (title, genre, author, publisher, yearPublished, averageRating, isbn) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [title, genre, author, publisher, yearPublished, averageRating, isbn]
      );
      bookId = insertResult.insertId;
      console.log(`Book created with ID: ${bookId}`);
    }

        const [userCopyResult] = await db.query(
      "INSERT INTO UserCopies (userID, bookID, `condition`, canExchange) VALUES (?, ?, ?, ?)",
      [
        userId,
        bookId,
        condition || "Good",
        typeof canExchange === "boolean" ? canExchange : true,
      ]
    );

    console.log(`User copy created with ID: ${userCopyResult.insertId}`);

    res.status(201).json({
      success: true,
      copyID: userCopyResult.insertId,
      message: "Book added to your library",
    });
  } catch (err) {
    console.error("Error adding book:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to add book to library",
    });
  }
});

app.get("/api/books/highest-rated", async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 90;
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;

    const [rows] = await db.query("CALL GetHighestRatedBooks(?)", [days]);
    const data = Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows;

    let result = data;

        try {
      if (Array.isArray(data) && data.length > 0) {
        const ids = data.map((b) => b.bookID);
        
                const [bookRows] = await db.query(
          "SELECT bookID, isbn, author, genre, publisher, yearPublished FROM Book WHERE bookID IN (?)",
          [ids]
        );

        const isbnMap = new Map();
        const authorMap = new Map();
        const genreMap = new Map();
        const publisherMap = new Map();
        const yearMap = new Map();
        
        for (const row of bookRows) {
          isbnMap.set(row.bookID, row.isbn);
          authorMap.set(row.bookID, row.author);
          genreMap.set(row.bookID, row.genre);
          publisherMap.set(row.bookID, row.publisher);
          yearMap.set(row.bookID, row.yearPublished);
        }

                const userRatingMap = new Map();
        if (userId) {
          const [ratingRows] = await db.query(
            "SELECT bookID, rating FROM Review WHERE userID = ? AND bookID IN (?)",
            [userId, ids]
          );
          for (const row of ratingRows) {
            userRatingMap.set(row.bookID, row.rating);
          }
        }

        result = data.map((b) => ({
          ...b,
          isbn: isbnMap.get(b.bookID) || null,
          author: authorMap.get(b.bookID) || null,
          genre: genreMap.get(b.bookID) || null,
          publisher: publisherMap.get(b.bookID) || null,
          yearPublished: yearMap.get(b.bookID) || null,
          userRating: userRatingMap.get(b.bookID) || null,
        }));
      }
    } catch (enrichErr) {
      console.error("Failed to enrich with ISBN/ratings:", enrichErr.message);
    }

    console.log(`Returned ${result.length} highest rated books`);
    res.json(result);
  } catch (err) {
    console.error("Failed to fetch highest rated books:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch highest rated books",
    });
  }
});

app.get("/api/books/recommended", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId, 10);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const [rows] = await db.query("CALL GetRecommendedBooks(?)", [userId]);
    const data = Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows;

    let result = data;

        try {
      if (Array.isArray(data) && data.length > 0) {
        const ids = data.map((b) => b.bookID);
        
                const [bookRows] = await db.query(
          "SELECT bookID, isbn, author, genre, publisher, yearPublished FROM Book WHERE bookID IN (?)",
          [ids]
        );

        const isbnMap = new Map();
        const authorMap = new Map();
        const genreMap = new Map();
        const publisherMap = new Map();
        const yearMap = new Map();
        
        for (const row of bookRows) {
          isbnMap.set(row.bookID, row.isbn);
          authorMap.set(row.bookID, row.author);
          genreMap.set(row.bookID, row.genre);
          publisherMap.set(row.bookID, row.publisher);
          yearMap.set(row.bookID, row.yearPublished);
        }

                const userRatingMap = new Map();
        const [ratingRows] = await db.query(
          "SELECT bookID, rating FROM Review WHERE userID = ? AND bookID IN (?)",
          [userId, ids]
        );
        for (const row of ratingRows) {
          userRatingMap.set(row.bookID, row.rating);
        }

        result = data.map((b) => ({
          ...b,
          isbn: isbnMap.get(b.bookID) || null,
          author: authorMap.get(b.bookID) || null,
          genre: genreMap.get(b.bookID) || null,
          publisher: publisherMap.get(b.bookID) || null,
          yearPublished: yearMap.get(b.bookID) || null,
          userRating: userRatingMap.get(b.bookID) || null,
        }));
      }
    } catch (enrichErr) {
      console.error("Failed to enrich with ISBN/ratings:", enrichErr.message);
    }

    console.log(`Returned ${result.length} recommended books for user ${userId}`);
    res.json(result);
  } catch (err) {
    console.error("Failed to fetch recommended books:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recommended books",
    });
  }
});

app.get("/api/books/search", async (req, res) => {
  try {
    const { q, userId } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.json([]);
    }

    const searchTerm = `%${q.trim()}%`;
    
    const sql = `
      SELECT bookID, title, author, genre, publisher, yearPublished, averageRating, isbn
      FROM Book
      WHERE title LIKE ? OR author LIKE ? OR genre LIKE ? OR publisher LIKE ?
      LIMIT 50
    `;

    const [rows] = await db.query(sql, [searchTerm, searchTerm, searchTerm, searchTerm]);

        let result = rows;
    if (userId) {
      try {
        const bookIds = rows.map((b) => b.bookID);
        if (bookIds.length > 0) {
          const [ratingRows] = await db.query(
            "SELECT bookID, rating FROM Review WHERE userID = ? AND bookID IN (?)",
            [userId, bookIds]
          );
          
          const userRatingMap = new Map();
          for (const row of ratingRows) {
            userRatingMap.set(row.bookID, row.rating);
          }

          result = rows.map((b) => ({
            ...b,
            userRating: userRatingMap.get(b.bookID) || null,
          }));
        }
      } catch (enrichErr) {
        console.error("Failed to enrich search results with ratings:", enrichErr.message);
      }
    }

    console.log(`Found ${result.length} books matching "${q}"`);
    res.json(result);
  } catch (err) {
    console.error("Failed to search books:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to search books",
    });
  }
});

app.post("/api/reviews", async (req, res) => {
  try {
    const { userId, bookId, rating } = req.body;

    if (!userId || !bookId || !rating) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: userId, bookId, and rating are required." 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: "Rating must be between 1 and 5." 
      });
    }

        const [existing] = await db.query(
      "SELECT reviewID FROM Review WHERE userID = ? AND bookID = ?",
      [userId, bookId]
    );

    if (existing.length > 0) {
            const updateSql = "UPDATE Review SET rating = ?, reviewDate = NOW() WHERE reviewID = ?";
      await db.query(updateSql, [rating, existing[0].reviewID]);
      
      console.log(`Updated review ${existing[0].reviewID}: ${rating} stars`);
      
      res.json({ 
        success: true,
        message: "Review updated successfully!", 
        reviewId: existing[0].reviewID 
      });
    } else {
            const insertSql = `
        INSERT INTO Review 
        (userID, bookID, rating, reviewDate) 
        VALUES (?, ?, ?, NOW())
      `;
      const [result] = await db.query(insertSql, [userId, bookId, rating]);
      
      console.log(`Created review ${result.insertId}: ${rating} stars`);
      
      res.status(201).json({ 
        success: true,
        message: "Review created successfully!", 
        reviewId: result.insertId 
      });
    }
  } catch (err) {
    console.error("Error creating review:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create review" 
    });
  }
});

app.post("/api/books/refresh/:isbn", async (req, res) => {
  try {
    const { isbn } = req.params;

    if (!isbn) {
      return res.status(400).json({
        success: false,
        message: "ISBN is required"
      });
    }

    console.log(`Refreshing book data for ISBN: ${isbn}`);

        let title = "Unknown Title";
    let author = "Unknown Author";
    let genre = null;
    let publisher = null;
    let yearPublished = null;
    let averageRating = null;

    try {
      const googleBooksResponse = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
      );
      const googleBooksData = googleBooksResponse.data;

      console.log(`Google Books returned ${googleBooksData.totalItems} items`);

      const volumeInfo =
        googleBooksData.items &&
        googleBooksData.items[0] &&
        googleBooksData.items[0].volumeInfo
          ? googleBooksData.items[0].volumeInfo
          : null;

      if (volumeInfo) {
        if (volumeInfo.title) {
          title = volumeInfo.title;
        }

        if (Array.isArray(volumeInfo.authors) && volumeInfo.authors.length > 0) {
          author = volumeInfo.authors.join(", ");
        }

        if (Array.isArray(volumeInfo.categories) && volumeInfo.categories.length > 0) {
          genre = volumeInfo.categories[0];
        }

        if (volumeInfo.publisher) {
          publisher = volumeInfo.publisher;
        }

        if (volumeInfo.publishedDate) {
          const match = String(volumeInfo.publishedDate).match(/^(\d{4})/);
          if (match) {
            yearPublished = parseInt(match[1], 10);
          }
        }

        if (typeof volumeInfo.averageRating === "number") {
          averageRating = volumeInfo.averageRating;
        }
      }
    } catch (err) {
      console.error("Google Books API Error:", err.message);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch data from Google Books"
      });
    }

        const [result] = await db.query(
      "UPDATE Book SET title = ?, author = ?, genre = ?, publisher = ?, yearPublished = ?, averageRating = ? WHERE isbn = ?",
      [title, author, genre, publisher, yearPublished, averageRating, isbn]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found in database"
      });
    }

    console.log(`Updated book: "${title}" by ${author}`);

    res.json({
      success: true,
      message: "Book information updated successfully",
      book: { title, author, genre, publisher, yearPublished, averageRating, isbn }
    });
  } catch (err) {
    console.error("Error refreshing book:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to refresh book information"
    });
  }
});

app.put("/api/userCopies/:copyId", async (req, res) => {
  try {
    const { copyId } = req.params;
    const { condition, canExchange } = req.body;

    if (!copyId) {
      return res.status(400).json({
        success: false,
        message: "Copy ID is required"
      });
    }

    const updates = [];
    const values = [];

    if (condition !== undefined) {
      updates.push("`condition` = ?");
      values.push(condition);
    }

    if (canExchange !== undefined) {
      updates.push("canExchange = ?");
      values.push(canExchange);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update"
      });
    }

    values.push(copyId);

    const sql = `UPDATE UserCopies SET ${updates.join(", ")} WHERE copyID = ?`;
    const [result] = await db.query(sql, values);

    if (result.affectedRows === 0) {
      console.log(`Copy ID ${copyId} not found`);
      return res.status(404).json({
        success: false,
        message: "Book copy not found"
      });
    }

    console.log(`Updated copy ID ${copyId}: condition=${condition}, canExchange=${canExchange}`);
    res.json({
      success: true,
      message: "Book copy updated successfully"
    });
  } catch (err) {
    console.error("Error updating book copy:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to update book copy"
    });
  }
});

app.delete("/api/userCopies/:copyId", async (req, res) => {
  try {
    const { copyId } = req.params;
    
    if (!copyId) {
      return res.status(400).json({ success: false, message: "Copy ID is required" });
    }
    
    const sql = "UPDATE UserCopies SET is_deleted = TRUE WHERE copyID = ?";
    const [result] = await db.query(sql, [copyId]);
    
    if (result.affectedRows === 0) {
      console.log(`Copy ID ${copyId} not found`);
      return res.status(404).json({ success: false, message: "Book copy not found" });
    }
    
    console.log(`Soft-deleted copy ID: ${copyId}`);
    res.json({ success: true, message: "Book deleted successfully" });
  } catch (err) {
    console.error("Error deleting book:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete book" });
  }
});


app.get("/api/clubs", async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.*,
        u.username AS ownerName
      FROM Club c
      LEFT JOIN User u ON u.userID = c.ownerID
      ORDER BY c.dateCreated DESC
    `;
    const [rows] = await db.query(sql);
    console.log(`Retrieved ${rows.length} clubs`);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching clubs:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch clubs"
    });
  }
});

app.get("/api/clubs/my", async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    const sql = `
      SELECT 
        c.*,
        u.username AS ownerName,
        cm.dateJoined
      FROM ClubMembership cm
      JOIN Club c ON c.clubID = cm.clubID
      LEFT JOIN User u ON u.userID = c.ownerID
      WHERE cm.userID = ?
      ORDER BY cm.dateJoined DESC
    `;
    const [rows] = await db.query(sql, [userId]);
    console.log(`  ✓ Retrieved ${rows.length} clubs for user ${userId}`);
    res.json(rows);
  } catch (err) {
    console.error("  ✗ Error fetching user clubs:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user clubs"
    });
  }
});

app.get("/api/clubs/local", async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { userId } = req.query;
    
    if (!userId) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

        await connection.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
    await connection.beginTransaction();

    const days = 90;
    const genre = 'Fiction';
    const targetUser = parseInt(userId, 10);
    const daysActive = 60;

        const adv_query1 = `
      CREATE TEMPORARY TABLE tempActiveClubs AS
      SELECT
          c.clubID,
          c.name AS clubName,
          COUNT(er.requestID) AS recentMemberExchanges
      FROM Club c
      JOIN ClubMembership cm ON c.clubID = cm.clubID
      JOIN ExchangeRequests er 
          ON er.status = 'Completed'
         AND er.dateExchanged >= DATE_SUB(NOW(), INTERVAL ? DAY)
         AND (er.requesterID = cm.userID OR er.receiverID = cm.userID)
      GROUP BY c.clubID, c.name
      ORDER BY recentMemberExchanges / c.memberCount DESC
    `;

    await connection.query(adv_query1, [days]);

        const adv_query2 = `
      CREATE TEMPORARY TABLE tempSimilarPeople AS
      SELECT DISTINCT u.userID
      FROM User u
      WHERE u.location = (
              SELECT location FROM User WHERE userID = ?
          )
        AND u.userID IN (
              SELECT r.userID
              FROM Review r
              JOIN Book b ON r.bookID = b.bookID
              WHERE b.genre = ?
              GROUP BY r.userID
              HAVING COUNT(*) >= 2 AND AVG(r.rating) >= 4
          )
        AND u.userID IN (
              SELECT requesterID 
              FROM ExchangeRequests
              WHERE dateCreated >= DATE_SUB(NOW(), INTERVAL ? DAY)
              UNION
              SELECT receiverID 
              FROM ExchangeRequests
              WHERE dateCreated >= DATE_SUB(NOW(), INTERVAL ? DAY)
          )
        AND u.userID <> ?
    `;

    await connection.query(adv_query2, [targetUser, genre, daysActive, daysActive, targetUser]);

        const query3 = `
      SELECT DISTINCT c.clubID
      FROM tempActiveClubs c
      JOIN ClubMembership cm ON c.clubID = cm.clubID
      JOIN tempSimilarPeople p ON cm.userID = p.userID
    `;

    const [clubIds] = await connection.query(query3);

        let clubs = [];
    if (clubIds.length > 0) {
      const clubIdList = clubIds.map((row) => row.clubID);
      const placeholders = clubIdList.map(() => '?').join(',');
      
      const clubDetailsQuery = `
        SELECT 
          c.*,
          u.username AS ownerName
        FROM Club c
        JOIN User u ON u.userID = c.ownerID
        WHERE c.clubID IN (${placeholders})
        ORDER BY c.memberCount DESC
      `;
      
      const [clubRows] = await connection.query(clubDetailsQuery, clubIdList);
      clubs = clubRows;
    }

        await connection.query("DROP TEMPORARY TABLE IF EXISTS tempActiveClubs");
    await connection.query("DROP TEMPORARY TABLE IF EXISTS tempSimilarPeople");

    await connection.commit();

    console.log(`  ✓ Retrieved ${clubs.length} local clubs for user ${userId}`);
    res.json(clubs);
  } catch (err) {
    await connection.rollback();
    console.error("  ✗ Error fetching local clubs:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch local clubs"
    });
  } finally {
    connection.release();
  }
});

app.get("/api/clubs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        c.*,
        u.username AS ownerName
      FROM Club c
      LEFT JOIN User u ON u.userID = c.ownerID
      WHERE c.clubID = ?
    `;
    const [rows] = await db.query(sql, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Club not found"
      });
    }

    console.log(`Retrieved club ${id}`);
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching club:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch club"
    });
  }
});

app.get("/api/clubs/:id/members", async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        u.userID,
        u.username,
        cm.dateJoined
      FROM ClubMembership cm
      JOIN User u ON u.userID = cm.userID
      WHERE cm.clubID = ?
      ORDER BY cm.dateJoined ASC
    `;
    const [rows] = await db.query(sql, [id]);
    console.log(`Retrieved ${rows.length} members for club ${id}`);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching club members:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch club members"
    });
  }
});

app.post("/api/clubs/:id/join", async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }
    await connection.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
    await connection.beginTransaction();

    const [existing] = await connection.query(
      "SELECT * FROM ClubMembership WHERE userID = ? AND clubID = ?",
      [userId, id]
    );

    if (existing.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: "Already a member of this club"
      });
    }

    const [result] = await connection.query(
      "INSERT INTO ClubMembership (userID, clubID, dateJoined) VALUES (?, ?, NOW())",
      [userId, id]
    );

    const [countResult] = await connection.query(
      "SELECT COUNT(*) as count FROM ClubMembership WHERE clubID = ?",
      [id]
    );
    const actualCount = countResult[0].count;

    await connection.query(
      "UPDATE Club SET memberCount = ? WHERE clubID = ?",
      [actualCount, id]
    );

    await connection.commit();

    console.log(`User ${userId} joined club ${id} (member count: ${actualCount})`);
    res.status(201).json({
      success: true,
      message: "Successfully joined club",
      membershipId: result.insertId
    });
  } catch (err) {
    await connection.rollback();
    console.error("Error joining club:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to join club"
    });
  } finally {
    connection.release();
  }
});

app.delete("/api/clubs/:id/leave", async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    await connection.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
    await connection.beginTransaction();

    const [result] = await connection.query(
      "DELETE FROM ClubMembership WHERE userID = ? AND clubID = ?",
      [userId, id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        message: "Membership not found"
      });
    }

    const [countResult] = await connection.query(
      "SELECT COUNT(*) as count FROM ClubMembership WHERE clubID = ?",
      [id]
    );
    const actualCount = countResult[0].count;

    await connection.query(
      "UPDATE Club SET memberCount = ? WHERE clubID = ?",
      [actualCount, id]
    );

    await connection.commit();

    console.log(`User ${userId} left club ${id} (member count: ${actualCount})`);
    res.json({
      success: true,
      message: "Successfully left club"
    });
  } catch (err) {
    await connection.rollback();
    console.error("Error leaving club:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to leave club"
    });
  } finally {
    connection.release();
  }
});

app.post("/api/clubs", async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { ownerId, name, theme, privacy } = req.body;

    if (!ownerId || !name || !theme || !privacy) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: "ownerId, name, theme, and privacy are required"
      });
    }

        if (privacy !== 'Public' && privacy !== 'Private') {
      connection.release();
      return res.status(400).json({
        success: false,
        message: "privacy must be 'Public' or 'Private'"
      });
    }

    await connection.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
    await connection.beginTransaction();

    const [result] = await connection.query(
      "INSERT INTO Club (name, dateCreated, memberCount, theme, privacy, ownerID) VALUES (?, NOW(), 1, ?, ?, ?)",
      [name, theme, privacy, ownerId]
    );

    const clubId = result.insertId;

    await connection.query(
      "INSERT INTO ClubMembership (userID, clubID, dateJoined) VALUES (?, ?, NOW())",
      [ownerId, clubId]
    );

    await connection.commit();

    console.log(`Created club "${name}" (ID: ${clubId}) by user ${ownerId}`);
    res.status(201).json({
      success: true,
      message: "Club created successfully",
      clubId: clubId
    });
  } catch (err) {
    await connection.rollback();
    console.error("Error creating club:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to create club"
    });
  } finally {
    connection.release();
  }
});

app.delete("/api/clubs/:id", async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    await connection.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
    await connection.beginTransaction();

    const [clubRows] = await connection.query(
      "SELECT ownerID FROM Club WHERE clubID = ?",
      [id]
    );

    if (clubRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        message: "Club not found"
      });
    }

    if (clubRows[0].ownerID !== parseInt(userId, 10)) {
      await connection.rollback();
      connection.release();
      return res.status(403).json({
        success: false,
        message: "Only the club owner can delete the club"
      });
    }

    await connection.query(
      "DELETE FROM ClubMembership WHERE clubID = ?",
      [id]
    );

    await connection.query(
      "DELETE FROM Club WHERE clubID = ?",
      [id]
    );

    await connection.commit();

    console.log(`Deleted club ${id} by owner ${userId}`);
    res.json({
      success: true,
      message: "Club deleted successfully"
    });
  } catch (err) {
    await connection.rollback();
    console.error("Error deleting club:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete club"
    });
  } finally {
    connection.release();
  }
});

app.delete("/api/clubs/:id/members/:userId", async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { id, userId } = req.params;
    const { ownerId } = req.query;

    if (!ownerId) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: "ownerId query parameter is required"
      });
    }

    await connection.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
    await connection.beginTransaction();

    const [clubRows] = await connection.query(
      "SELECT ownerID FROM Club WHERE clubID = ?",
      [id]
    );

    if (clubRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        message: "Club not found"
      });
    }

    if (clubRows[0].ownerID !== parseInt(ownerId, 10)) {
      await connection.rollback();
      connection.release();
      return res.status(403).json({
        success: false,
        message: "Only the club owner can remove members"
      });
    }

    if (parseInt(userId, 10) === parseInt(ownerId, 10)) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: "Cannot remove the club owner"
      });
    }

    const [result] = await connection.query(
      "DELETE FROM ClubMembership WHERE userID = ? AND clubID = ?",
      [userId, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Membership not found"
      });
    }

    const [countResult] = await connection.query(
      "SELECT COUNT(*) as count FROM ClubMembership WHERE clubID = ?",
      [id]
    );
    const actualCount = countResult[0].count;

    await connection.query(
      "UPDATE Club SET memberCount = ? WHERE clubID = ?",
      [actualCount, id]
    );

    await connection.commit();

    console.log(`Removed member ${userId} from club ${id} by owner ${ownerId} (member count: ${actualCount})`);
    res.json({
      success: true,
      message: "Member removed successfully"
    });
  } catch (err) {
    await connection.rollback();
    console.error("Error removing member:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to remove member"
    });
  } finally {
    connection.release();
  }
});

app.get("/api/exchanges/available", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    const sql = `
      SELECT 
        uc.copyID,
        uc.userID,
        uc.condition,
        b.bookID,
        b.title,
        b.author,
        b.isbn,
        u.username AS ownerName
      FROM UserCopies uc
      JOIN Book b ON b.bookID = uc.bookID
      JOIN User u ON u.userID = uc.userID
      WHERE uc.canExchange = TRUE 
        AND uc.userID != ?
        AND (uc.is_deleted IS NULL OR uc.is_deleted = 0)
      ORDER BY b.title
    `;

    const [rows] = await db.query(sql, [userId]);
    console.log(`Retrieved ${rows.length} available books for exchange`);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching available books:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available books"
    });
  }
});

app.get("/api/exchanges/book-owners/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    const sql = `
      SELECT 
        uc.copyID,
        uc.userID,
        uc.condition,
        uc.canExchange,
        b.bookID,
        b.title,
        b.author,
        b.isbn,
        u.username AS ownerName
      FROM UserCopies uc
      JOIN Book b ON b.bookID = uc.bookID
      JOIN User u ON u.userID = uc.userID
      WHERE b.bookID = ?
        AND uc.userID != ?
        AND uc.canExchange = TRUE
        AND (uc.is_deleted IS NULL OR uc.is_deleted = 0)
      ORDER BY u.username
    `;

    const [rows] = await db.query(sql, [bookId, userId]);
    console.log(`Retrieved ${rows.length} owners for book ${bookId}`);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching book owners:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch book owners"
    });
  }
});

app.get("/api/exchanges", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    const sql = `
      SELECT 
        er.*,
        requester.username AS requesterName,
        receiver.username AS receiverName,
        reqBook.title AS requesterBookTitle,
        reqBook.author AS requesterBookAuthor,
        reqBook.isbn AS requesterBookISBN,
        recBook.title AS receiverBookTitle,
        recBook.author AS receiverBookAuthor,
        recBook.isbn AS receiverBookISBN,
        reqCopy.condition AS requesterBookCondition,
        recCopy.condition AS receiverBookCondition
      FROM ExchangeRequests er
      JOIN User requester ON requester.userID = er.requesterID
      JOIN User receiver ON receiver.userID = er.receiverID
      JOIN UserCopies reqCopy ON reqCopy.copyID = er.requesterCopyID
      JOIN UserCopies recCopy ON recCopy.copyID = er.receiverCopyID
      JOIN Book reqBook ON reqBook.bookID = reqCopy.bookID
      JOIN Book recBook ON recBook.bookID = recCopy.bookID
      WHERE er.requesterID = ? OR er.receiverID = ?
      ORDER BY er.dateCreated DESC
    `;

    const [rows] = await db.query(sql, [userId, userId]);
    console.log(`Retrieved ${rows.length} exchange requests for user ${userId}`);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching exchange requests:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exchange requests"
    });
  }
});

app.get("/api/exchanges/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        er.*,
        requester.username AS requesterName,
        receiver.username AS receiverName,
        reqBook.title AS requesterBookTitle,
        reqBook.author AS requesterBookAuthor,
        reqBook.isbn AS requesterBookISBN,
        recBook.title AS receiverBookTitle,
        recBook.author AS receiverBookAuthor,
        recBook.isbn AS receiverBookISBN,
        reqCopy.condition AS requesterBookCondition,
        recCopy.condition AS receiverBookCondition
      FROM ExchangeRequests er
      JOIN User requester ON requester.userID = er.requesterID
      JOIN User receiver ON receiver.userID = er.receiverID
      JOIN UserCopies reqCopy ON reqCopy.copyID = er.requesterCopyID
      JOIN UserCopies recCopy ON recCopy.copyID = er.receiverCopyID
      JOIN Book reqBook ON reqBook.bookID = reqCopy.bookID
      JOIN Book recBook ON recBook.bookID = recCopy.bookID
      WHERE er.requestID = ?
    `;

    const [rows] = await db.query(sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exchange request not found"
      });
    }

    console.log(`Retrieved exchange request ${id}`);
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching exchange request:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exchange request"
    });
  }
});

app.post("/api/exchanges", async (req, res) => {
  try {
    const { requesterID, receiverID, requesterCopyID, receiverCopyID } = req.body;

    if (!requesterID || !receiverID || !requesterCopyID || !receiverCopyID) {
      return res.status(400).json({
        success: false,
        message: "requesterID, receiverID, requesterCopyID, and receiverCopyID are required"
      });
    }

    const [reqCopyCheck] = await db.query(
      "SELECT userID, canExchange FROM UserCopies WHERE copyID = ? AND (is_deleted IS NULL OR is_deleted = 0)",
      [requesterCopyID]
    );

    if (reqCopyCheck.length === 0 || reqCopyCheck[0].userID !== requesterID) {
      return res.status(400).json({
        success: false,
        message: "Requester does not own the specified copy"
      });
    }

    if (!reqCopyCheck[0].canExchange) {
      return res.status(400).json({
        success: false,
        message: "This book copy is not available for exchange"
      });
    }

    const [recCopyCheck] = await db.query(
      "SELECT userID, canExchange FROM UserCopies WHERE copyID = ? AND (is_deleted IS NULL OR is_deleted = 0)",
      [receiverCopyID]
    );

    if (recCopyCheck.length === 0 || recCopyCheck[0].userID !== receiverID) {
      return res.status(400).json({
        success: false,
        message: "Receiver does not own the specified copy"
      });
    }

    if (!recCopyCheck[0].canExchange) {
      return res.status(400).json({
        success: false,
        message: "The requested book copy is not available for exchange"
      });
    }

    const [existing] = await db.query(
      "SELECT requestID FROM ExchangeRequests WHERE requesterID = ? AND receiverID = ? AND requesterCopyID = ? AND receiverCopyID = ? AND status = 'Pending'",
      [requesterID, receiverID, requesterCopyID, receiverCopyID]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "A pending exchange request already exists for these books"
      });
    }

    const [result] = await db.query(
      "INSERT INTO ExchangeRequests (requesterID, receiverID, requesterCopyID, receiverCopyID, dateCreated, status) VALUES (?, ?, ?, ?, NOW(), 'Pending')",
      [requesterID, receiverID, requesterCopyID, receiverCopyID]
    );

    console.log(`Created exchange request ${result.insertId}`);
    res.status(201).json({
      success: true,
      message: "Exchange request created successfully",
      requestID: result.insertId
    });
  } catch (err) {
    console.error("Error creating exchange request:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to create exchange request"
    });
  }
});

app.put("/api/exchanges/:id/accept", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

        const [request] = await db.query(
      "SELECT * FROM ExchangeRequests WHERE requestID = ?",
      [id]
    );

    if (request.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exchange request not found"
      });
    }

    if (request[0].receiverID !== parseInt(userId, 10)) {
      return res.status(403).json({
        success: false,
        message: "Only the receiver can accept this request"
      });
    }

    if (request[0].status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: "This request is no longer pending"
      });
    }

        await db.query(
      "UPDATE ExchangeRequests SET status = 'Accepted', dateExchanged = NOW() WHERE requestID = ?",
      [id]
    );

        await db.query(
      "UPDATE UserCopies SET userID = ? WHERE copyID = ?",
      [request[0].receiverID, request[0].requesterCopyID]
    );

    await db.query(
      "UPDATE UserCopies SET userID = ? WHERE copyID = ?",
      [request[0].requesterID, request[0].receiverCopyID]
    );

    console.log(`Accepted exchange request ${id}`);
    res.json({
      success: true,
      message: "Exchange request accepted successfully"
    });
  } catch (err) {
    console.error("Error accepting exchange request:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to accept exchange request"
    });
  }
});

app.put("/api/exchanges/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

        const [request] = await db.query(
      "SELECT * FROM ExchangeRequests WHERE requestID = ?",
      [id]
    );

    if (request.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exchange request not found"
      });
    }

    if (request[0].receiverID !== parseInt(userId, 10)) {
      return res.status(403).json({
        success: false,
        message: "Only the receiver can reject this request"
      });
    }

    if (request[0].status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: "This request is no longer pending"
      });
    }

        await db.query(
      "UPDATE ExchangeRequests SET status = 'Rejected' WHERE requestID = ?",
      [id]
    );

    console.log(`Rejected exchange request ${id}`);
    res.json({
      success: true,
      message: "Exchange request rejected successfully"
    });
  } catch (err) {
    console.error("Error rejecting exchange request:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to reject exchange request"
    });
  }
});

app.put("/api/exchanges/:id/return", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    const [request] = await db.query(
      "SELECT * FROM ExchangeRequests WHERE requestID = ?",
      [id]
    );

    if (request.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exchange request not found"
      });
    }

    if (request[0].status !== 'Accepted') {
      return res.status(400).json({
        success: false,
        message: "Only accepted exchanges can be marked as returned"
      });
    }

    if (request[0].requesterID !== parseInt(userId, 10) && request[0].receiverID !== parseInt(userId, 10)) {
      return res.status(403).json({
        success: false,
        message: "You are not involved in this exchange"
      });
    }

    if (request[0].isReturned) {
      return res.status(400).json({
        success: false,
        message: "This exchange has already been marked as returned"
      });
    }

    await db.query(
      "UPDATE UserCopies SET userID = ? WHERE copyID = ?",
      [request[0].requesterID, request[0].requesterCopyID]
    );

    await db.query(
      "UPDATE UserCopies SET userID = ? WHERE copyID = ?",
      [request[0].receiverID, request[0].receiverCopyID]
    );

    await db.query(
      "UPDATE ExchangeRequests SET isReturned = TRUE WHERE requestID = ?",
      [id]
    );

    console.log(`Marked exchange request ${id} as returned and swapped books back to original owners`);
    res.json({
      success: true,
      message: "Exchange marked as returned successfully"
    });
  } catch (err) {
    console.error("Error marking exchange as returned:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to mark exchange as returned"
    });
  }
});

(async () => {
  db = await initDB();
  console.log('Database initialized');
})();

export default app;