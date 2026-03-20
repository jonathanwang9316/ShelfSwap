# ShelfSwap

## Project Summary
ShelfSwap is a web application designed to help readers manage their personal book collections and connect with others to exchange books. The platform acts as both a personal digital library and a community-based exchange hub, letting users easily catalog their books, discover others’ collections, and send or receive trade offers.

Unlike static library trackers or marketplace-style book apps, ShelfSwap emphasizes exchange and community. It allows users to browse others’ libraries, propose swaps, and join book clubs with shared interests.	

## Description
ShelfSwap addresses the challenge of disconnected reading communities and unused personal book collections. By allowing convenient book matching and exchange, ShelfSwap allows users to build community with local users and expand their access to new reads without the strain of needing extra storage and expense. 


## Creative Component
To improve functionality and user experience, we propose introducing an Interactive Library Dashboard for users to visually categorize and filter their books by genre or author. To facilitate trades, a Smart Exchange Matching algorithm will recommend potential swaps based on genre preferences, location proximity, and exchange history. Community engagement will be fostered through Book Clubs, allowing users to join or create groups centered around favorite genres or authors, which is further enriched by User Reviews & Ratings from those who have exchanged a title. Finally, Activity Analytics will provide personalized stats such as “Books Exchanged This Year,” helping users reflect on their reading and exchange trends.



## Usefulness

ShelfSwap is a platform designed to transform personal book collections into a dynamic, community-driven library. Its core usefulness comes from blending tangible benefits for the user with broader social and environmental advantages.

### Personal and Economic Value

For the individual, ShelfSwap makes reading more affordable and organized. Users can trade books they've finished for new ones, significantly expanding their reading options without the cost of buying new. This provides a purposeful way to declutter shelves while discovering interesting authors and genres by browsing the collections of other local readers. Critically, the platform's **dual-review system**—for both the book's physical condition and the swap experience itself—builds a foundation of trust and ensures all exchanges are reliable and high-quality.

### Community and Social Connection

Beyond being a simple utility, ShelfSwap is built to foster a real-world community. The ability for users to create and join **local clubs** based on specific themes, subjects, or historical periods is central to this mission. It connects like-minded people in the same area, turning the solitary hobby of reading into a shared social activity. The platform becomes a hub for discussing favorite books, organizing meetups, and sharing recommendations with a trusted local network.

### Environmental Sustainability

At its heart, ShelfSwap promotes a more sustainable approach to reading. By facilitating the reuse of physical books, the platform champions a **circular economy** that reduces waste, minimizes the demand for new printing, and lessens the overall environmental footprint of the publishing industry. It gives readers a powerful and easy way to participate in a more eco-friendly culture.

---


## Realness
Our data sources are from Kaggle. The following are two large datasets with over 250,000 books that are available on Amazon and Goodreads with their respective ISBN numbers.
https://www.kaggle.com/datasets/saurabhbagchi/books-dataset

https://www.kaggle.com/datasets/jealousleopard/goodreadsbooks

## Functionality

### Create
* **User Account & Information**: A new user can create an account by providing a username, email, and password.
* **Exchange Requests**: A user can create and send requests to swap books with other users.
* **Reviews**: A user can write reviews on a specific book and on the quality of a completed swap.
* **Local Clubs**: A user can create local clubs based on common interests like book themes, subjects, or time periods.

### Read
* **Personal Library**: Users can view their personal library to see their full catalog of books and check the status of their exchange requests.
* **Search & Browse**: Any user can search for books, view their reviews and ratings, and browse clubs by interest.
* **Community Feed**: Any user can see a community feed with recent activity, such as new reviews or popular swaps.

### Update
* **Club Membership**: The system updates to add new members to a club.
* **User Credentials**: A user can modify their own account credentials (e.g., password).
* **Book Ratings**: The system updates a book's average rating when a new review is submitted.
* **Exchange Status**: A user can toggle a book's "canExchange" status in their personal library.

### Delete
* **Book Copies**: A user can delete their own copies of available books from their library.
* **Swap Requests**: A user can delete pending swap requests they have sent or received.
* **Club Members**: The creator of a club can remove members.
* **Reviews**: A user can remove reviews they have written.
* **User Account**: A user can delete their account upon request.
### Functionality List
<ol type="a"> <li>Ability for users to catalog personal book collections, including condition and availability.</li> <li>Search function for finding books or users who own specific titles.</li> <li>Option to send, accept, or decline exchange offers between users.</li> <li>Club creation and joining, with member discussions and event listings.</li> <li>Book review and rating system tied to each title.</li> <li>Saved exchange history and ability to view ongoing/past trades.</li> <li>Smart matching algorithm for recommending exchange partners.</li> <li>Ability to update or delete books, reviews, and exchange records.</li> <li>User authentication for secure profiles and saved data.</li> </ol>



### Low-Fidelity UI Mockup
![Mockup](https://github.com/cs411-alawini/fa25-cs411-team108-pineapple/blob/main/doc/pictures/shelfswap.jpg)

### Project Work Distribution

## Soohwan
* **Frontend**: Will build the login, signup, and profile pages, allowing users to manage their credentials and exchange settings.
* **Backend**: Will handle authentication routes and manage the “Users” table in MySQL for secure user data CRUD operations.

---

## Viraj
* **Frontend**: Will create the interactive library dashboard where users can view, add, and categorize their books.
* **Backend**: Will develop connection and maintenance between books and user books for efficient collection management.

---

## Jonathan
* **Frontend**: Will design the interface for proposing and tracking swaps while implementing the smart exchange matching algorithm.
* **Backend**: Will manage the data during exchange routes and maintain book availability and timeline.

---

## Aaron
* **Frontend**: Will build the community features for clubs, book reviews, and reading analytics dashboards.
* **Backend**: Will handle “Clubs” and “Reviews” endpoints and create/maintain new clubs and reviews.




