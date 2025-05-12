# 📝 Note-Taking Application

This project allow the user to do the CRUD(Create, Read, Update, and Delete) operations with good UI and real time notifications while registering, login, and deleting, updating the notes.

##Features

- **User Authentication**
  - It authenticate the user to secure login and registration for the CRUD operations with username, email, and password
  - It is JWT-based authentication
  - Password encryption and persistent login sessions

- **Note Management**
  - It includes create, read, update, and delete notes: To create the note: click New Note in the sidebar>fill the titile and content>click save note whereas to edit the note: click edit button>modify the content and save or cancel the changes. Similarly, for searching notes: use the search bar at the top>result update in real time>searches through both titles and content. Furthermore, to use the Theme Toggle: click the theme toggle button and then preferences is saved for the next visists.
  - It does the rich text editing
  - It also perform the real-time search functionality for easy access to target note

- **UI/UX**
  - It has clean interface 
  - Also include the Dark/Light theme toggle functionality
  - It also toast notifications for the user feedback
  - Also include the responsive design for all screen sizes, and hover effects

- **Quotes**
  - It shows the random motivational quotes on sidebar

##

- **Front-end**
  - HTML
  - CSS
  - JavaScript
  - Toastify-js(notifications)
  - Font Awesome(icons)

- **Back-end**
  - Node.js
  - Express.js
  - NeDB
  - JWT for authentication
  - bcrypt for password hashing

##

#. To start the server: npm start and to create the .JSON file: npm init -y

#. Server running on: http://localhost:3000
