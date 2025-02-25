# ryadom team 

## Installation

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Create a `.env` file and add your environment variables.
4. Run `npm start` to start the server.

## API Endpoints

- **Users**
  - `GET /api/users/:id` - Get user by ID.
  - `POST /api/users/register` - Register a new user.
  - `POST /api/users/login` - Login a user.

- **Psychologists**
  - `POST /api/psychologists/register` - Register a new psychologist.

- **Sessions**
  - `POST /api/sessions/book` - Book a new session.