# Conceptual and Logical Database Design

## 1. UML Diagram

Pictured below is the conceptual UML diagram for the Shelf Swap project. It models 
the relations between users, books, exchange requests, clubs, and more.

![Shelf Swap UML](https://github.com/cs411-alawini/fa25-cs411-team108-pineapple/blob/main/doc/pictures/UML.png)

## 2. Entity Descriptions and Assumptions

### **User**
- **Description:** Represents an individual user using the app.
- **Attributes:** userID (PK), username, email, name, dateJoined, location
- **Why Entity:** Each user is distinct and can interact with other users and clubs.
- **Assumptions:**  
  - The username and email of each user are unique.  
  - Users can create multiple leaderboards and save multiple favorites.

### **UserCopies**
- **Description:** Represents a copy of a book held by a user.
- **Attributes:** copyID (PK), userID (FK), bookID (FK), condition, canExchange
- **Why Entity:** A copy of a book is distinct from an entry in the book database.
- **Assumptions:**  
  - Multiple users can have a copy referring to the same book.
  - A user is free to decide if they want their book to be exchanged.

### **Book**
- **Description:** Represents a book and its information.
- **Attributes:** bookID (PK), title, genre, author, publisher, yearPublished, averageRating, isbn
- **Why Entity:** Each book is distinct and serves as a reference for user copies.
- **Assumptions:**  
  - The averageRating metric is the average of the rating numbers in the review table.
  - The isbn (International Standard Book Number) of each book is unique.

### **ExchangeRequests**
- **Description:** Represents an exchange request between two users.
- **Attributes:** requestID (PK), requesterID (FK), receiverID (FK), requesterCopyID (FK), receiverCopyID (FK), dateCreated, status, dateExchanged, isReturned
- **Why Entity:** Each request between two people is distinct
- **Assumptions:**  
  - Each exchange request is between two people and involves two books.
  - If the status is incomplete, dateExchanged is empty.

### **Review**
- **Description:** Represents a review of a book read by a user.
- **Attributes:** reviewID (PK), userID (FK), bookID (FK), rating, reviewDate
- **Why Entity:** Each review of a book is distinct since a user can make one on each book.
- **Assumptions:**  
  - Each book that a user reads after exchanging is reviewed.
  - The rating of each book is between 1 and 5.

### **Club**
- **Description:** Represents a club with multiple users.
- **Attributes:** clubID (PK), name, dateCreated, memberCount, theme, privacy
- **Why Entity:** Each club of users is distinct from one another. Users in a club are free to act on their own.
- **Assumptions:**  
  - Club names are unique.
  - Theme is allowed to be empty.

## 3. Relationships and Cardinality

| Relationship | Type | Description |
|---------------|------|-------------|
| **User <–> UserCopies** | 1–Many | One user can own multiple copies of different books; Each copy of a book can only be owned by one user. |
| **Book <–> UserCopies** | 1–Many | One book can correspond to multiple user copies; Each user copy corresponds to one book . |
| **User <–> ExchangeRequests** | 1–Many | One user can send multiple exchange requests; Each exchange request is sent by one person. |
| **User <–> ExchangeRequests** | 1–Many | One user can receive multiple exchange requests; Each exchange request is received by one person. |
| **UserCopies <–> ExchangeRequests** | 2–1 | Two user copies (one per user) are involved in an exchange request; Each exchange request involves the exchange of two user copies. |
| **User <–> Review** | 1–Many | One user can write a review on multiple books; Each review is written by one user. |
| **User <–> Club** | 1–1 | One user can own up to one club; Each club is owned by one user. |
| **User <–> Club** | Many–Many | Each user can be in multiple clubs; Each club can have multiple people. This relationship is managed by the associative entity ClubMembership as it is a many-many relationship. |
| **Book <–> Review** | 1–Many | One book can have multiple reviews; Each review is about one book. |

## 4. Normalization Process

Our database is normalized to **Third Normal Form (3NF)** by satisfying requirements for 1NF, 2NF, and 3NF. This allows our database to avoid redundancy, ensure consistency, and maintain efficient relationships.

1. **First Normal Form (1NF)**  
   - All attributes in our entities contain atomic/indivisible values.
   - Each field holds a single value (e.g., one username, one bookID, etc.).
   - For example, the User table only has one entry per attribute per user.

2. **Second Normal Form (2NF)**  
   - All non-key attributes are fully dependent on the primary key.  
   - In each entity table, the non-key attributes are determined by the full primary key.
   - For example, the dateJoined attribute in ClubMembership, an associative table, depends on the full primary key (userID, clubID) and not only on userID or clubID.

3. **Third Normal Form (3NF)**
   - No transitive dependencies exist, as non-key attributes depend only on primary keys
   - For example, each book's bookID determines its author, title, genre, etc. Similarly, attributes like condition and canExchange in UserCopies depend on copyID. Non-key attributes do not depend on each other

## 5. Logical Design (Relational Schema)

User(userID: INT [PK], username: VARCHAR(50), email: VARCHAR(255), name: VARCHAR(100), dateJoined: DATE, location: VARCHAR(100))

UserCopies(copyID: INT [PK], userID: INT [FK to User.userID], bookID: INT [FK to Book.bookID], condition: VARCHAR(50), canExchange: boolean)

Book(bookID: INT [PK], title: VARCHAR(200), genre: VARCHAR(50), author: VARCHAR(100), publisher: VARCHAR(100), yearPublished: INT, averageRating: DECIMAL, isbn: VARCHAR(20))

ExchangeRequests(requestID: INT [PK], requesterID: INT [FK to User.userID], receiverID: INT [FK to User.userID], requesterCopyID: INT [FK to UserCopies.copyID], receiverCopyID: INT [FK to UserCopies.copyID], dateCreated: DATE, status: VARCHAR(50), dateExchanged: DATE, isReturned: boolean)

Review(reviewID: INT [PK], userID: INT [FK to User.userID], bookID: INT [FK to Book.bookID], rating: INT, reviewDate: DATE)

Club(clubID: INT [PK], name: VARCHAR(100), dateCreated: DATE, memberCount: INT, theme: VARCHAR(100), privacy: boolean)

ClubMembership(userID: INT [PK, FK to User.userID], clubID: INT [PK, FK to Club.clubID], dateJoined: DATE)

