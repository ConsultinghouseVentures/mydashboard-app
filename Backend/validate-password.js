const bcrypt = require('bcrypt');

// Hashed password from your database
const hashedPassword = '$2b$10$ViNPXxXk6MppnMnXuFbhTOquWZgh2XsgBXoIUoRmZvOjkgeo9dTXy';

// Plain text password to test
const plainPassword = 'password123'; // Change this to the password you want to test

// Compare the passwords
bcrypt.compare(plainPassword, hashedPassword, (err, result) => {
  if (err) {
    console.error('Error comparing passwords:', err);
  } else {
    console.log('Password match:', result); // true if match, false if not
  }
});