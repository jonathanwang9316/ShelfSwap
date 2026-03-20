# Shelf Swap Final Report

## Project Directional Changes
Our original proposal differed significantly from our current project, as we had an entirely different idea. Our original proposal was for a chess opening simulator that would store chess openings in a database and teach the user how to play against different opening moves. However, we realized later that this would be pretty impractical to make using a database, as its components are visual and the possibilities are endless. As a result, we pivoted our idea to what it currently is, which works a lot better with databases.

## Application Usefulness
Our application was able to achieve things like sending book exchanges and storing book reviews, but this is more practical on paper and less in reality. Without a multitude of users in a user's local area, there is little incentive for them to use our application. Instead of traveling a long distance to exchange or return a book, it becomes a lot more efficient to just go to their local library. Furthermore, many people no longer own or read physical books, so our audience is even more niche. As a result, our application would not be very useful in the real world unless we suddenly got a lot of users.

## Schema/Data Changes
Our data schema did not change much from our original implementation, though some attributes in Club and Book were changed (ex. removed description in Book and added isbn). Additionally, although we intended to source our data entirely from Kaggle, we ended up having to generate data for many of our tables as we needed more data than what Kaggle had.

## UML/Table Changes
Our UML diagram and table implementations did not change too much, as we were pretty comprehensive with our original design. However, we did have to add different attribute constraints that were not mentioned originally. We also had to add a table for ClubMembership since Club and User had a many-many relationship. Essentially, while our UML design did not change, our actual table implementation required additional information not included in the diagram. In the end, our table implementation was very suitable for our app.

## Added/Removed Functionalities
We did not have to remove any functionalities at any point in stage 4, as everything we added was necessary. Besides the basic functions as listed in the project requirements, we added many functionalities like a search bar (with filters), a recommendation section based on user interest and popularity, a login system, and a personal library page. All of these functionalities were made to enhance user experience as if it were a real application.

## Advanced Database Programs
Our advanced database programs complement our application pretty well, as most of them are made for the purpose of enhancing user experience. For example, our stored procedures allowed users to receive book recommendations based on their interests and popularity, while our transaction allows a user to join a club based on its location and interests. Additionally, trigger was used to update the average rating for books. Overall, these advanced database programs are able to guide a new user through our website relatively easily.

## Technical Challenges
Some technical challenges that the team encountered were:
Viraj - An issue we encountered while implementing our recommendation algorithm was that it was very slow to load the book covers of all recommended books, even when most of them are off-screen. As a result, we figured out that we could load them procedurally by loading only those that are visible on the screen, which made it both functionally and visually appealing.
Soohwan - An issue we encountered while starting our application was the creation of our GCP instance and setting the firewall/user authentication. Since none of us had used this before, it took a long time to figure out, and we wasted a lot of time during our first meeting before we were even able to start. We also did not realize that we had to lower our settings for storage and CPU. This made us drain our credits and have to start a new account to avoid paying, which wasted even more time.
Aaron - An issue we encountered when starting our SQL database was figuring out the authentication cloud sequence keys in NodeJS. We did not know how to set this up, and it took us a lot of time before we were even able to get one of our computers connected to the data. We also ran into other issues, like having to be connected to a certain wifi network, or our Windows computers not being able to connect.
Jonathan - An issue we encountered when implementing our database tables was generating fake data. Since Kaggle did not have the correct data that we wanted (topic and quantity), we ended up having to figure out how to generate our own data. We ended up generating our data with Python scripts, but it took a while to figure out, which delayed our progress. We probably should have done this beforehand to avoid the bottleneck.

## Other Changes
Not much else changed, comparing the final application with the original proposal, other than what was previously mentioned, especially as our original idea was completely different. From our first proposal for ShelfSwap, the only major thing that was added was Clubs, since we needed another table to work with.

## Future Improvements
Overall, other than the interface, the application can still improve on aspects such as quality of life. There are still many little things we could do to improve the user experience, such as the ability to update clubs, delete reviews, and more. None of these aspects is fully necessary to implement, but they do make a user's life much easier, which is why we could still improve.

## Labor Division
Our final division of labor went as follows:
Viraj -  Did most of the code editing since it was easier to work on a single device.
Soohwan - Helped manage the GCP database and helped Viraj with coding.
Aaron - Made an outline for what the application needs to include and wrote code for its elements.
Jonathan - Wrote the project report and wrote code for elements like stored procedures.
We managed teamwork well since most of the tasks had multiple people working on them, meaning we could cover for each other. Also, we did different tasks concurrently. For example, if the GCP had trouble, another person could still write code on the Google Doc while waiting for the database to go online, and another could work on the final report.

## Project Video
[Link](https://www.youtube.com/watch?v=_raoSWHUEeM&feature=youtu.be)
